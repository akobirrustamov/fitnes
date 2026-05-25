CREATE OR REPLACE FUNCTION delete_province(
    p_id INT
) RETURNS INT AS $$
BEGIN
    -- Province mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM provinces WHERE id = p_id AND deleted = false) THEN
        RETURN -1; -- Province not found
    END IF;
    
    -- Province tarkibida region borligini tekshirish
    IF EXISTS (SELECT 1 FROM regions WHERE province_id = p_id AND deleted = false) THEN
        RETURN -2; -- Province has regions, cannot delete
    END IF;
    
    -- Province o'chirish (soft delete)
    UPDATE provinces SET 
        deleted = true,
        token = NULL
    WHERE id = p_id;
    
    RETURN p_id;
END;
$$ LANGUAGE plpgsql;
