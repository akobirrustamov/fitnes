drop table if exists news;
CREATE TABLE IF NOT EXISTS "news"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "photo_url" VARCHAR(500),
    "content" TEXT, -- Yangi: To'liq matn
    "url" VARCHAR(500), -- Yangi: Tashqi link
    "created_time" TIMESTAMP NOT NULL DEFAULT NOW(),
    "created_by" INT, -- Yangi: Kim yaratdi (user_id)
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "active" BOOLEAN NOT NULL DEFAULT FALSE, -- Yangi: Faol/Faol emas
    "start_time" TIMESTAMP, -- Yangi: Yangilik boshlanish vaqti
    "end_time" TIMESTAMP -- Yangi: Yangilik tugash vaqti
);

ALTER TABLE "news" OWNER TO triple_seven;

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_news_active ON news(active);
CREATE INDEX IF NOT EXISTS idx_news_deleted ON news(deleted);
CREATE INDEX IF NOT EXISTS idx_news_created_time ON news(created_time DESC);
CREATE INDEX IF NOT EXISTS idx_news_start_end_time ON news(start_time, end_time);
