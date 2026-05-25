CREATE OR REPLACE FUNCTION update_terminal(
    p_id INT,
    p_organization_id INT,
    p_name VARCHAR,
    p_incoming BOOLEAN,
    p_description VARCHAR DEFAULT NULL,
    p_filter VARCHAR DEFAULT NULL,
    p_ip VARCHAR DEFAULT NULL,
    p_login VARCHAR DEFAULT NULL,
    p_password VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_terminal_exists BOOLEAN;
    v_organization_exists BOOLEAN;
    v_name_exists BOOLEAN;
BEGIN
    -- Terminal mavjudligini va shu organizationga tegishli ekanligini tekshiramiz (deleted = false)
    SELECT EXISTS (
        SELECT 1 FROM terminals 
        WHERE terminals.id = p_id 
        AND terminals.organization_id = p_organization_id
        AND terminals.deleted = false
    ) INTO v_terminal_exists;

    IF NOT v_terminal_exists THEN
        RETURN -1; -- Terminal topilmadi yoki boshqa organizationga tegishli yoki o'chirilgan
    END IF;

    -- Organization mavjudligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM organizations WHERE organizations.id = p_organization_id AND organizations.deleted = false
    ) INTO v_organization_exists;

    IF NOT v_organization_exists THEN
        RETURN -2; -- Organization topilmadi
    END IF;

    -- Name va OrganizationId kombinatsiyasi unikal ekanligini tekshiramiz (deleted = false bo'lganlar orasida)
    SELECT EXISTS (
        SELECT 1 FROM terminals 
        WHERE terminals.name = p_name 
        AND terminals.organization_id = p_organization_id 
        AND terminals.deleted = false
        AND terminals.id != p_id
    ) INTO v_name_exists;

    IF v_name_exists THEN
        RETURN -3; -- Bu organizationda bunday nom allaqachon mavjud
    END IF;

    -- Terminal ni yangilaymiz
    UPDATE terminals
    SET name = p_name,
        description = p_description,
        filter = p_filter,
        ip = p_ip,
        login = p_login,
        password = p_password,
        is_coming = p_incoming
    WHERE terminals.id = p_id
    AND terminals.organization_id = p_organization_id 
    AND terminals.deleted = false;

    RETURN p_id; -- Yangilangan terminal ning ID-si qaytariladi
END;
$$ LANGUAGE plpgsql;
