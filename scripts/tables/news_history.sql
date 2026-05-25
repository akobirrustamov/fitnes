drop table if exists news_history;
CREATE TABLE IF NOT EXISTS "news_history"(
    "id" SERIAL PRIMARY KEY,
    "news_id" INT NOT NULL,
    "organization_id" INT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
    "read_time" TIMESTAMP,
    "created_time" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_news FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE "news_history" OWNER TO triple_seven;

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_news_history_news_id ON news_history(news_id);
CREATE INDEX IF NOT EXISTS idx_news_history_organization_id ON news_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_news_history_is_read ON news_history(is_read);
CREATE INDEX IF NOT EXISTS idx_news_history_composite ON news_history(organization_id, is_read, deleted);