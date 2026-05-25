CREATE OR REPLACE FUNCTION add_news(
    p_title VARCHAR(200),
    p_description TEXT,
    p_content TEXT,
    p_photo_url VARCHAR(500),
    p_url VARCHAR(500),
    p_created_by INT
) RETURNS INT AS $$
DECLARE
    new_news_id INT;
BEGIN
    -- News qo'shish
    INSERT INTO news (
        title, 
        description, 
        content,
        photo_url, 
        url,
        created_by,
        active
    ) VALUES (
        p_title,
        p_description,
        p_content,
        p_photo_url,
        p_url,
        p_created_by,
        FALSE -- Default: faol emas
    ) RETURNING id INTO new_news_id;

    RETURN new_news_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: UPDATE NEWS (SuperAdmin)
-- ====================================
CREATE OR REPLACE FUNCTION update_news(
    p_id INT,
    p_title VARCHAR(200),
    p_description TEXT,
    p_content TEXT,
    p_photo_url VARCHAR(500),
    p_url VARCHAR(500)
) RETURNS INT AS $$
BEGIN
    -- News mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM news WHERE id = p_id AND deleted = FALSE) THEN
        RETURN -1; -- News topilmadi
    END IF;

    -- Agar news allaqachon active bo'lsa, tahrirlash mumkin emas
    IF EXISTS (SELECT 1 FROM news WHERE id = p_id AND active = TRUE) THEN
        RETURN -2; -- News allaqachon faollashtirilgan
    END IF;

    -- News yangilash
    UPDATE news SET
        title = p_title,
        description = p_description,
        content = p_content,
        photo_url = p_photo_url,
        url = p_url
    WHERE id = p_id AND deleted = FALSE;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: DELETE NEWS (SuperAdmin)
-- ====================================
CREATE OR REPLACE FUNCTION delete_news(p_id INT) RETURNS INT AS $$
BEGIN
    -- News mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM news WHERE id = p_id AND deleted = FALSE) THEN
        RETURN -1; -- News topilmadi
    END IF;

    -- Agar news active bo'lsa, o'chirish mumkin emas
    IF EXISTS (SELECT 1 FROM news WHERE id = p_id AND active = TRUE) THEN
        RETURN -2; -- Active news ni o'chirish mumkin emas
    END IF;

    -- News ni soft delete qilish
    UPDATE news SET deleted = TRUE WHERE id = p_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: ACTIVATE NEWS (SuperAdmin)
-- ====================================
CREATE OR REPLACE FUNCTION activate_news(
    p_id INT,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP
) RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    -- News mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM news WHERE id = p_id AND deleted = FALSE) THEN
        RETURN -1; -- News topilmadi
    END IF;

    -- Agar allaqachon active bo'lsa
    IF EXISTS (SELECT 1 FROM news WHERE id = p_id AND active = TRUE) THEN
        RETURN -2; -- Allaqachon faollashtirilgan
    END IF;

    -- End time start time dan katta bo'lishi kerak
    IF p_end_time <= p_start_time THEN
        RETURN -3; -- Noto'g'ri vaqt oralig'i
    END IF;

    -- News ni activate qilish
    UPDATE news SET
        active = TRUE,
        start_time = p_start_time,
        end_time = p_end_time
    WHERE id = p_id;

    -- Barcha organizationlarga news_history yaratish
    INSERT INTO news_history (news_id, organization_id)
    SELECT p_id, o.id
    FROM organizations o
    WHERE o.deleted = FALSE AND o.active = TRUE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count; -- Nechta organizationga yuborildi
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: DEACTIVATE NEWS (SuperAdmin)
-- ====================================
CREATE OR REPLACE FUNCTION deactivate_news(p_id INT) RETURNS INT AS $$
BEGIN
    -- News mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM news WHERE id = p_id AND deleted = FALSE) THEN
        RETURN -1; -- News topilmadi
    END IF;

    -- News ni deactivate qilish
    UPDATE news SET
        active = FALSE,
        end_time = NOW()
    WHERE id = p_id;

    -- News history ni o'chirish (soft delete)
    UPDATE news_history SET deleted = TRUE WHERE news_id = p_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: GET NEWS FOR ORGANIZATION
-- ====================================
CREATE OR REPLACE FUNCTION get_news_for_organization(
    p_organization_id INT,
    p_page INT,
    p_page_size INT,
    p_is_read BOOLEAN
) RETURNS TABLE (
    id INT,
    news_id INT,
    title VARCHAR,
    description TEXT,
    content TEXT,
    photo_url VARCHAR,
    url VARCHAR,
    created_time TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    is_read BOOLEAN,
    read_time TIMESTAMP,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nh.id,
        n.id AS news_id,
        n.title,
        n.description,
        n.content,
        n.photo_url,
        n.url,
        n.created_time,
        n.start_time,
        n.end_time,
        nh.is_read,
        nh.read_time,
        COUNT(*) OVER() AS total_count
    FROM news_history nh
    INNER JOIN news n ON n.id = nh.news_id
    WHERE nh.organization_id = p_organization_id
        AND nh.deleted = FALSE
        AND n.deleted = FALSE
        AND n.active = TRUE
        AND NOW() BETWEEN n.start_time AND n.end_time
        AND (p_is_read IS NULL OR nh.is_read = p_is_read)
    ORDER BY nh.is_read ASC, n.created_time DESC
    LIMIT p_page_size OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: MARK NEWS AS READ (Organization)
-- ====================================
CREATE OR REPLACE FUNCTION mark_news_as_read(
    p_news_id INT,
    p_organization_id INT
) RETURNS INT AS $$
BEGIN
    -- News history mavjudligini tekshirish
    IF NOT EXISTS (
        SELECT 1 FROM news_history 
        WHERE news_id = p_news_id 
        AND organization_id = p_organization_id 
        AND deleted = FALSE
    ) THEN
        RETURN -1; -- News history topilmadi
    END IF;

    -- O'qilgan deb belgilash
    UPDATE news_history SET
        is_read = TRUE,
        read_time = NOW()
    WHERE news_id = p_news_id 
    AND organization_id = p_organization_id
    AND deleted = FALSE;

    RETURN p_news_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: MARK ALL NEWS AS READ (Organization)
-- ====================================
CREATE OR REPLACE FUNCTION mark_all_news_as_read(p_organization_id INT) RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    -- Barcha o'qilmagan yangiliklar
    UPDATE news_history SET
        is_read = TRUE,
        read_time = NOW()
    WHERE organization_id = p_organization_id
    AND is_read = FALSE
    AND deleted = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count; -- Nechta yangilik o'qildi
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: GET UNREAD NEWS COUNT
-- ====================================
CREATE OR REPLACE FUNCTION get_unread_news_count(p_organization_id INT) RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*)::INT INTO v_count
    FROM news_history nh
    INNER JOIN news n ON n.id = nh.news_id
    WHERE nh.organization_id = p_organization_id
    AND nh.is_read = FALSE
    AND nh.deleted = FALSE
    AND n.deleted = FALSE
    AND n.active = TRUE
    AND NOW() BETWEEN n.start_time AND n.end_time;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: GET ALL NEWS (SuperAdmin)
-- ====================================
CREATE OR REPLACE FUNCTION get_all_news_for_admin(
    p_page INT,
    p_page_size INT,
    p_part VARCHAR,
    p_active BOOLEAN
) RETURNS TABLE (
    id INT,
    title VARCHAR,
    description TEXT,
    content TEXT,
    photo_url VARCHAR,
    url VARCHAR,
    created_time TIMESTAMP,
    created_by INT,
    created_by_name VARCHAR,
    deleted BOOLEAN,
    active BOOLEAN,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    sent_count BIGINT,
    read_count BIGINT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.description,
        n.content,
        n.photo_url,
        n.url,
        n.created_time,
        n.created_by,
        u.login AS created_by_name,
        n.deleted,
        n.active,
        n.start_time,
        n.end_time,
        COUNT(DISTINCT nh.id) FILTER (WHERE nh.deleted = FALSE) AS sent_count,
        COUNT(DISTINCT nh.id) FILTER (WHERE nh.is_read = TRUE AND nh.deleted = FALSE) AS read_count,
        COUNT(*) OVER() AS total_count
    FROM news n
    LEFT JOIN users u ON u.id = n.created_by
    LEFT JOIN news_history nh ON nh.news_id = n.id
    WHERE n.deleted = FALSE
        AND (p_active IS NULL OR n.active = p_active)
        AND (p_part IS NULL OR p_part = '' OR 
             n.title ILIKE '%' || p_part || '%' OR 
             n.description ILIKE '%' || p_part || '%')
    GROUP BY n.id, u.login
    ORDER BY n.active DESC, n.created_time DESC
    LIMIT p_page_size OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql;