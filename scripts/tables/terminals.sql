drop table if exists "terminals";
create table if not exists "terminals"(
    "id" serial,
    "organization_id" integer,
    "name" varchar(100),
    "description" varchar(1000),
    "filter" varchar(1000),
    "created_time" timestamp default now(),
    "last_online" timestamp default now(),
    "ip" varchar(50),
    "login" varchar(50),
    "password" varchar(50),
    "model" text,
    "deleted" boolean not null default false,
    "is_coming" BOOLEAN not null default true,
    "is_online" BOOLEAN not null default false
);

alter table "terminals"
owner to triple_seven;

-- Indexes, organization_id, name va filter uchun indexlar kerak, tezroq qidiruv uchun
create index if not exists "terminals_organization_id_idx" on "terminals" ("organization_id") where deleted = false;
create index if not exists "terminals_name_idx" on "terminals" ("name") where deleted = false;
create index if not exists "terminals_filter_idx" on "terminals" ("filter") where deleted = false;
create index if not exists "terminals_is_coming_idx" on "terminals" ("is_coming") where deleted = false;