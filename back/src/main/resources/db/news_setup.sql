-- =============================================================
-- NEWS tables & functions
-- Run once in PostgreSQL to enable news CRUD
-- =============================================================

-- 1. Tables

CREATE TABLE IF NOT EXISTS news (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT          NOT NULL,
    description TEXT,
    content     TEXT,
    photo_url   VARCHAR(500),
    url         VARCHAR(500),
    active      BOOLEAN       NOT NULL DEFAULT FALSE,
    start_time  TIMESTAMP,
    end_time    TIMESTAMP,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS news_organizations (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER   NOT NULL,
    news_id         BIGINT    NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    is_read         BOOLEAN   NOT NULL DEFAULT FALSE,
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(news_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_news_org_org  ON news_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_news_org_read ON news_organizations(is_read);

-- =============================================================
-- 2. add_news  (all TEXT — matches CAST(? AS TEXT) in Java)
-- Returns: new news id
-- =============================================================
CREATE OR REPLACE FUNCTION public.add_news(
    p_title       TEXT,
    p_description TEXT DEFAULT NULL,
    p_content     TEXT DEFAULT NULL,
    p_photo_url   TEXT DEFAULT NULL,
    p_url         TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_id BIGINT;
BEGIN
    INSERT INTO news (title, description, content, photo_url, url, active, created_at)
    VALUES (p_title, p_description, p_content, p_photo_url, p_url, FALSE, NOW())
    RETURNING id INTO v_id;

    RETURN v_id::INT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 3. update_news
-- Returns: news id  |  -1: not found  |  -2: already active
-- =============================================================
CREATE OR REPLACE FUNCTION public.update_news(
    p_id          BIGINT,
    p_title       TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_content     TEXT DEFAULT NULL,
    p_photo_url   TEXT DEFAULT NULL,
    p_url         TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT active INTO v_active FROM news WHERE id = p_id;

    IF NOT FOUND THEN RETURN -1; END IF;
    IF v_active   THEN RETURN -2; END IF;

    UPDATE news SET
        title       = COALESCE(p_title,       title),
        description = COALESCE(p_description, description),
        content     = COALESCE(p_content,     content),
        photo_url   = COALESCE(p_photo_url,   photo_url),
        url         = COALESCE(p_url,         url)
    WHERE id = p_id;

    RETURN p_id::INT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- 4. delete_news
-- Returns: 1  |  -1: not found  |  -2: news is active
-- =============================================================
CREATE OR REPLACE FUNCTION public.delete_news(p_id BIGINT)
RETURNS INT AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT active INTO v_active FROM news WHERE id = p_id;

    IF NOT FOUND THEN RETURN -1; END IF;
    IF v_active   THEN RETURN -2; END IF;

    DELETE FROM news_organizations WHERE news_id = p_id;
    DELETE FROM news WHERE id = p_id;

    RETURN 1;
END;
$$ LANGUAGE plpgsql;
