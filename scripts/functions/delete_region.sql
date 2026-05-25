CREATE OR REPLACE FUNCTION delete_region(
    p_id INT
) RETURNS INT AS $$
BEGIN
    -- Region mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM regions WHERE regions.id = p_id AND regions.deleted = false) THEN
        RETURN -1; -- Region not found
    END IF;
    
    -- Region o'chirish (soft delete) - organization lar bilan bog'lanish majburiy emas
    UPDATE regions SET 
        deleted = true,
        token = NULL
    WHERE regions.id = p_id;

    update organizations SET
        region_id = 0
    where organizations.region_id = p_id and organizations.deleted = false;
    
    RETURN p_id;
END;
$$ LANGUAGE plpgsql;
