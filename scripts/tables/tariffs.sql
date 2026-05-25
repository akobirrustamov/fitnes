CREATE TABLE IF NOT EXISTS "tariffs"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(100),
    "description" VARCHAR(1000),
    "price" NUMERIC(10,2),
    "created_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "deleted_time" TIMESTAMP NULL,
    "active" BOOLEAN DEFAULT TRUE,
    "duration_days" INT,
    "deleted" BOOLEAN DEFAULT FALSE
);

ALTER TABLE "tariffs" OWNER TO triple_seven;

-- Index qo'shish (Performance uchun)
CREATE INDEX IF NOT EXISTS idx_tariffs_active ON "tariffs"("active");
CREATE INDEX IF NOT EXISTS idx_tariffs_deleted ON "tariffs"("deleted");
CREATE INDEX IF NOT EXISTS idx_tariffs_price ON "tariffs"("price");
CREATE INDEX IF NOT EXISTS idx_tariffs_duration_days ON "tariffs"("duration_days");
CREATE INDEX IF NOT EXISTS idx_tariffs_created_time ON "tariffs"("created_time");
CREATE INDEX IF NOT EXISTS idx_tariffs_updated_time ON "tariffs"("updated_time");