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
    ADD COLUMN IF NOT EXISTS phone_number     VARCHAR(50);

-- Payments / Income tracking
CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL PRIMARY KEY,
    organization_id INTEGER       NOT NULL,
    person_id       BIGINT,
    category_id     INTEGER,
    amount          DECIMAL(18, 2) NOT NULL,
    description     VARCHAR(500),
    payment_date    TIMESTAMP     NOT NULL DEFAULT NOW()
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

