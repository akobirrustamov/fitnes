drop table if exists "api_settings";
create table if not exists "api_settings"(
    "id" serial,
    "organization_id" int,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted" boolean not null default false,
    "deleted_time" timestamp default null,
    "max_users_count" int default 1000,
    "max_graphics_count" int default 50,
    "max_terminals_count" int default 10,
    "opening_time" time default '10:00:00'::time,
    "closing_time" time default '22:00:00'::time,
    "price_per_user" numeric(10,2) default 0.00
);

alter table "api_settings"
owner to triple_seven;

--tezroq ishlashi uchun name, organization_id bo'yicha indexlar, deleted = falselar ichida qaralishi kerak
create index if not exists "idx_api_settings_organization_id" on "api_settings"("organization_id") where deleted = false;
