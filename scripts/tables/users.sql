drop table if exists users;
create table if not exists users(
    "id" serial,
    "name" varchar,
    "login" varchar(30),
    "password" varchar(30),
    "created_time" timestamp default now(),
    "password_hint" varchar,
    "deleted" boolean not null default false,
    "description" varchar(100),
    "role_id" int,
    "active" boolean not null default true,
    "last_login" timestamp default now(),
    "director_name" varchar(100),
    "photo_url" varchar(500),
    "phone_number" varchar(15),
    "business_sphere" varchar(100),
    "location" varchar(200)
);

alter table users
owner to triple_seven;

insert into users(name, login, password, password_hint, token, description, role_id, director_name, photo_url, phone_number, business_sphere, "location") values
('Superadmin', 'admin', 'tdb29102003', 'Doimgi td lik parol', 'Bu superadmin va u barcha ishlarni qila oladi', 1, 'Tolibov Diyorbek Bahodir o''g''li', '', '+998994461743', 'Owner', '');

--Indexlar, login uchun
create unique index if not exists users_login_uindex on users (login) where deleted = false;