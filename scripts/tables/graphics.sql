drop table if exists graphics;
create table if not exists graphics(
    "id" serial,
    "name" varchar,
    "created_time" timestamp default now(),
    "deleted" boolean not null default false,
    "description" varchar(100),
    "organization_id" integer,
    "is_monday" boolean not null default true,
    "is_tuesday" boolean not null default true,
    "is_wednesday" boolean not null default true,
    "is_thursday" boolean not null default true,
    "is_friday" boolean not null default true,
    "is_saturday" boolean not null default true,
    "is_sunday" boolean not null default false
);

alter table graphics
owner to triple_seven;

--Indexlar, organization_id bo'yicha qidirishni tezlashtirish uchun
create index if not exists idx_graphics_organization_id on graphics(organization_id) where deleted = false;