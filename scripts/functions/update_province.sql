CREATE OR REPLACE FUNCTION update_province(
    p_id INT,
    p_name VARCHAR(50),
    p_password_hint VARCHAR,
    p_location VARCHAR(200),
    p_phone_number VARCHAR(15),
    p_business_sphere VARCHAR(100),
    p_description VARCHAR(100),
    p_director_name VARCHAR(100),
    p_photo_url VARCHAR(500)
) RETURNS INT AS $$
BEGIN
    -- Province mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM provinces WHERE id = p_id AND deleted = false) THEN
        RETURN -1; -- Province not found or deleted
    END IF;
    
    -- Name uniqueness tekshiruvi (o'zi bundan boshqasiniki)
    IF EXISTS (SELECT 1 FROM provinces WHERE name = p_name AND id != p_id AND deleted = false) THEN
        RETURN -2; -- Name already exists
    END IF;
    
    -- Province yangilash
    UPDATE provinces SET
        name = p_name,
        password_hint = p_password_hint,
        location = p_location,
        phone_number = p_phone_number,
        business_sphere = p_business_sphere,
        description = p_description,
        director_name = p_director_name,
        photo_url = p_photo_url
    WHERE id = p_id;
    
    RETURN p_id;
END;
$$ LANGUAGE plpgsql;
