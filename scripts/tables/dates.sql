drop table if exists dates;
create table if not exists dates(
    "id" serial,
    "date" date,
    "is_holiday" boolean not null default false,
    "created_time" timestamp default now(),
    "organization_id" integer,
    "deleted" boolean not null default false
);

alter table dates
owner to triple_seven;