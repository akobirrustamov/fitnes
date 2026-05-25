drop table if exists "categories";
create table if not exists "categories"(
    "id" serial,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted" boolean not null default false,
    "deleted_time" timestamp default null,
    "name_uz" varchar(255) not null,
    "name_ru" varchar(255) not null,
    "name_uzk" varchar(255) not null,
    "description" text default null,
    "icon_url" varchar(500) default null,
    "display_order" int default 0,
    primary key ("id")
);

alter table "categories"
owner to triple_seven;

-- Index yaratish
create index if not exists "idx_categories_name" on "categories"("name_uz") where "deleted" = false;
create index if not exists "idx_categories_order" on "categories"("display_order") where "deleted" = false;
