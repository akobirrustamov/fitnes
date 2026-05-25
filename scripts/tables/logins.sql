drop table if exists "logins";
create table if not exists "logins"(
    "id" serial primary key,
    "username" varchar(255) not null,
    "password_hash" varchar(255) not null,
    "created_at" timestamp default current_timestamp,
    "count" int default 0,
    "last_login" timestamp,
    "blocked_at" timestamp,
    "ip_address" varchar(45),
    "deleted" boolean default false,
    unique("username", "deleted")
);

alter table "logins"
owner to triple_seven;

--tezlashtirish uchun indexlar
create index if not exists "idx_logins_username" on "logins"("username") where "deleted" = false;
--password uchun
create index if not exists "idx_logins_password_hash" on "logins"("password_hash") where "deleted" = false;
--login va password birgalikda
create index if not exists "idx_logins_username_password" on "logins"("username", "password_hash") where "deleted" = false;
