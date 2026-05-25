CREATE OR REPLACE FUNCTION delete_terminal(
    p_id INT,
    p_organization_id INT
) RETURNS INT AS $$
DECLARE
    v_terminal_exists BOOLEAN;
    v_last_photo_url VARCHAR;
    v_pending_tasks_count INT;
    person_record RECORD;
BEGIN
    -- Terminal mavjudligini va shu organizationga tegishli ekanligini tekshiramiz (deleted = false)
    SELECT EXISTS (
        SELECT 1 FROM terminals 
        WHERE terminals.id = p_id 
        AND terminals.organization_id = p_organization_id
        AND terminals.deleted = false
    ) INTO v_terminal_exists;

    IF NOT v_terminal_exists THEN
        RETURN -1; -- Terminal topilmadi yoki boshqa organizationga tegishli yoki allaqachon o'chirilgan
    END IF;

    -- Terminal ni o'chiramiz (soft delete)
    UPDATE terminals 
    SET deleted = true
    WHERE terminals.id = p_id 
    AND terminals.organization_id = p_organization_id
    AND terminals.deleted = false;

    update tasks
    set deleted = true
    where tasks.terminal_id = p_id;

        -- photo_status = 0 bo'lgan barcha personlar uchun tekshirish
    FOR person_record IN 
        SELECT id FROM person 
        WHERE organization_id = p_organization_id 
        AND photo_status = 0
        AND photo_url != ''
        AND photo_url IS NOT NULL
        AND deleted = false
    LOOP
        SELECT tasks.data INTO v_last_photo_url 
        FROM tasks 
        WHERE tasks.task_type = 4 
        AND tasks.organization_id = p_organization_id 
        AND tasks.status = 1
        AND tasks.person_id = person_record.id
        AND tasks.deleted = false
        ORDER BY tasks.created_time DESC 
        LIMIT 1;
        IF v_last_photo_url IS NOT NULL THEN
            -- Har bir person uchun shu photo URL bo'yicha status != 1 bo'lgan tasklar sonini sanash
            SELECT COUNT(*) INTO v_pending_tasks_count
            FROM tasks t
            WHERE t.person_id = person_record.id
            AND t.organization_id = p_organization_id
            AND t.task_type = 4
            AND t.data = v_last_photo_url
            AND t.status != 1  -- muvaffaqiyatsiz tasklar (0 yoki 2)
            AND t.deleted = false;

            -- Agar pending tasklar yo'q bo'lsa, person photo_status ni 1 ga o'zgartirish
            IF v_pending_tasks_count = 0 THEN
                UPDATE person
                SET photo_status = 1
                WHERE id = person_record.id
                AND organization_id = p_organization_id;
            END IF;
        END IF;
    END LOOP;

    RETURN p_id; -- O'chirilgan terminal ning ID-si qaytariladi
END;
$$ LANGUAGE plpgsql;
