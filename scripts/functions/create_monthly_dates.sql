CREATE OR REPLACE FUNCTION create_monthly_dates(input_month INTEGER)
RETURNS TEXT AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    start_date DATE;
    end_date DATE;
    dates_record RECORD;
    org_record RECORD;
    insert_count INTEGER := 0;
    holiday_dates DATE[];
BEGIN
    -- O'zbekiston bayram sanalarini aniqlash
    holiday_dates := ARRAY[
        make_date(EXTRACT(year FROM current_date)::int, 12, 8),  -- 8-dekabr
        make_date(EXTRACT(year FROM current_date)::int, 3, 8),   -- 8-mart
        make_date(EXTRACT(year FROM current_date)::int, 3, 21),  -- 21-mart
        make_date(EXTRACT(year FROM current_date)::int, 12, 31), -- 31-dekabr
        make_date(EXTRACT(year FROM current_date)::int, 1, 1),   -- 1-yanvar
        make_date(EXTRACT(year FROM current_date)::int, 5, 9),   -- 9-may
        make_date(EXTRACT(year FROM current_date)::int, 9, 1),   -- 1-sentabr
        make_date(EXTRACT(year FROM current_date)::int, 10, 1)   -- 1-oktabr
    ];

    -- Agar kiritilgan oy joriy oydan oldin bo'lsa, hech qanday sana yaratmaslik
    IF input_month < EXTRACT(month FROM current_date) AND input_month != 1 THEN
        RETURN 'Oy allaqachon o''tgan. Hech qanday sana yaratilmadi.';
    END IF;

    -- Boshlanish va tugash sanalarini aniqlash
    IF input_month = EXTRACT(month FROM current_date) THEN
        -- Joriy oy uchun ertangi kundan boshlash
        start_date := current_date + INTERVAL '1 day';
        end_date := (date_trunc('month', current_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSIF input_month != 1 then
        -- Kelgusi oylar uchun oyning birinchi kunidan boshlash
        start_date := make_date(EXTRACT(year FROM current_date)::int, input_month, 1);
        end_date := (date_trunc('month', start_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    elsif input_month = 1 then
        start_date := make_date(EXTRACT(year FROM (current_date + INTERVAL'1 year'))::int, input_month, 1);
        end_date := (date_trunc('month', start_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;    
    END IF;

    -- Barcha faol organizationlar uchun sanalarni yaratish
    FOR org_record IN SELECT id as organization_id FROM organizations WHERE deleted = false and id > 0 LOOP
        FOR dates_record IN 
            SELECT dt::DATE as gen_date 
            FROM generate_series(start_date, end_date, INTERVAL '1 day') dt 
        LOOP
            -- Agar sana allaqachon mavjud bo'lmasa, uni qo'shish
            INSERT INTO dates (date, is_kanikul, organization_id)
            SELECT 
                dates_record.gen_date,
                CASE 
                    WHEN dates_record.gen_date = ANY(holiday_dates) THEN true  -- Bayram kunlari
                    WHEN EXTRACT(dow FROM dates_record.gen_date) = 0 THEN true -- Yakshanba kunlari
                    WHEN dates_record.gen_date BETWEEN make_date(EXTRACT(year FROM current_date)::int, 5, 26) 
                         AND make_date(EXTRACT(year FROM current_date)::int, 9, 2) THEN true  -- Maktab tatili
                    ELSE false
                END,
                org_record.organization_id
            WHERE NOT EXISTS (
                SELECT 1 FROM dates 
                WHERE date = dates_record.gen_date 
                  AND organization_id = org_record.organization_id 
                  AND deleted = false
            );
            
            -- Agar yangi sana qo'shilgan bo'lsa, hisoblagichni oshirish
            IF FOUND THEN
                insert_count := insert_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN format('%s ta yangi sana yaratildi %s oy uchun.', insert_count, input_month);
END;
$$ LANGUAGE plpgsql;
