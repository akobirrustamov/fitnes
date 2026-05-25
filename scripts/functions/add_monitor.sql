CREATE OR REPLACE FUNCTION add_monitor(
    p_name VARCHAR,
    p_login VARCHAR,
    p_password VARCHAR,
    p_description VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_login_exists BOOLEAN;
    v_monitor_id INT;
    v_role_id INT;
BEGIN
    -- Login unikal ekanligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM organizations WHERE organizations.login = p_login and organizations.deleted = false
        UNION
        SELECT 1 FROM users WHERE users.login = p_login and users.deleted = false
        UNION
        SELECT 1 FROM monitors WHERE monitors.login = p_login and monitors.deleted = false
        UNION
        SELECT 1 FROM provinces WHERE provinces.login = p_login and provinces.deleted = false
        UNION
        SELECT 1 FROM regions WHERE regions.login = p_login and regions.deleted = false
    ) INTO v_login_exists;
    
    IF v_login_exists THEN
        RETURN -1; -- Login allaqachon mavjud
    END IF;
    
    -- 'monitoring' rolini topamiz
    SELECT id INTO v_role_id FROM roles WHERE short_name = 'monitoring' LIMIT 1;
    
    IF v_role_id IS NULL THEN
        RETURN -2; -- Role 'monitoring' topilmadi
    END IF;
    
    -- Monitor qo'shamiz
    INSERT INTO monitors (
        name, description, login, password, active, deleted, role_id, created_time, last_login
    ) VALUES (
        p_name, p_description, p_login, p_password, true, false, v_role_id, NOW(), NOW()
    ) RETURNING id INTO v_monitor_id;
    
    RETURN v_monitor_id; -- Yangi monitor ning ID-si qaytariladi
END;
$$ LANGUAGE plpgsql;
