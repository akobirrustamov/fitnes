CREATE OR REPLACE FUNCTION add_terminal(
    p_organization_id INT,
    p_name VARCHAR,
    p_incoming BOOLEAN,
    p_delete BOOLEAN,
    p_ip VARCHAR,
    p_login VARCHAR,
    p_password VARCHAR,
    p_description VARCHAR DEFAULT NULL,
    p_filter VARCHAR DEFAULT NULL,
    p_model TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_organization_exists BOOLEAN;
    v_name_exists BOOLEAN;
    v_max_terminals INT;
    v_current_count INT;
    v_terminal_id INT;
    v_login_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM terminals
        WHERE terminals.login = p_login
        AND terminals.deleted = false
    ) INTO v_login_exists;

    IF v_login_exists THEN
        RETURN -4; -- Bu login mavjud allaqachon
    END IF;

    -- Organization mavjudligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM organizations WHERE organizations.id = p_organization_id AND organizations.deleted = false
    ) INTO v_organization_exists;

    IF NOT v_organization_exists THEN
        RETURN -1; -- Organization topilmadi
    END IF;

    -- Max terminals count ni api_settings dan olamiz
    SELECT COALESCE(
        (SELECT CAST(value AS INT)
         FROM api_settings
         WHERE organization_id = p_organization_id
         AND name = 'max_terminals_count'
         AND deleted = false
         LIMIT 1),
        50 -- default qiymat
    ) INTO v_max_terminals;

    -- Hozirgi terminals sonini tekshiramiz (shu organization uchun)
    SELECT COUNT(*)
    FROM terminals
    WHERE organization_id = p_organization_id
    AND deleted = false
    INTO v_current_count;

    -- Limit tekshiramiz
    IF v_current_count >= v_max_terminals THEN
        RETURN -2; -- Terminal limit reached
    END IF;

    -- Name va OrganizationId kombinatsiyasi unikal ekanligini tekshiramiz (deleted = false bo'lganlar orasida)
    SELECT EXISTS (
        SELECT 1 FROM terminals
        WHERE terminals.name = p_name
        AND terminals.organization_id = p_organization_id
        AND terminals.deleted = false
    ) INTO v_name_exists;

    IF v_name_exists THEN
        RETURN -3; -- Bu organizationda bunday nom allaqachon mavjud
    END IF;

    -- Terminal qo'shamiz
    INSERT INTO terminals (
        organization_id, name, description, filter, created_time, last_online,
        ip, login, password, model, deleted, is_coming
    ) VALUES (
        p_organization_id, p_name, p_description, p_filter, now(), now(),
        p_ip, p_login, p_password, p_model, false, p_incoming
    ) RETURNING id INTO v_terminal_id;

    insert into tasks(person_id, organization_id, terminal_id, status, created_time, deleted, task_type, data) values(
        0, p_organization_id, v_terminal_id, 0, now(), false, 5, p_delete::varchar
    );
    PERFORM create_terminal_tasks(v_terminal_id, p_organization_id);

    RETURN v_terminal_id; -- Yangi terminal ning ID-si qaytariladi

END;
$$ LANGUAGE plpgsql;
