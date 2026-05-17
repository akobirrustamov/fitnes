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
    max_graphics_count INTEGER NOT NULL DEFAULT 50,
    max_terminals_count INTEGER NOT NULL DEFAULT 10
);

ALTER TABLE api_settings
    ADD COLUMN IF NOT EXISTS max_terminals_count INTEGER NOT NULL DEFAULT 10;

INSERT INTO api_settings (max_graphics_count, max_terminals_count)
SELECT 50, 10
WHERE NOT EXISTS (SELECT 1 FROM api_settings);

-- Optional terminal online fields
ALTER TABLE terminals
    ADD COLUMN IF NOT EXISTS last_online TIMESTAMP,
    ADD COLUMN IF NOT EXISTS is_online   BOOLEAN NOT NULL DEFAULT false;

-- Trainers
CREATE TABLE IF NOT EXISTS trainers (
    id               BIGSERIAL PRIMARY KEY,
    organization_id  INTEGER       NOT NULL,
    fullname         VARCHAR(255)  NOT NULL,
    photo_url        VARCHAR(500),
    achievements     VARCHAR(1000),
    price            DECIMAL(18, 2) NOT NULL DEFAULT 0,
    phone_number     VARCHAR(50),
    specialization   VARCHAR(255),
    experience_years INTEGER,
    bio              TEXT,
    active           BOOLEAN       NOT NULL DEFAULT true,
    created_time     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_time     TIMESTAMP,
    deleted          BOOLEAN       NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_trainers_org ON trainers(organization_id);

-- Market products
CREATE TABLE IF NOT EXISTS market_products (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER       NOT NULL,
    category_id     INTEGER,
    name            VARCHAR(255)  NOT NULL,
    description     VARCHAR(1000),
    photo_url       VARCHAR(500),
    price           DECIMAL(18, 2) NOT NULL DEFAULT 0,
    stock_count     INTEGER       NOT NULL DEFAULT 0,
    active          BOOLEAN       NOT NULL DEFAULT true,
    barcode         VARCHAR(100),
    created_time    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_time    TIMESTAMP,
    deleted         BOOLEAN       NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_market_products_org      ON market_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_market_products_category ON market_products(category_id);

-- Market sales header
CREATE TABLE IF NOT EXISTS market_sales (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER       NOT NULL,
    person_id       BIGINT        NOT NULL,
    total_price     DECIMAL(18, 2) NOT NULL,
    paid_amount     DECIMAL(18, 2) NOT NULL DEFAULT 0,
    created_time    TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_sales_org ON market_sales(organization_id);

-- Market sales items
CREATE TABLE IF NOT EXISTS market_sale_items (
    id           BIGSERIAL PRIMARY KEY,
    sale_id      BIGINT         NOT NULL REFERENCES market_sales(id) ON DELETE CASCADE,
    product_id   BIGINT         NOT NULL,
    product_name VARCHAR(255),
    amount       INTEGER        NOT NULL,
    price        DECIMAL(18, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_market_sale_items_sale ON market_sale_items(sale_id);

