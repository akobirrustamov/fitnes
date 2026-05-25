drop table if exists "monitors";
create table if not exists "monitors"(
    "id" serial,
    "name" varchar(100),
    "description" varchar(1000),
    "created_time" timestamp default now(),
    "login" varchar,
    "password" varchar,
    "active" boolean not null default true,
    "deleted" boolean not null default false,
    "role_id" int,
    "last_login" timestamp not null default now(),
    "last_ip" varchar(20)
);

alter table "monitors"
owner to triple_seven;

--Indexlar, qidiruvlar uchun
create index if not exists "monitors_id_index" on "monitors"("id");
create index if not exists "monitors_name_index" on "monitors"("name");
create index if not exists "monitors_login_index" on "monitors"("login");