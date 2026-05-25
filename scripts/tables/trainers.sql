drop table if exists "trainers";
create table if not exists "trainers"(
    "id" serial,
    "organization_id" int not null,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted" boolean not null default false,
    "deleted_time" timestamp default null,
    "fullname" varchar(255) not null,
    "photo_url" varchar(500) default null,
    "achievements" text default null,
    "price" numeric(14,2) not null default 0.00,
    "phone_number" varchar(20) default null,
    "specialization" varchar(255) default null,
    "experience_years" int default 0,
    "bio" text default null,
    "active" boolean default true,
    "students_count" int default 0,
    "expected_income_this_month" numeric(14,2) default 0.00,
    "actual_income_this_month" numeric(14,2) default 0.00,
    primary key ("id")
);

alter table "trainers"
owner to triple_seven;

-- Indexlar yaratish
create index if not exists "idx_trainers_organization_id" on "trainers"("organization_id") where "deleted" = false;
create index if not exists "idx_trainers_fullname" on "trainers"("fullname") where "deleted" = false and "active" = true;
create index if not exists "idx_trainers_phone" on "trainers"("phone_number") where "deleted" = false;
