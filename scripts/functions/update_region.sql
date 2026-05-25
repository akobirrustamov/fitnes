CREATE OR REPLACE FUNCTION update_region(
    p_id INT,
    p_name VARCHAR(50),
    p_password_hint VARCHAR(500),
    p_location VARCHAR(200),
    p_phone_number VARCHAR(15),
    p_business_sphere VARCHAR(100),
    p_description VARCHAR(100),
    p_director_name VARCHAR(100),
    p_photo_url VARCHAR(500),
    p_province_id INT
) RETURNS INT AS $$
BEGIN
    -- Region mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM regions WHERE id = p_id AND deleted = false) THEN
        RETURN -1; -- Region not found or deleted
    END IF;
    
    -- Province mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM provinces WHERE id = p_province_id AND deleted = false) THEN
        RETURN -3; -- Province not found
    END IF;
    
    -- Name uniqueness tekshiruvi (bir xil province ichida, o'zi bundan boshqa)
    IF EXISTS (SELECT 1 FROM regions WHERE name = p_name AND province_id = p_province_id AND id != p_id AND deleted = false) THEN
        RETURN -2; -- Name already exists in this province
    END IF;
    
    -- Region yangilash
    UPDATE regions SET
        name = p_name,
        password_hint = p_password_hint,
        location = p_location,
        phone_number = p_phone_number,
        business_sphere = p_business_sphere,
        description = p_description,
        director_name = p_director_name,
        photo_url = p_photo_url,
        province_id = p_province_id
    WHERE id = p_id;
    
    RETURN p_id;
END;
$$ LANGUAGE plpgsql;
