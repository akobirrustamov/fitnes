drop table if exists "organizations";
create table if not exists "organizations"(
    "id" serial,
    "name" varchar,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted_time" timestamp default null,
    "tariff_id" int,
    "director_name" varchar,
    "director_birth_date" date,
    "login" varchar,
    "password" varchar,
    "password_hint" varchar,
    "active" boolean not null default true,
    "deleted" boolean not null default false,
    "phone_number" varchar(15),
    "business_sphere" varchar(100),
    "role_id" int,
    "photo_url" varchar(1000),
    "last_login" timestamp not null default now(),
    "location" text not null default '',
    "admin_name" varchar(100) not null default '',
    "admin_phone_number" varchar(12) not null default '',
    "region_id" int not null default 0,
    "is_subscribed" boolean not null default false,
    "subscription_end_date" timestamp default null,
    "monitor_id" int
);

alter table "organizations"
owner to triple_seven;

--Qidirishni tezlashtirish uchun keylar, deleted = false bo'lgan organizationlar ichidan 
create index if not exists organizations_name_idx on organizations (name) where deleted = false;
--send_turn, region_id, login bo'yicha 3 ta index yaratish qoldi
create index if not exists organizations_region_id_idx on organizations (region_id) where deleted = false;
create index if not exists organizations_login_idx on organizations (login) where deleted = false;
create index if not exists organizations_phone_number_idx on organizations (phone_number) where deleted = false;