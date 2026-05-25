drop table if exists "person";
create table if not exists "person"(
    "id" serial,
    "organization_id" int,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted" boolean not null default false,
    "deleted_time" timestamp default null,
    "fullname" varchar(255) not null,
    "market_debt" numeric(20,2) default 0,
    "trainer_debt" numeric(20,2) default 0,
    "zal_debt" numeric(20,2) default 0,
    "total_debt" numeric(20,2) default 0,
    "photo_url" varchar(255) default null,
    "phone_number" varchar(20) default null,
    "gender" varchar(10) default null,
    "birth_date" date default null,
    "location" varchar(255) default null,
    "graphic_id" int default null,
    "subscribe_end_date" date default CURRENT_DATE,
    "access_count" int default 0,
    "trainer_id" int default 0,
    "trainer_end_date" date default null,
    "active" boolean default true,
    "is_client" boolean default true,
    primary key ("id")
);

alter table "person"
owner to triple_seven;

--tezroq ishlashi uchun name, organization_id bo'yicha indexlar, deleted = falselar ichida qaralishi kerak
create index if not exists "idx_person_name_org_deleted" on "person"("fullname", "organization_id") where "deleted" = false;
create index if not exists "idx_person_org_deleted" on "person"("organization_id") where "deleted" = false;
create index if not exists "idx_person_phone_org_deleted" on "person"("phone_number", "organization_id") where "deleted" = false;
create index if not exists "idx_person_graphic_id" on "person"("graphic_id") where "deleted" = false;
create index if not exists "idx_person_total_debt" on "person"("total_debt") where "deleted" = false;
create index if not exists "idx_person_market_debt" on "person"("market_debt") where "deleted" = false;
create index if not exists "idx_person_trainer_debt" on "person"("trainer_debt") where "deleted" = false;
create index if not exists "idx_person_zal_debt" on "person"("zal_debt") where "deleted" = false;