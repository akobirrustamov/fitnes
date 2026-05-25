CREATE OR REPLACE FUNCTION update_date_kanikul(
    date_id INTEGER,
    new_is_kanikul BOOLEAN,
    org_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    date_record RECORD;
    v_date_allowed BOOLEAN;
BEGIN
    -- Sana mavjudligini va organizationga tegishliligini tekshirish
    SELECT * INTO date_record
    FROM dates
    WHERE id = date_id
        AND organization_id = org_id
        AND deleted = false;

    -- Agar sana topilmasa
    IF NOT FOUND THEN
        RETURN -1;
    END IF;

    -- Agar sana bugun yoki undan oldin bo'lsa, o'zgartirishga ruxsat bermaslik
    IF date_record.date <= CURRENT_DATE THEN
        RETURN -2;
    END IF;

    -- SuperAdmin tomonidan bu sanaga ruxsat berilganligini tekshirish
    SELECT allow INTO v_date_allowed
    FROM allowed_dates
    WHERE date = date_record.date;

    -- Agar SuperAdmin ruxsat bermagan bo'lsa
    IF NOT v_date_allowed THEN
        RETURN -3; -- SuperAdmin ruxsat bermagan
    END IF;

    -- Sanani yangilash
    UPDATE dates
    SET is_kanikul = new_is_kanikul
    WHERE id = date_id
        AND organization_id = org_id
        AND deleted = false;

    RETURN date_id;
END;
$$ LANGUAGE plpgsql;
