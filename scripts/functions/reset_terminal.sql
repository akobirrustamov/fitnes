CREATE OR REPLACE FUNCTION reset_terminal(
    p_organization_id INT,
    p_terminal_id INT
) RETURNS INT AS $$
DECLARE
    v_name_exists BOOLEAN;
BEGIN
    -- Name va OrganizationId kombinatsiyasi unikal ekanligini tekshiramiz (deleted = false bo'lganlar orasida)
    SELECT EXISTS (
        SELECT 1 FROM terminals
        WHERE terminals.id = p_terminal_id
        AND terminals.organization_id = p_organization_id
        AND terminals.deleted = false
    ) INTO v_name_exists;

    IF not v_name_exists THEN
        RETURN -1; -- Bu organizationda bunday terminal mavjud emas
    END IF;
    
    update tasks
    set deleted = true WHERE
    tasks.deleted = false and tasks.terminal_id = p_terminal_id;
    
    insert into tasks(person_id, organization_id, terminal_id, status, created_time, deleted, task_type, data) values(
        0, p_organization_id, p_terminal_id, 0, now(), false, 5, 'true'
    );
    PERFORM create_terminal_tasks(p_terminal_id, p_organization_id);

    RETURN p_terminal_id; -- Yangi terminal ning ID-si qaytariladi

END;
$$ LANGUAGE plpgsql;
