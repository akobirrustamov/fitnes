drop table if exists "roles";
create table if not exists "roles"(
    "id" serial,
    "name" varchar,
    "short_name" varchar,
    "created_time" timestamp default now(),
    "deleted" boolean not null default false
);

alter table "roles"
owner to triple_seven;

insert into "roles"("short_name","name") values
('director', 'Tashkilot rahbari'),
('super_admin', 'FirCRM egasi'),
('user', 'Foydalanuvchi'),
('monitor', 'Server monitoring'),
('province', 'Viloyat'),
('region', 'Tuman/Shahar'),
('ghost_user', 'Mijoz');

--Indexlar, short_name uchun qidirish tezlashishi uchun
create unique index if not exists "idx_roles_short_name" on "roles"("short_name") where deleted = false;