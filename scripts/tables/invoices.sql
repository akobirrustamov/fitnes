drop table if exists invoices;

create table if not exists invoices(
    "id" bigserial,
    "organization_id" int,
    "price" int,
    "subscribe_begin_time" timestamp,
    "subscribe_end_time" timestamp,
    "deleted" boolean not null default false,
    "revoked_time" timestamp not null default now() + interval'7 day',
    "description" varchar(1000),
    "provider" varchar(50),
    "created_time" timestamp not null default now(),
    "secret_token" varchar(50),
    "is_prepared" boolean,
    "is_completed" boolean,
    "checkout_url" varchar(500),
    "prepare_model" text,
    "complete_model" text,
    "fiskal_url" varchar(2000),
    "operator" varchar(50),
    "is_accepted" BOOLEAN not null default false
);

alter table invoices
owner to triple_seven;