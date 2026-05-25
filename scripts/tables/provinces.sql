drop table if exists provinces;

create table if not exists provinces(
    "id" serial,
    "name" varchar(50),
    "login" varchar(30),
    "password" varchar(30),
    "created_time" timestamp not null default now(),
    "updated_time" timestamp not null default now(),
    "deleted_time" timestamp default null,
    "password_hint" varchar,
    "deleted" boolean not null default false,
    "description" varchar(100),
    "role_id" int,
    "active" boolean not null default true,
    "last_login" timestamp not null default now(),
    "director_name" varchar(100),
    "photo_url" varchar(500),
    "phone_number" varchar(15),
    "business_sphere" varchar(100),
    "location" varchar(200)
);

alter table provinces
owner to triple_seven;

--Indexlar, login va name bo'yicha
create index provinces_login_idx on provinces (login) where deleted = false;
create index provinces_name_idx on provinces (name) where deleted = false;
