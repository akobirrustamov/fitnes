drop table if exists "market";
create table if not exists "market"(
    "id" serial,
    "organization_id" int not null,
    "category_id" int not null,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted" boolean not null default false,
    "deleted_time" timestamp default null,
    "name" varchar(255) not null,
    "description" text default null,
    "photo_url" varchar(500) default null,
    "price" numeric(14,2) not null default 0.00,
    "stock_count" int default 0,
    "active" boolean default true,
    "barcode" varchar(100) default null,
    primary key ("id")
);

alter table "market"
owner to triple_seven;

-- Indexlar yaratish
create index if not exists "idx_market_organization_id" on "market"("organization_id") where "deleted" = false;
create index if not exists "idx_market_category_id" on "market"("category_id") where "deleted" = false;
create index if not exists "idx_market_name" on "market"("name") where "deleted" = false and "active" = true;
create index if not exists "idx_market_barcode" on "market"("barcode") where "deleted" = false;
