-- Terminal add uchun barcha personlar uchun task yaratish funksiyasi
CREATE OR REPLACE FUNCTION create_terminal_tasks(
    p_terminal_id INT,
    p_organization_id INT
) RETURNS VOID AS $$
DECLARE
    person_record RECORD;
BEGIN
    -- Shu organizationdagi barcha faol personlar uchun task yaratish
    FOR person_record IN
        SELECT person.* FROM person 
        WHERE person.organization_id = p_organization_id 
        AND person.deleted = false
        ORDER BY person.fullname asc
    LOOP
        INSERT INTO tasks (person_id, organization_id, terminal_id, status, created_time, deleted, task_type, data)
        VALUES (person_record.id, p_organization_id, p_terminal_id, 0, clock_timestamp(), false, 1, person_record.fullname);
    END LOOP;

    FOR person_record IN
        SELECT person.* FROM person 
        WHERE person.organization_id = p_organization_id 
        AND person.deleted = false
        AND person.photo_url is not null
        AND person.photo_url != ''
        ORDER BY person.fullname asc
    LOOP
        INSERT INTO tasks (person_id, organization_id, terminal_id, status, created_time, deleted, task_type, data)
        VALUES (person_record.id, p_organization_id, p_terminal_id, 0, clock_timestamp(), false, 4, person_record.photo_url);
    END LOOP;

    update person set photo_status = 0 where person.deleted = false and person.organization_id = p_organization_id and person.photo_url is not null AND person.photo_url != '';
END;
$$ LANGUAGE plpgsql;
