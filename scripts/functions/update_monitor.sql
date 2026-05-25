CREATE OR REPLACE FUNCTION update_monitor(
    p_id INT,
    p_name VARCHAR,
    p_description VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_monitor_exists BOOLEAN;
    v_name_exists BOOLEAN;
BEGIN
    -- Monitor mavjudligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM monitors WHERE id = p_id AND deleted = false
    ) INTO v_monitor_exists;
    
    IF NOT v_monitor_exists THEN
        RETURN -1; -- Monitor topilmadi
    END IF;
    
    -- Name unikal ekanligini tekshiramiz (o'zi bundan mustasno)
    SELECT EXISTS (
        SELECT 1 FROM monitors 
        WHERE name = p_name AND deleted = false AND id != p_id
    ) INTO v_name_exists;
    
    IF v_name_exists THEN
        RETURN -2; -- Bu nom boshqa monitor da allaqachon mavjud
    END IF;
    
    -- Monitor ni yangilaymiz
    UPDATE monitors
    SET name = p_name,
        description = p_description
    WHERE id = p_id AND deleted = false;
    
    RETURN p_id; -- Yangilangan monitor ning ID-si qaytariladi
END;
$$ LANGUAGE plpgsql;
