drop table if exists "recovery_requests";
create table if not exists "recovery_requests"(
    "id" serial,
    "created_time" timestamp not null default now(),
    "phone_number" varchar(20),
    "password" varchar(6),
    "is_sending" boolean not null default false,
    "expiry_time" timestamp not null default now() + interval'2 minutes',
    "is_accept" boolean not null default false,
    "deleted" boolean not null default false,
    "organization_id" integer,
    "body" text,
    "role_id" integer not null default 0
);

alter table "recovery_requests"
owner to triple_seven;

--Indexlar, tezroq ishlashi uchun. organization_id, role_id, phone_numberlar uchun
create index if not exists "idx_recovery_requests_organization_id" on "recovery_requests"("organization_id");
create index if not exists "idx_recovery_requests_role_id" on "recovery_requests"("role_id");
create index if not exists "idx_recovery_requests_phone_number" on "recovery_requests"("phone_number");
create index if not exists "idx_recovery_requests_is_accept" on "recovery_requests"("is_accept");