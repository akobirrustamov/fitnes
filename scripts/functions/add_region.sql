CREATE OR REPLACE FUNCTION add_region(
    p_name VARCHAR(50),
    p_login VARCHAR(30),
    p_password VARCHAR(30),
    p_password_hint VARCHAR(500),
    p_token VARCHAR,
    p_province_id INT,
    p_description VARCHAR(100),
    p_director_name VARCHAR(100),
    p_location VARCHAR(200),
    p_business_sphere VARCHAR(100),
    p_phone_number VARCHAR(15),
    p_photo_url VARCHAR(500)
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
    v_role_id INT;
BEGIN
    -- Province mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM provinces WHERE id = p_province_id AND deleted = false) THEN
        RETURN -3; -- Province not found
    END IF;
    
    -- Login tekshiruvi
    IF EXISTS (
        SELECT 1 FROM organizations WHERE organizations.login = p_login and organizations.deleted = false
        UNION
        SELECT 1 FROM users WHERE users.login = p_login and users.deleted = false
        UNION
        SELECT 1 FROM monitors WHERE monitors.login = p_login and monitors.deleted = false
        UNION
        SELECT 1 FROM provinces WHERE provinces.login = p_login and provinces.deleted = false
        UNION
        SELECT 1 FROM regions WHERE regions.login = p_login and regions.deleted = false
    ) THEN
        RETURN -1; -- Login already exists
    END IF;
    
    -- Name tekshiruvi (bir xil province ichida)
    IF EXISTS (SELECT 1 FROM regions WHERE name = p_name AND province_id = p_province_id AND deleted = false) THEN
        RETURN -2; -- Name already exists in this province
    END IF;
    select roles.id into v_role_id from roles where roles.deleted = false and roles.short_name = 'region';
    
    -- Yangi region yaratish
    INSERT INTO regions (
        name, login, password, password_hint, token, province_id, description,
        director_name, location, business_sphere, phone_number, photo_url,
        created_time, deleted, active, role_id, last_login
    ) VALUES (
        p_name, p_login, p_password, p_password_hint, p_token, p_province_id, p_description,
        p_director_name, p_location, p_business_sphere, p_phone_number, p_photo_url,
        NOW(), false, true, v_role_id, NOW()
    ) RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;
