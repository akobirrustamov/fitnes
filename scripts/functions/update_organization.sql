CREATE OR REPLACE FUNCTION update_organization(
    p_id INT,
    p_name VARCHAR,
    p_director_name VARCHAR,
    p_password_hint VARCHAR,
    p_business_sphere VARCHAR,
    p_phone_number VARCHAR,
    p_photo_url VARCHAR,
    p_admin_name VARCHAR,
    p_admin_phone_number VARCHAR,
    p_location TEXT
) RETURNS INT AS $$
DECLARE
    v_result INT;
BEGIN
    -- Tashkilot mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_id AND deleted = false) THEN
        RETURN -1; -- Tashkilot topilmadi yoki o'chirilgan
    END IF;

    -- Tashkilot nomi boshqa tashkilotda mavjud emasligini tekshirish
    IF EXISTS (SELECT 1 FROM organizations WHERE name = p_name AND id != p_id AND deleted = false) THEN
        RETURN -2; -- Tashkilot nomi allaqachon mavjud
    END IF;

    -- Tashkilotni yangilash
    UPDATE organizations
    SET
        name = p_name,
        director_name = p_director_name,
        password_hint = p_password_hint,
        business_sphere = p_business_sphere,
        phone_number = p_phone_number,
        photo_url = p_photo_url,
        admin_name = p_admin_name,
        admin_phone_number = p_admin_phone_number,
        location = p_location,
        updated_time = NOW()
    WHERE id = p_id;

    RETURN p_id; -- Muvaffaqiyatli yangilandi
END;
$$ LANGUAGE plpgsql;
