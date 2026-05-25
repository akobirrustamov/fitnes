drop table if exists regions;

create table if not exists regions(
    "id" serial,
    "name" varchar(50),
    "login" varchar(30),
    "password" varchar(30),
    "created_time" timestamp not null default now(),
    "updated_time" timestamp not null default now(),
    "deleted_time" timestamp default null,
    "password_hint" varchar(500),
    "deleted" boolean not null default false,
    "province_id" int,
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

alter table regions
owner to triple_seven;

--Name, province_id, role_id va login bo'yicha indexlar:
create index idx_regions_name on regions(name) where deleted = false;
create index idx_regions_province_id on regions(province_id) where deleted = false;
create index idx_regions_role_id on regions(role_id) where deleted = false;
create index idx_regions_login on regions(login) where deleted = false;
create index idx_regions_active on regions(active) where deleted = false;