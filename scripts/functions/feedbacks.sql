CREATE OR REPLACE FUNCTION add_feedback_from_organization(
    p_title VARCHAR(100),
    p_description VARCHAR(1000),
    p_organization_id INT,
    p_email VARCHAR(100),
    p_phone_number VARCHAR(20)
) RETURNS INT AS $$
DECLARE
    new_feedback_id INT;
BEGIN
    -- Organization mavjudligini tekshirish
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id AND deleted = FALSE) THEN
        RETURN -1; -- Organization topilmadi
    END IF;

    -- Feedback qo'shish
    INSERT INTO feedbacks (
        title, 
        description, 
        organization_id, 
        email, 
        phone_number,
        message_from,
        is_registration
    ) VALUES (
        p_title,
        p_description,
        p_organization_id,
        p_email,
        p_phone_number,
        'organization',
        FALSE
    ) RETURNING id INTO new_feedback_id;

    RETURN new_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: ADD FEEDBACK (Guest)
-- ====================================
CREATE OR REPLACE FUNCTION add_feedback_from_guest(
    p_title VARCHAR(100),
    p_description VARCHAR(1000),
    p_email VARCHAR(100),
    p_phone_number VARCHAR(20),
    p_sender_ip VARCHAR(50),
    p_sender_name VARCHAR(100)
) RETURNS INT AS $$
DECLARE
    new_feedback_id INT;
BEGIN
    -- Feedback qo'shish
    INSERT INTO feedbacks (
        title, 
        description, 
        email, 
        phone_number,
        sender_ip,
        sender_name,
        message_from,
        is_registration
    ) VALUES (
        p_title,
        p_description,
        p_email,
        p_phone_number,
        p_sender_ip,
        p_sender_name,
        'guest',
        FALSE
    ) RETURNING id INTO new_feedback_id;

    RETURN new_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: ADD REGISTRATION REQUEST
-- ====================================
CREATE OR REPLACE FUNCTION add_registration_request(
    p_company_name VARCHAR(200),
    p_inn VARCHAR(50),
    p_sender_name VARCHAR(100),
    p_email VARCHAR(100),
    p_phone_number VARCHAR(20),
    p_description VARCHAR(1000),
    p_sender_ip VARCHAR(50)
) RETURNS INT AS $$
DECLARE
    new_feedback_id INT;
BEGIN
    -- Registration request qo'shish
    INSERT INTO feedbacks (
        title,
        company_name,
        inn,
        sender_name,
        email,
        phone_number,
        description,
        sender_ip,
        message_from,
        is_registration
    ) VALUES (
        'DEMO Registration Request',
        p_company_name,
        p_inn,
        p_sender_name,
        p_email,
        p_phone_number,
        p_description,
        p_sender_ip,
        'guest',
        TRUE
    ) RETURNING id INTO new_feedback_id;

    RETURN new_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: GET FEEDBACKS (SuperAdmin)
-- ====================================
CREATE OR REPLACE FUNCTION get_feedbacks_for_superadmin(
    p_page INT,
    p_page_size INT,
    p_part VARCHAR,
    p_is_seen BOOLEAN,
    p_markup BOOLEAN,
    p_is_registration BOOLEAN,
    p_organization_id INT,
    p_date_from TIMESTAMP,
    p_date_to TIMESTAMP
) RETURNS TABLE (
    id INT,
    title VARCHAR,
    description VARCHAR,
    email VARCHAR,
    phone_number VARCHAR,
    created_time TIMESTAMP,
    deleted BOOLEAN,
    message_from VARCHAR,
    reply_for INT,
    organization_id INT,
    organization_name VARCHAR,
    region_id INT,
    region_name VARCHAR,
    markup BOOLEAN,
    is_seen BOOLEAN,
    seen_time TIMESTAMP,
    is_registration BOOLEAN,
    sender_ip VARCHAR,
    sender_name VARCHAR,
    company_name VARCHAR,
    inn VARCHAR,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.title,
        f.description,
        f.email,
        f.phone_number,
        f.created_time,
        f.deleted,
        f.message_from,
        f.reply_for,
        f.organization_id,
        o.name AS organization_name,
        f.region_id,
        r.name AS region_name,
        f.markup,
        f.is_seen,
        f.seen_time,
        f.is_registration,
        f.sender_ip,
        f.sender_name,
        f.company_name,
        f.inn,
        COUNT(*) OVER() AS total_count
    FROM feedbacks f
    LEFT JOIN organizations o ON o.id = f.organization_id
    LEFT JOIN regions r ON r.id = f.region_id
    WHERE f.deleted = FALSE
        AND (p_is_seen IS NULL OR f.is_seen = p_is_seen)
        AND (p_markup IS NULL OR f.markup = p_markup)
        AND (p_is_registration IS NULL OR f.is_registration = p_is_registration)
        AND (p_organization_id IS NULL OR f.organization_id = p_organization_id)
        AND (p_date_from IS NULL OR f.created_time >= p_date_from)
        AND (p_date_to IS NULL OR f.created_time <= p_date_to)
        AND (p_part IS NULL OR p_part = '' OR 
             f.title ILIKE '%' || p_part || '%' OR 
             f.description ILIKE '%' || p_part || '%' OR
             f.sender_name ILIKE '%' || p_part || '%' OR
             f.company_name ILIKE '%' || p_part || '%' OR
             o.name ILIKE '%' || p_part || '%')
    ORDER BY f.markup DESC, f.created_time DESC
    LIMIT p_page_size OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- FUNCTION: GET UNREAD COUNTS
-- ====================================
CREATE OR REPLACE FUNCTION get_unread_feedback_counts()
RETURNS TABLE (
    unread_feedbacks INT,
    unread_registrations INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE is_seen = FALSE AND is_registration = FALSE)::INT AS unread_feedbacks,
        COUNT(*) FILTER (WHERE is_seen = FALSE AND is_registration = TRUE)::INT AS unread_registrations
    FROM feedbacks
    WHERE deleted = FALSE;
END;
$$ LANGUAGE plpgsql;