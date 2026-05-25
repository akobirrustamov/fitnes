-- Yangi login funksiyasi
CREATE OR REPLACE FUNCTION login_with_hint(
    p_login VARCHAR,
    p_password VARCHAR
) RETURNS TABLE(
    user_id INTEGER,
    role_name TEXT,
    role_id int,
    password_hint VARCHAR,
    active BOOLEAN,
    password_correct BOOLEAN
) AS $$
BEGIN
    -- Users jadvalidan tekshirish
    RETURN QUERY
    SELECT 
        users.id,
        'super_admin'::TEXT,
        users.role_id,
        users.password_hint,
        users.active,
        (users.password = p_password) as password_correct
    FROM users
    WHERE LOWER(users.login) = LOWER(p_login) 
      AND users.deleted = FALSE
    LIMIT 1;

    -- Agar users jadvalida topilmasa, organizations jadvalidan qidirish
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            organizations.id,
            'director'::TEXT,
            organizations.role_id,
            organizations.password_hint,
            organizations.active,
            (organizations.password = p_password) as password_correct
        FROM organizations
        WHERE LOWER(organizations.login) = LOWER(p_login) 
          AND organizations.deleted = FALSE
        LIMIT 1;

        IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            monitors.id,
            'monitoring'::TEXT,
            monitors.role_id,
            ''::varchar,
            monitors.active,
            (monitors.password = p_password) as password_correct
        FROM monitors
        WHERE LOWER(monitors.login) = LOWER(p_login) 
          AND monitors.deleted = FALSE
        LIMIT 1;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;
