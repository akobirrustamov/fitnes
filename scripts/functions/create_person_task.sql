CREATE OR REPLACE FUNCTION create_person_tasks(
    p_person_id INT,
    p_organization_id INT,
    p_task_type INT,
    p_data varchar(2000)
) RETURNS VOID AS $$
DECLARE
    terminal_record RECORD;
BEGIN
    FOR terminal_record IN
        SELECT id FROM terminals 
        WHERE organization_id = p_organization_id 
        AND deleted = false
    LOOP
        INSERT INTO tasks (person_id, organization_id, terminal_id, status, created_time, deleted, task_type, data)
        VALUES (p_person_id, p_organization_id, terminal_record.id, 0, now(), false, p_task_type, p_data);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
