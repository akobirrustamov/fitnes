drop table if exists "messages";
create table if not exists "messages"(
    "id" serial,
    "organization_id" int,
    "type" varchar(50),
    "title" varchar(100),
    "message" text,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted_time" timestamp default null,
    "is_seen" boolean default false,
    "seen_time" timestamp default null
);

alter table "messages"
owner to triple_seven;