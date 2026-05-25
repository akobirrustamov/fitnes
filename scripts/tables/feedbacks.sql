CREATE TABLE IF NOT EXISTS "feedbacks"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(100),
    "description" VARCHAR(1000),
    "email" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "created_time" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "message_from" VARCHAR(50) NOT NULL DEFAULT 'organization', -- 'organization', 'guest'
    "reply_for" INT,
    "organization_id" INT,
    "region_id" INT,
    "markup" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_seen" BOOLEAN NOT NULL DEFAULT FALSE,
    "seen_time" TIMESTAMP,
    "is_registration" BOOLEAN NOT NULL DEFAULT FALSE, -- Yangi: Registratsiya xabarlari uchun
    "sender_ip" VARCHAR(50), -- Yangi: Guest IP manzili
    "sender_name" VARCHAR(100), -- Yangi: Guest nomi
    "company_name" VARCHAR(200), -- Yangi: Registratsiya uchun kompaniya nomi
    "inn" VARCHAR(50) -- Yangi: Registratsiya uchun INN
);

ALTER TABLE "feedbacks" OWNER TO triple_seven;

-- Index qo'shish (Performance uchun)
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_seen ON feedbacks(is_seen);
CREATE INDEX IF NOT EXISTS idx_feedbacks_markup ON feedbacks(markup);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_registration ON feedbacks(is_registration);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_time ON feedbacks(created_time DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_organization_id ON feedbacks(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_sender_ip ON feedbacks(sender_ip);
