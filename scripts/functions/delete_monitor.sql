CREATE OR REPLACE FUNCTION delete_monitor(p_id INT) RETURNS INT AS $$
DECLARE
    v_monitor_exists BOOLEAN;
    v_has_organizations BOOLEAN;
BEGIN
    -- Monitor mavjudligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM monitors WHERE id = p_id AND deleted = false
    ) INTO v_monitor_exists;
    
    IF NOT v_monitor_exists THEN
        RETURN -1; -- Monitor topilmadi
    END IF;
    
    -- Bu monitorga tegishli organizationlar borligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM monitor_organizations 
        WHERE monitor_id = p_id AND deleted = false
    ) INTO v_has_organizations;
    
    IF v_has_organizations THEN
        RETURN -2; -- Bu monitorga tegishli organizationlar mavjud
    END IF;
    
    -- Monitor ni o'chiramiz (soft delete)
    UPDATE monitors
    SET deleted = true
    WHERE id = p_id;
    
    RETURN p_id; -- O'chirilgan monitor ning ID-si qaytariladi
END;
$$ LANGUAGE plpgsql;
