-- refresh_tokens jadvalini yaratish
DROP TABLE IF EXISTS "refresh_tokens";

CREATE TABLE IF NOT EXISTS "refresh_tokens"(
    "id" SERIAL PRIMARY KEY,
    "role_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(50) NOT NULL,
    "refresh_token" VARCHAR(20) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "refresh_expires_at" TIMESTAMP NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT FALSE,
    "revoked_time" TIMESTAMP,
    "created_time" TIMESTAMP NOT NULL DEFAULT NOW(),
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "user_agent" varchar(1000) not null default 'Unknown',
    "ip_address" varchar(20) not null default 'Unknown',
    FOREIGN KEY ("role_id") REFERENCES "roles"("id")
);

ALTER TABLE "refresh_tokens" OWNER TO triple_seven;

-- Indekslar
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token" ON "refresh_tokens"("token");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_refresh_token" ON "refresh_tokens"("refresh_token");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_role" ON "refresh_tokens"("user_id", "role_id");