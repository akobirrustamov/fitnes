drop table if exists "payments";
create table if not exists "payments"(
    "id" serial,
    "organization_id" int,
    "created_time" timestamp default now(),
    "updated_time" timestamp default now(),
    "deleted" boolean not null default false,
    "deleted_time" timestamp default null,
    "person_id" int,
    "amount" numeric(14,2) not null,
    "payment_type" varchar(50) not null, --income, expense
    "description" text default null,
    "payment_date" date not null,
    "category" varchar(100) default 'market', --market, trainer, abonent
    "is_important" boolean default true
);

alter table "payments"
owner to triple_seven;

--tezroq ishlashi uchun indexlar, deleted = falselar ichida qaralishi kerak
create index if not exists "idx_payments_organization_id" on "payments" ("organization_id") where deleted = false;
create index if not exists "idx_payments_person_id" on "payments" ("person_id") where deleted = false;
create index if not exists "idx_payments_payment_date" on "payments" ("payment_date") where deleted = false;
create index if not exists "idx_payments_payment_type" on "payments" ("payment_type") where deleted = false;
create index if not exists "idx_payments_category" on "payments" ("category") where deleted = false;