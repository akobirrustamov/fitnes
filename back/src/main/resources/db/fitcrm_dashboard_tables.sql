-- =============================================================
-- FitCRM – Dashboard Additional Tables
-- Run AFTER fitcrm_functions.sql
-- =============================================================

-- Extend persons with subscription & financial fields
ALTER TABLE persons
    ADD COLUMN IF NOT EXISTS debt             DECIMAL(18, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subscription_end DATE,
    ADD COLUMN IF NOT EXISTS category_id      INTEGER,
    ADD COLUMN IF NOT EXISTS is_staff         BOOLEAN        NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS phone_number     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS gender           VARCHAR(20),
    ADD COLUMN IF NOT EXISTS birth_date       DATE,
    ADD COLUMN IF NOT EXISTS location         VARCHAR(255),
    ADD COLUMN IF NOT EXISTS graphic_id       INTEGER,
    ADD COLUMN IF NOT EXISTS access_count     INTEGER        NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS trainer_id       INTEGER,
    ADD COLUMN IF NOT EXISTS created_time     TIMESTAMP      NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_time     TIMESTAMP;

-- Payments / Income tracking
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER       NOT NULL,
    person_id       BIGINT,
    category_id     INTEGER,
    category        VARCHAR(50),
    amount          DECIMAL(18, 2) NOT NULL,
    price           DECIMAL(18, 2),
    payment_type    VARCHAR(20),
    is_important    BOOLEAN        NOT NULL DEFAULT true,
    description     VARCHAR(500),
    payment_date    TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_time    TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_org      ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_date     ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_category ON payments(category_id);

-- Attendance entries
CREATE TABLE IF NOT EXISTS entries (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER   NOT NULL,
    person_id       BIGINT    NOT NULL,
    terminal_id     BIGINT,
    direction       VARCHAR(5) NOT NULL DEFAULT 'IN',   -- IN | OUT
    entry_time      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entries_org  ON entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_time);

-- Organization graphics (weekly templates)
CREATE TABLE IF NOT EXISTS organization_graphics (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER      NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(500),
    is_monday       BOOLEAN      NOT NULL DEFAULT false,
    is_tuesday      BOOLEAN      NOT NULL DEFAULT false,
    is_wednesday    BOOLEAN      NOT NULL DEFAULT false,
    is_thursday     BOOLEAN      NOT NULL DEFAULT false,
    is_friday       BOOLEAN      NOT NULL DEFAULT false,
    is_saturday     BOOLEAN      NOT NULL DEFAULT false,
    is_sunday       BOOLEAN      NOT NULL DEFAULT false,
    created_time    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_time    TIMESTAMP,
    deleted         BOOLEAN      NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_org_graphics_org ON organization_graphics(organization_id);

-- API settings
CREATE TABLE IF NOT EXISTS api_settings (
    id                 BIGSERIAL PRIMARY KEY,
    max_graphics_count INTEGER NOT NULL DEFAULT 50
);

INSERT INTO api_settings (max_graphics_count)
SELECT 50
WHERE NOT EXISTS (SELECT 1 FROM api_settings);

