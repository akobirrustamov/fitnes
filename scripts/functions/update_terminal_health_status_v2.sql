CREATE OR REPLACE FUNCTION public.update_terminal_health_status_v2(
    p_terminal_id integer,
    p_active boolean,
    p_monitor_id int,
    p_model text DEFAULT NULL
)
RETURNS integer
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    v_terminal_exists BOOLEAN;
BEGIN    
    -- Terminal mavjudligini va organizationga tegishliligini tekshiramiz
    SELECT EXISTS (
        SELECT 1 FROM terminals 
        WHERE id = p_terminal_id 
        AND organization_id in (select organizations.id from organizations where organizations.monitor_id = p_monitor_id and organizations.deleted = false)
        AND deleted = false
    ) INTO v_terminal_exists;

    IF NOT v_terminal_exists THEN
        RETURN -1; -- Terminal topilmadi yoki organizationga tegishli emas
    END IF;

    -- Terminal ni yangilash
    UPDATE terminals
    SET last_online = CASE WHEN (not p_active AND is_online) THEN now() WHEN p_active THEN now() ELSE last_online END,
        is_online = CASE WHEN p_active THEN true ELSE false END,
        model = COALESCE(p_model, model) -- Agar model berilgan bo'lsa yangilash, aks holda eski qiymat
    WHERE id = p_terminal_id 
    AND deleted = false;

    RETURN p_terminal_id; -- Terminal ID-si qaytariladi

END;
$BODY$;

ALTER FUNCTION public.update_terminal_health_status_v2(integer, integer, boolean, text)
    OWNER TO triple_seven;
