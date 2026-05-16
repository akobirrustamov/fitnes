-- =============================================================
-- FitCRM Database – Additional Tables & Stored Functions
-- PostgreSQL 14+  |  Spring Boot 3.1.2 / Hibernate 6.2
-- =============================================================
-- NOTE: Hibernate-generated table names (verify with \dt if needed):
--   users         → @Table(name="users")
--   role          → no annotation, class name "Role" → "role"
--   users_roles   → @ManyToMany join (owner "users", field "roles")
--                   columns: users_id (UUID), roles_id (INT)
--   user_profiles → @Table(name="user_profiles")
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ADDITIONAL TABLES
-- =============================================================

-- Terminals (access-control devices at organizations)
CREATE TABLE IF NOT EXISTS terminals (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER       NOT NULL,          -- references users.number
    name            VARCHAR(255),
    description     TEXT,
    ip              VARCHAR(100),
    login           VARCHAR(255),
    password        VARCHAR(255),
    model           VARCHAR(255),
    filter          VARCHAR(255),
    is_coming       BOOLEAN       NOT NULL DEFAULT false,
    active          BOOLEAN       NOT NULL DEFAULT true,
    deleted         BOOLEAN       NOT NULL DEFAULT false,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_terminals_org ON terminals(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_terminals_ip
    ON terminals(ip) WHERE deleted = false AND ip IS NOT NULL;

-- Persons (members / employees tracked by terminals)
CREATE TABLE IF NOT EXISTS persons (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER       NOT NULL,
    full_name       VARCHAR(255),
    card_id         VARCHAR(100),
    photo_url       VARCHAR(500),
    active          BOOLEAN       NOT NULL DEFAULT true,
    deleted         BOOLEAN       NOT NULL DEFAULT false,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_persons_org ON persons(organization_id);

-- Terminal Tasks (terminal sync queue)
CREATE TABLE IF NOT EXISTS terminal_tasks (
    id          BIGSERIAL PRIMARY KEY,
    terminal_id BIGINT        NOT NULL REFERENCES terminals(id),
    person_id   BIGINT,
    action      VARCHAR(50)   NOT NULL,   -- add | delete | update | photo | add_all_persons
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',  -- PENDING | DONE | FAILED
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_terminal ON terminal_tasks(terminal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON terminal_tasks(status);

-- Weekly work graphics per organization
CREATE TABLE IF NOT EXISTS graphics (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER   NOT NULL,
    day_of_week     SMALLINT  NOT NULL,   -- 1=Mon … 7=Sun
    is_holiday      BOOLEAN   NOT NULL DEFAULT false,
    UNIQUE(organization_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_graphics_org ON graphics(organization_id);

-- Generated calendar dates per organization (monthly)
CREATE TABLE IF NOT EXISTS dates (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER   NOT NULL,
    date            DATE      NOT NULL,
    is_holiday      BOOLEAN   NOT NULL DEFAULT false,
    is_kanikul      BOOLEAN   NOT NULL DEFAULT false,
    UNIQUE(organization_id, date)
);
CREATE INDEX IF NOT EXISTS idx_dates_org_date ON dates(organization_id, date);

-- Feedbacks / Support requests / Registration requests
CREATE TABLE IF NOT EXISTS feedbacks (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER,              -- NULL for guest feedback
    title           VARCHAR(500),
    description     TEXT,
    fullname        VARCHAR(255),
    phone_number    VARCHAR(50),
    is_registration BOOLEAN   NOT NULL DEFAULT false,
    is_seen         BOOLEAN   NOT NULL DEFAULT false,
    markup          INTEGER            DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedbacks_org  ON feedbacks(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_seen ON feedbacks(is_seen);

-- News articles
CREATE TABLE IF NOT EXISTS news (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(500),
    description TEXT,
    content     TEXT,
    photo_url   VARCHAR(500),
    url         VARCHAR(500),
    active      BOOLEAN   NOT NULL DEFAULT false,
    start_time  TIMESTAMP,
    end_time    TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- News → Organizations assignment
CREATE TABLE IF NOT EXISTS news_organizations (
    id              BIGSERIAL PRIMARY KEY,
    news_id         BIGINT    NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    organization_id INTEGER   NOT NULL,
    is_read         BOOLEAN   NOT NULL DEFAULT false,
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(news_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_news_org_org  ON news_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_news_org_read ON news_organizations(is_read);

-- =============================================================
-- HELPER FUNCTIONS (internal)
-- =============================================================

-- Get users.id (UUID) by users.number (INT)
CREATE OR REPLACE FUNCTION _get_user_id_by_number(p_number INT)
RETURNS UUID AS $$
    SELECT id FROM users WHERE number = p_number LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Get next users.number (auto-increment)
CREATE OR REPLACE FUNCTION _next_user_number()
RETURNS INT AS $$
    SELECT COALESCE(MAX(number), 0) + 1 FROM users;
$$ LANGUAGE SQL;

-- =============================================================
-- 1. add_monitor
-- Yangi monitor yaratish
-- Returns: new monitor number  |  -1: login exists
-- =============================================================
CREATE OR REPLACE FUNCTION add_monitor(
    p_name          VARCHAR,
    p_login         VARCHAR,
    p_password      VARCHAR,
    p_phone_number  VARCHAR DEFAULT NULL,
    p_description   VARCHAR DEFAULT NULL,
    p_password_hint VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id  UUID := gen_random_uuid();
    v_next_num INT;
    v_role_id  INT;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE phone = p_login) THEN
        RETURN -1;
    END IF;

    v_next_num := _next_user_number();
    SELECT id INTO v_role_id FROM role WHERE name = 'ROLE_MONITOR';

    INSERT INTO users (id, phone, password, number, name, created_at)
    VALUES (v_user_id, p_login,
            crypt(p_password, gen_salt('bf', 10)),
            v_next_num, p_name, NOW());

    INSERT INTO users_roles (users_id, roles_id) VALUES (v_user_id, v_role_id);

    INSERT INTO user_profiles
        (id, user_id, phone_number, description, password_hint,
         active, deleted, telegram_bot_active)
    VALUES
        (gen_random_uuid(), v_user_id, p_phone_number, p_description, p_password_hint,
         true, false, false);

    RETURN v_next_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 2. add_province
-- Yangi viloyat yaratish
-- Returns: new province number  |  -1: login exists
-- =============================================================
CREATE OR REPLACE FUNCTION add_province(
    p_name            VARCHAR,
    p_login           VARCHAR,
    p_password        VARCHAR,
    p_director_name   VARCHAR DEFAULT NULL,
    p_phone_number    VARCHAR DEFAULT NULL,
    p_location        VARCHAR DEFAULT NULL,
    p_description     VARCHAR DEFAULT NULL,
    p_business_sphere VARCHAR DEFAULT NULL,
    p_password_hint   VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id  UUID := gen_random_uuid();
    v_next_num INT;
    v_role_id  INT;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE phone = p_login) THEN
        RETURN -1;
    END IF;

    v_next_num := _next_user_number();
    SELECT id INTO v_role_id FROM role WHERE name = 'ROLE_PROVINCE';

    INSERT INTO users (id, phone, password, number, name, created_at)
    VALUES (v_user_id, p_login,
            crypt(p_password, gen_salt('bf', 10)),
            v_next_num, p_name, NOW());

    INSERT INTO users_roles (users_id, roles_id) VALUES (v_user_id, v_role_id);

    INSERT INTO user_profiles
        (id, user_id, director_name, phone_number, location,
         description, business_sphere, password_hint,
         active, deleted, telegram_bot_active)
    VALUES
        (gen_random_uuid(), v_user_id,
         p_director_name, p_phone_number, p_location,
         p_description, p_business_sphere, p_password_hint,
         true, false, false);

    RETURN v_next_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 3. add_region
-- Yangi tuman yaratish
-- Returns: new region number  |  -1: login exists  |  -2: province not found
-- =============================================================
CREATE OR REPLACE FUNCTION add_region(
    p_name            VARCHAR,
    p_login           VARCHAR,
    p_password        VARCHAR,
    p_province_id     INT,
    p_director_name   VARCHAR DEFAULT NULL,
    p_phone_number    VARCHAR DEFAULT NULL,
    p_location        VARCHAR DEFAULT NULL,
    p_description     VARCHAR DEFAULT NULL,
    p_business_sphere VARCHAR DEFAULT NULL,
    p_password_hint   VARCHAR DEFAULT NULL,
    p_province_name   VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id  UUID := gen_random_uuid();
    v_next_num INT;
    v_role_id  INT;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE phone = p_login) THEN
        RETURN -1;
    END IF;

    -- Viloyat mavjudligini tekshirish
    IF NOT EXISTS (
        SELECT 1
        FROM users u
        JOIN users_roles ur ON ur.users_id = u.id
        JOIN role r          ON r.id = ur.roles_id
        JOIN user_profiles up ON up.user_id = u.id
        WHERE r.name = 'ROLE_PROVINCE' AND u.number = p_province_id AND up.deleted = false
    ) THEN
        RETURN -2;
    END IF;

    v_next_num := _next_user_number();
    SELECT id INTO v_role_id FROM role WHERE name = 'ROLE_REGION';

    INSERT INTO users (id, phone, password, number, name, created_at)
    VALUES (v_user_id, p_login,
            crypt(p_password, gen_salt('bf', 10)),
            v_next_num, p_name, NOW());

    INSERT INTO users_roles (users_id, roles_id) VALUES (v_user_id, v_role_id);

    INSERT INTO user_profiles
        (id, user_id, director_name, phone_number, province_id, province_name,
         location, description, business_sphere, password_hint,
         active, deleted, telegram_bot_active)
    VALUES
        (gen_random_uuid(), v_user_id,
         p_director_name, p_phone_number, p_province_id, p_province_name,
         p_location, p_description, p_business_sphere, p_password_hint,
         true, false, false);

    RETURN v_next_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 4. add_terminal
-- Yangi terminal qo'shish
-- Returns: new terminal id  |  -1: org not found  |  -2: IP exists
-- =============================================================
CREATE OR REPLACE FUNCTION add_terminal(
    p_organization_id INT,
    p_name            VARCHAR,
    p_description     TEXT    DEFAULT NULL,
    p_ip              VARCHAR DEFAULT NULL,
    p_login           VARCHAR DEFAULT NULL,
    p_password        VARCHAR DEFAULT NULL,
    p_model           VARCHAR DEFAULT NULL,
    p_filter          VARCHAR DEFAULT NULL,
    p_is_coming       BOOLEAN DEFAULT false
) RETURNS INT AS $$
DECLARE
    v_terminal_id BIGINT;
BEGIN
    -- Tashkilot mavjudligini tekshirish
    IF NOT EXISTS (
        SELECT 1
        FROM users u
        JOIN users_roles ur ON ur.users_id = u.id
        JOIN role r          ON r.id = ur.roles_id
        JOIN user_profiles up ON up.user_id = u.id
        WHERE r.name = 'ROLE_ADMIN' AND u.number = p_organization_id
          AND up.deleted = false
    ) THEN
        RETURN -1;
    END IF;

    -- IP manzil tekshirish (NULL bo'lmasa)
    IF p_ip IS NOT NULL AND EXISTS (
        SELECT 1 FROM terminals WHERE ip = p_ip AND deleted = false
    ) THEN
        RETURN -2;
    END IF;

    INSERT INTO terminals
        (organization_id, name, description, ip, login, password, model, filter, is_coming)
    VALUES
        (p_organization_id, p_name, p_description, p_ip, p_login, p_password, p_model, p_filter, p_is_coming)
    RETURNING id INTO v_terminal_id;

    RETURN v_terminal_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 5. create_monthly_dates
-- Barcha tashkilotlar uchun oylik sanalar yaratish
-- input_month format: YYYYMM  (e.g. 202501)
-- =============================================================
CREATE OR REPLACE FUNCTION create_monthly_dates(input_month INTEGER)
RETURNS VOID AS $$
DECLARE
    v_year       INT := input_month / 100;
    v_month      INT := input_month % 100;
    v_start_date DATE;
    v_end_date   DATE;
    v_cur_date   DATE;
    v_dow        SMALLINT;
    v_is_holiday BOOLEAN;
    org          RECORD;
BEGIN
    v_start_date := make_date(v_year, v_month, 1);
    v_end_date   := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

    -- Barcha faol tashkilotlar (ROLE_ADMIN)
    FOR org IN
        SELECT u.number AS org_num
        FROM users u
        JOIN users_roles ur ON ur.users_id = u.id
        JOIN role r          ON r.id = ur.roles_id
        JOIN user_profiles up ON up.user_id = u.id
        WHERE r.name = 'ROLE_ADMIN' AND up.active = true AND up.deleted = false
    LOOP
        v_cur_date := v_start_date;
        WHILE v_cur_date <= v_end_date LOOP
            -- ISO dow: 1=Mon … 7=Sun
            v_dow := EXTRACT(ISODOW FROM v_cur_date);

            -- Graphics jadvalidagi ma'lumot (yo'q bo'lsa, default dam olish kunlari: 6,7)
            SELECT COALESCE(g.is_holiday, v_dow IN (6, 7))
            INTO v_is_holiday
            FROM graphics g
            WHERE g.organization_id = org.org_num AND g.day_of_week = v_dow;

            -- Mavjud sanani qayta yaratmaymiz
            INSERT INTO dates (organization_id, date, is_holiday, is_kanikul)
            VALUES (org.org_num, v_cur_date, COALESCE(v_is_holiday, v_dow IN (6, 7)), false)
            ON CONFLICT (organization_id, date) DO NOTHING;

            v_cur_date := v_cur_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 6. create_person_tasks
-- Person uchun terminal tasklarini yaratish
-- p_action: add | delete | update | photo
-- =============================================================
CREATE OR REPLACE FUNCTION create_person_tasks(
    p_organization_id INT,
    p_person_id       BIGINT,
    p_action          TEXT
) RETURNS VOID AS $$
DECLARE
    term RECORD;
BEGIN
    FOR term IN
        SELECT id FROM terminals
        WHERE organization_id = p_organization_id
          AND active = true AND deleted = false
    LOOP
        INSERT INTO terminal_tasks (terminal_id, person_id, action, status)
        VALUES (term.id, p_person_id, p_action, 'PENDING');
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 7. create_terminal_tasks
-- Terminaldagi barcha personlarni yuklash tasklarini yaratish
-- p_action: add_all_persons
-- =============================================================
CREATE OR REPLACE FUNCTION create_terminal_tasks(
    p_organization_id INT,
    p_terminal_id     BIGINT,
    p_action          TEXT
) RETURNS VOID AS $$
DECLARE
    pers RECORD;
BEGIN
    IF p_action = 'add_all_persons' THEN
        FOR pers IN
            SELECT id FROM persons
            WHERE organization_id = p_organization_id
              AND active = true AND deleted = false
        LOOP
            INSERT INTO terminal_tasks (terminal_id, person_id, action, status)
            VALUES (p_terminal_id, pers.id, 'add', 'PENDING');

            INSERT INTO terminal_tasks (terminal_id, person_id, action, status)
            VALUES (p_terminal_id, pers.id, 'photo', 'PENDING');
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 8. delete_monitor
-- Monitorni soft delete qilish
-- Returns: 1 success  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION delete_monitor(p_id INT)
RETURNS INT AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT up.id INTO v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_MONITOR' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    UPDATE user_profiles SET deleted = true, active = false WHERE id = v_profile_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 9. delete_province
-- Viloyatni o'chirish
-- Returns: 1 success  |  -1: not found  |  -2: has active regions
-- =============================================================
CREATE OR REPLACE FUNCTION delete_province(p_id INT)
RETURNS INT AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT up.id INTO v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_PROVINCE' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    -- Aktiv tumanlar bormi?
    IF EXISTS (
        SELECT 1
        FROM users u2
        JOIN users_roles ur2  ON ur2.users_id = u2.id
        JOIN role r2           ON r2.id = ur2.roles_id
        JOIN user_profiles up2 ON up2.user_id = u2.id
        WHERE r2.name = 'ROLE_REGION' AND up2.province_id = p_id AND up2.deleted = false
    ) THEN
        RETURN -2;
    END IF;

    UPDATE user_profiles SET deleted = true, active = false WHERE id = v_profile_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 10. delete_region
-- Tumanni o'chirish
-- Returns: 1 success  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION delete_region(p_id INT)
RETURNS INT AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT up.id INTO v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_REGION' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    UPDATE user_profiles SET deleted = true, active = false WHERE id = v_profile_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 11. delete_terminal
-- Terminalni soft delete qilish
-- Returns: 1 success  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION delete_terminal(p_id INT, p_organization_id INT)
RETURNS INT AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM terminals
        WHERE id = p_id AND organization_id = p_organization_id AND deleted = false
    ) THEN
        RETURN -1;
    END IF;

    UPDATE terminals SET deleted = true, active = false WHERE id = p_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 12. add_feedback_from_organization
-- Tashkilotdan feedback qo'shish
-- Returns: new feedback id  |  -1: org not found
-- =============================================================
CREATE OR REPLACE FUNCTION add_feedback_from_organization(
    p_organization_id INT,
    p_title           VARCHAR,
    p_description     TEXT    DEFAULT NULL,
    p_is_registration BOOLEAN DEFAULT false
) RETURNS INT AS $$
DECLARE
    v_feedback_id BIGINT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM users u
        JOIN user_profiles up ON up.user_id = u.id
        WHERE u.number = p_organization_id AND up.deleted = false
    ) THEN
        RETURN -1;
    END IF;

    INSERT INTO feedbacks (organization_id, title, description, is_registration)
    VALUES (p_organization_id, p_title, p_description, COALESCE(p_is_registration, false))
    RETURNING id INTO v_feedback_id;

    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 13. add_feedback_from_guest
-- Guest foydalanuvchidan feedback qo'shish
-- Returns: new feedback id
-- =============================================================
CREATE OR REPLACE FUNCTION add_feedback_from_guest(
    p_title           VARCHAR,
    p_description     TEXT    DEFAULT NULL,
    p_fullname        VARCHAR DEFAULT NULL,
    p_phone_number    VARCHAR DEFAULT NULL,
    p_is_registration BOOLEAN DEFAULT false
) RETURNS INT AS $$
DECLARE
    v_feedback_id BIGINT;
BEGIN
    INSERT INTO feedbacks
        (organization_id, title, description, fullname, phone_number, is_registration)
    VALUES
        (NULL, p_title, p_description, p_fullname, p_phone_number,
         COALESCE(p_is_registration, false))
    RETURNING id INTO v_feedback_id;

    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 14. add_registration_request
-- Ro'yxatdan o'tish so'rovini qo'shish (is_registration=true)
-- Returns: new feedback id
-- =============================================================
CREATE OR REPLACE FUNCTION add_registration_request(
    p_organization_name VARCHAR,
    p_fullname          VARCHAR,
    p_phone_number      VARCHAR,
    p_region            VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_feedback_id BIGINT;
BEGIN
    INSERT INTO feedbacks
        (organization_id, title, description, fullname, phone_number, is_registration)
    VALUES
        (NULL,
         p_organization_name,
         p_region,
         p_fullname,
         p_phone_number,
         true)
    RETURNING id INTO v_feedback_id;

    RETURN v_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 15. get_feedbacks_for_superadmin
-- Super admin uchun feedbacklarni olish (filtr + pagination)
-- =============================================================
CREATE OR REPLACE FUNCTION get_feedbacks_for_superadmin(
    p_page            INT     DEFAULT 1,
    p_page_size       INT     DEFAULT 20,
    p_part            VARCHAR DEFAULT NULL,
    p_is_seen         BOOLEAN DEFAULT NULL,
    p_markup          INT     DEFAULT NULL,
    p_is_registration BOOLEAN DEFAULT NULL,
    p_organization_id INT     DEFAULT NULL,
    p_date_from       DATE    DEFAULT NULL,
    p_date_to         DATE    DEFAULT NULL
) RETURNS TABLE (
    id              BIGINT,
    organization_id INTEGER,
    org_name        VARCHAR,
    title           VARCHAR,
    description     TEXT,
    fullname        VARCHAR,
    phone_number    VARCHAR,
    is_registration BOOLEAN,
    is_seen         BOOLEAN,
    markup          INTEGER,
    created_at      TIMESTAMP,
    total_count     BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT f.*,
               u.name AS org_name_val
        FROM feedbacks f
        LEFT JOIN users u ON u.number = f.organization_id
        WHERE (p_is_seen         IS NULL OR f.is_seen         = p_is_seen)
          AND (p_markup          IS NULL OR f.markup          = p_markup)
          AND (p_is_registration IS NULL OR f.is_registration = p_is_registration)
          AND (p_organization_id IS NULL OR f.organization_id = p_organization_id)
          AND (p_date_from       IS NULL OR f.created_at::DATE >= p_date_from)
          AND (p_date_to         IS NULL OR f.created_at::DATE <= p_date_to)
          AND (p_part IS NULL OR p_part = ''
               OR f.title       ILIKE '%' || p_part || '%'
               OR f.description ILIKE '%' || p_part || '%'
               OR f.fullname    ILIKE '%' || p_part || '%'
               OR f.phone_number ILIKE '%' || p_part || '%')
    ),
    counted AS (SELECT COUNT(*) AS cnt FROM filtered)
    SELECT
        f.id,
        f.organization_id,
        f.org_name_val::VARCHAR,
        f.title,
        f.description,
        f.fullname,
        f.phone_number,
        f.is_registration,
        f.is_seen,
        f.markup,
        f.created_at,
        c.cnt
    FROM filtered f, counted c
    ORDER BY f.created_at DESC
    LIMIT  p_page_size
    OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- 16. get_unread_feedback_counts
-- O'qilmagan feedbacklar sonini kategoriyalar bo'yicha
-- =============================================================
CREATE OR REPLACE FUNCTION get_unread_feedback_counts()
RETURNS TABLE (category TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total'::TEXT,        COUNT(*) FROM feedbacks WHERE is_seen = false
    UNION ALL
    SELECT 'registration'::TEXT, COUNT(*) FROM feedbacks WHERE is_seen = false AND is_registration = true
    UNION ALL
    SELECT 'feedback'::TEXT,     COUNT(*) FROM feedbacks WHERE is_seen = false AND is_registration = false;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- 17. login_with_hint
-- Password hint orqali yangi random parol olish
-- Returns TABLE: user_id, role_id, role_name, new_password
-- =============================================================
CREATE OR REPLACE FUNCTION login_with_hint(
    p_username VARCHAR,
    p_hint     VARCHAR
) RETURNS TABLE (
    user_id      UUID,
    role_id      INT,
    role_name    VARCHAR,
    new_password VARCHAR
) AS $$
DECLARE
    v_user_id    UUID;
    v_role_id    INT;
    v_role_name  VARCHAR;
    v_new_pass   VARCHAR;
    v_plain_pass VARCHAR;
BEGIN
    -- Username va hint to'g'riligini tekshirish
    SELECT u.id, r.id, r.name::VARCHAR
    INTO v_user_id, v_role_id, v_role_name
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE u.phone = p_username
      AND up.password_hint = p_hint
      AND up.deleted = false
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- 8 belgili random parol generatsiya (harf + raqam)
    v_plain_pass := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))
                 || LOWER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));

    -- Yangi parolni hash qilib saqlash
    v_new_pass := crypt(v_plain_pass, gen_salt('bf', 10));
    UPDATE users SET password = v_new_pass WHERE id = v_user_id;

    RETURN QUERY
    SELECT v_user_id, v_role_id, v_role_name, v_plain_pass;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 18. add_news
-- Yangi news yaratish (avtomatik active=false)
-- Returns: new news id
-- =============================================================
CREATE OR REPLACE FUNCTION add_news(
    p_title       VARCHAR,
    p_description TEXT    DEFAULT NULL,
    p_content     TEXT    DEFAULT NULL,
    p_photo_url   VARCHAR DEFAULT NULL,
    p_url         VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_news_id BIGINT;
BEGIN
    INSERT INTO news (title, description, content, photo_url, url, active)
    VALUES (p_title, p_description, p_content, p_photo_url, p_url, false)
    RETURNING id INTO v_news_id;

    RETURN v_news_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 19. update_news
-- Newsni yangilash (faqat active=false bo'lsa)
-- Returns: news id  |  -1: not found  |  -2: already active
-- =============================================================
CREATE OR REPLACE FUNCTION update_news(
    p_id          BIGINT,
    p_title       VARCHAR DEFAULT NULL,
    p_description TEXT    DEFAULT NULL,
    p_content     TEXT    DEFAULT NULL,
    p_photo_url   VARCHAR DEFAULT NULL,
    p_url         VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT active INTO v_active FROM news WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;
    IF v_active THEN
        RETURN -2;
    END IF;

    UPDATE news SET
        title       = COALESCE(p_title,       title),
        description = COALESCE(p_description, description),
        content     = COALESCE(p_content,     content),
        photo_url   = COALESCE(p_photo_url,   photo_url),
        url         = COALESCE(p_url,         url)
    WHERE id = p_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 20. delete_news
-- Newsni o'chirish (faqat active=false bo'lsa)
-- Returns: 1  |  -1: not found  |  -2: news is active
-- =============================================================
CREATE OR REPLACE FUNCTION delete_news(p_id BIGINT)
RETURNS INT AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT active INTO v_active FROM news WHERE id = p_id;

    IF NOT FOUND THEN RETURN -1; END IF;
    IF v_active     THEN RETURN -2; END IF;

    DELETE FROM news WHERE id = p_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 21. activate_news
-- Newsni faollashtirish va barcha tashkilotlarga yuborish
-- Returns: count of orgs notified  |  -1: not found  |  -2: already active
-- =============================================================
CREATE OR REPLACE FUNCTION activate_news(
    p_id         BIGINT,
    p_start_time TIMESTAMP DEFAULT NOW(),
    p_end_time   TIMESTAMP DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_active   BOOLEAN;
    v_org_count INT := 0;
    org        RECORD;
BEGIN
    SELECT active INTO v_active FROM news WHERE id = p_id;

    IF NOT FOUND  THEN RETURN -1; END IF;
    IF v_active   THEN RETURN -2; END IF;

    UPDATE news
    SET active = true, start_time = p_start_time, end_time = p_end_time
    WHERE id = p_id;

    -- Barcha faol tashkilotlarga yuborish
    FOR org IN
        SELECT u.number AS org_num
        FROM users u
        JOIN users_roles ur  ON ur.users_id = u.id
        JOIN role r           ON r.id = ur.roles_id
        JOIN user_profiles up ON up.user_id = u.id
        WHERE r.name = 'ROLE_ADMIN' AND up.active = true AND up.deleted = false
    LOOP
        INSERT INTO news_organizations (news_id, organization_id)
        VALUES (p_id, org.org_num)
        ON CONFLICT (news_id, organization_id) DO NOTHING;

        v_org_count := v_org_count + 1;
    END LOOP;

    RETURN v_org_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 22. deactivate_news
-- Newsni deaktiv qilish
-- Returns: 1  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION deactivate_news(p_id BIGINT)
RETURNS INT AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM news WHERE id = p_id) THEN
        RETURN -1;
    END IF;

    UPDATE news SET active = false WHERE id = p_id;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 23. get_news_for_organization
-- Tashkilot uchun aktiv newslarni olish (+ is_read flag)
-- =============================================================
CREATE OR REPLACE FUNCTION get_news_for_organization(p_organization_id INT)
RETURNS TABLE (
    news_id     BIGINT,
    title       VARCHAR,
    description TEXT,
    content     TEXT,
    photo_url   VARCHAR,
    url         VARCHAR,
    start_time  TIMESTAMP,
    end_time    TIMESTAMP,
    created_at  TIMESTAMP,
    is_read     BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id, n.title, n.description, n.content,
        n.photo_url, n.url, n.start_time, n.end_time, n.created_at,
        COALESCE(no2.is_read, false)
    FROM news n
    JOIN news_organizations no2 ON no2.news_id = n.id
    WHERE no2.organization_id = p_organization_id
      AND n.active = true
      AND (n.end_time IS NULL OR n.end_time > NOW())
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- 24. mark_news_as_read
-- Newsni o'qilgan deb belgilash
-- Returns: 1  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION mark_news_as_read(p_organization_id INT, p_news_id BIGINT)
RETURNS INT AS $$
BEGIN
    UPDATE news_organizations
    SET is_read = true
    WHERE news_id = p_news_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 25. mark_all_news_as_read
-- Barcha newslarni o'qilgan deb belgilash
-- Returns: count of rows updated
-- =============================================================
CREATE OR REPLACE FUNCTION mark_all_news_as_read(p_organization_id INT)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE news_organizations
    SET is_read = true
    WHERE organization_id = p_organization_id AND is_read = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 26. get_unread_news_count
-- O'qilmagan newslar sonini olish
-- =============================================================
CREATE OR REPLACE FUNCTION get_unread_news_count(p_organization_id INT)
RETURNS INT AS $$
    SELECT COUNT(*)::INT
    FROM news_organizations no2
    JOIN news n ON n.id = no2.news_id
    WHERE no2.organization_id = p_organization_id
      AND no2.is_read = false
      AND n.active = true
      AND (n.end_time IS NULL OR n.end_time > NOW());
$$ LANGUAGE SQL STABLE;

-- =============================================================
-- 27. get_all_news_for_admin
-- Admin uchun barcha newslarni olish (filtr + pagination)
-- =============================================================
CREATE OR REPLACE FUNCTION get_all_news_for_admin(
    p_page      INT     DEFAULT 1,
    p_page_size INT     DEFAULT 20,
    p_part      VARCHAR DEFAULT NULL,
    p_active    BOOLEAN DEFAULT NULL
) RETURNS TABLE (
    id          BIGINT,
    title       VARCHAR,
    description TEXT,
    photo_url   VARCHAR,
    url         VARCHAR,
    active      BOOLEAN,
    start_time  TIMESTAMP,
    end_time    TIMESTAMP,
    created_at  TIMESTAMP,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT n.*
        FROM news n
        WHERE (p_active IS NULL OR n.active = p_active)
          AND (p_part IS NULL OR p_part = ''
               OR n.title       ILIKE '%' || p_part || '%'
               OR n.description ILIKE '%' || p_part || '%')
    ),
    counted AS (SELECT COUNT(*) AS cnt FROM filtered)
    SELECT
        f.id, f.title, f.description, f.photo_url, f.url,
        f.active, f.start_time, f.end_time, f.created_at,
        c.cnt
    FROM filtered f, counted c
    ORDER BY f.created_at DESC
    LIMIT  p_page_size
    OFFSET (p_page - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- 28. reset_terminal
-- Terminalni reset qilish (pending tasklarni o'chirib qayta yuklash)
-- Returns: count of persons reloaded  |  -1: terminal not found
-- =============================================================
CREATE OR REPLACE FUNCTION reset_terminal(p_terminal_id BIGINT, p_organization_id INT)
RETURNS INT AS $$
DECLARE
    v_count INT;
    pers    RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM terminals
        WHERE id = p_terminal_id
          AND organization_id = p_organization_id
          AND deleted = false
    ) THEN
        RETURN -1;
    END IF;

    -- Barcha PENDING tasklarni o'chirish
    DELETE FROM terminal_tasks
    WHERE terminal_id = p_terminal_id AND status = 'PENDING';

    -- Barcha faol personlar uchun add + photo task yaratish
    v_count := 0;
    FOR pers IN
        SELECT id FROM persons
        WHERE organization_id = p_organization_id
          AND active = true AND deleted = false
    LOOP
        INSERT INTO terminal_tasks (terminal_id, person_id, action, status)
        VALUES (p_terminal_id, pers.id, 'add',   'PENDING'),
               (p_terminal_id, pers.id, 'photo', 'PENDING');

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 29. update_date_kanikul
-- Sanani ta'til (kanikul) deb belgilash yoki bekor qilish
-- Returns: 1  |  -1: date not found / not owned by org
-- =============================================================
CREATE OR REPLACE FUNCTION update_date_kanikul(
    p_organization_id INT,
    p_date_id         BIGINT,
    p_is_kanikul      BOOLEAN
) RETURNS INT AS $$
BEGIN
    UPDATE dates
    SET is_kanikul = p_is_kanikul
    WHERE id = p_date_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RETURN -1;
    END IF;
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 30. update_monitor
-- Monitorni yangilash
-- Returns: monitor number  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION update_monitor(
    p_id           INT,
    p_name         VARCHAR DEFAULT NULL,
    p_description  TEXT    DEFAULT NULL,
    p_phone_number VARCHAR DEFAULT NULL,
    p_photo_url    VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id    UUID;
    v_profile_id UUID;
BEGIN
    SELECT u.id, up.id
    INTO v_user_id, v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_MONITOR' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    IF p_name IS NOT NULL THEN
        UPDATE users SET name = p_name WHERE id = v_user_id;
    END IF;

    UPDATE user_profiles SET
        description  = COALESCE(p_description,  description),
        phone_number = COALESCE(p_phone_number, phone_number),
        photo_url    = COALESCE(p_photo_url,    photo_url),
        updated_at   = NOW()
    WHERE id = v_profile_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 31. update_organization
-- Tashkilotni yangilash
-- Returns: org number  |  -1: not found/deleted  |  -2: name duplicate
-- =============================================================
CREATE OR REPLACE FUNCTION update_organization(
    p_id                 INT,
    p_name               VARCHAR DEFAULT NULL,
    p_director_name      VARCHAR DEFAULT NULL,
    p_password_hint      VARCHAR DEFAULT NULL,
    p_business_sphere    VARCHAR DEFAULT NULL,
    p_phone_number       VARCHAR DEFAULT NULL,
    p_photo_url          VARCHAR DEFAULT NULL,
    p_admin_name         VARCHAR DEFAULT NULL,
    p_admin_phone_number VARCHAR DEFAULT NULL,
    p_source_path        VARCHAR DEFAULT NULL,
    p_location           VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id    UUID;
    v_profile_id UUID;
BEGIN
    SELECT u.id, up.id
    INTO v_user_id, v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_ADMIN' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    -- Tashkilot nomi unikalligi
    IF p_name IS NOT NULL AND EXISTS (
        SELECT 1 FROM users WHERE name = p_name AND id <> v_user_id
    ) THEN
        RETURN -2;
    END IF;

    IF p_name IS NOT NULL THEN
        UPDATE users SET name = p_name WHERE id = v_user_id;
    END IF;

    UPDATE user_profiles SET
        director_name      = COALESCE(p_director_name,      director_name),
        password_hint      = COALESCE(p_password_hint,      password_hint),
        business_sphere    = COALESCE(p_business_sphere,    business_sphere),
        phone_number       = COALESCE(p_phone_number,       phone_number),
        photo_url          = COALESCE(p_photo_url,          photo_url),
        admin_name         = COALESCE(p_admin_name,         admin_name),
        admin_phone_number = COALESCE(p_admin_phone_number, admin_phone_number),
        source_path        = COALESCE(p_source_path,        source_path),
        location           = COALESCE(p_location,           location),
        updated_at         = NOW()
    WHERE id = v_profile_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 32. update_user
-- Super admin user ma'lumotlarini yangilash
-- Returns: user number  |  -1: not found/deleted
-- =============================================================
CREATE OR REPLACE FUNCTION update_user(
    p_id              INT,
    p_name            VARCHAR DEFAULT NULL,
    p_password_hint   VARCHAR DEFAULT NULL,
    p_description     TEXT    DEFAULT NULL,
    p_location        VARCHAR DEFAULT NULL,
    p_business_sphere VARCHAR DEFAULT NULL,
    p_phone_number    VARCHAR DEFAULT NULL,
    p_director_name   VARCHAR DEFAULT NULL,
    p_photo_url       VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id    UUID;
    v_profile_id UUID;
BEGIN
    SELECT u.id, up.id
    INTO v_user_id, v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_SUPERADMIN' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    IF p_name IS NOT NULL THEN
        UPDATE users SET name = p_name WHERE id = v_user_id;
    END IF;

    UPDATE user_profiles SET
        password_hint   = COALESCE(p_password_hint,   password_hint),
        description     = COALESCE(p_description,     description),
        location        = COALESCE(p_location,        location),
        business_sphere = COALESCE(p_business_sphere, business_sphere),
        phone_number    = COALESCE(p_phone_number,    phone_number),
        director_name   = COALESCE(p_director_name,   director_name),
        photo_url       = COALESCE(p_photo_url,       photo_url),
        updated_at      = NOW()
    WHERE id = v_profile_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 33. update_province
-- Viloyatni yangilash
-- Returns: province number  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION update_province(
    p_id              INT,
    p_name            VARCHAR DEFAULT NULL,
    p_director_name   VARCHAR DEFAULT NULL,
    p_phone_number    VARCHAR DEFAULT NULL,
    p_location        VARCHAR DEFAULT NULL,
    p_description     TEXT    DEFAULT NULL,
    p_business_sphere VARCHAR DEFAULT NULL,
    p_photo_url       VARCHAR DEFAULT NULL,
    p_password_hint   VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id    UUID;
    v_profile_id UUID;
BEGIN
    SELECT u.id, up.id
    INTO v_user_id, v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_PROVINCE' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    IF p_name IS NOT NULL THEN
        UPDATE users SET name = p_name WHERE id = v_user_id;
    END IF;

    UPDATE user_profiles SET
        director_name   = COALESCE(p_director_name,   director_name),
        phone_number    = COALESCE(p_phone_number,     phone_number),
        location        = COALESCE(p_location,         location),
        description     = COALESCE(p_description,      description),
        business_sphere = COALESCE(p_business_sphere,  business_sphere),
        photo_url       = COALESCE(p_photo_url,        photo_url),
        password_hint   = COALESCE(p_password_hint,    password_hint),
        updated_at      = NOW()
    WHERE id = v_profile_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 34. update_region
-- Tumanni yangilash
-- Returns: region number  |  -1: not found
-- =============================================================
CREATE OR REPLACE FUNCTION update_region(
    p_id              INT,
    p_name            VARCHAR DEFAULT NULL,
    p_director_name   VARCHAR DEFAULT NULL,
    p_phone_number    VARCHAR DEFAULT NULL,
    p_location        VARCHAR DEFAULT NULL,
    p_description     TEXT    DEFAULT NULL,
    p_business_sphere VARCHAR DEFAULT NULL,
    p_photo_url       VARCHAR DEFAULT NULL,
    p_password_hint   VARCHAR DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_user_id    UUID;
    v_profile_id UUID;
BEGIN
    SELECT u.id, up.id
    INTO v_user_id, v_profile_id
    FROM users u
    JOIN users_roles ur  ON ur.users_id = u.id
    JOIN role r           ON r.id = ur.roles_id
    JOIN user_profiles up ON up.user_id = u.id
    WHERE r.name = 'ROLE_REGION' AND u.number = p_id AND up.deleted = false;

    IF v_profile_id IS NULL THEN
        RETURN -1;
    END IF;

    IF p_name IS NOT NULL THEN
        UPDATE users SET name = p_name WHERE id = v_user_id;
    END IF;

    UPDATE user_profiles SET
        director_name   = COALESCE(p_director_name,   director_name),
        phone_number    = COALESCE(p_phone_number,     phone_number),
        location        = COALESCE(p_location,         location),
        description     = COALESCE(p_description,      description),
        business_sphere = COALESCE(p_business_sphere,  business_sphere),
        photo_url       = COALESCE(p_photo_url,        photo_url),
        password_hint   = COALESCE(p_password_hint,    password_hint),
        updated_at      = NOW()
    WHERE id = v_profile_id;

    RETURN p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- USAGE EXAMPLES
-- =============================================================
-- SELECT add_monitor('Test Monitor', 'monitor1', 'pass123');
-- SELECT add_province('Tashkent', 'tashkent_p', 'pass123', 'Director', '+998901234567');
-- SELECT add_region('Yunusobod', 'yunusobod_r', 'pass123', 1);
-- SELECT add_terminal(5, 'Terminal A', NULL, '192.168.1.10', 'admin', 'pass', 'ZKTeco', NULL, false);
-- SELECT create_monthly_dates(202501);
-- SELECT * FROM get_feedbacks_for_superadmin(1, 20, NULL, false, NULL, NULL, NULL, NULL, NULL);
-- SELECT * FROM get_unread_feedback_counts();
-- SELECT * FROM login_with_hint('org_login', 'my hint');
-- SELECT activate_news(1, NOW(), NOW() + INTERVAL '30 days');
-- SELECT * FROM get_news_for_organization(5);
-- SELECT reset_terminal(1, 5);
-- =============================================================

