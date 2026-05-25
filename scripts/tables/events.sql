drop table if exists events;
create table if not exists events(
    "id" serial,
    "terminal_id" integer,
    "created_time" timestamp default now(),
    "event_time" timestamp not null,
    "organization_id" integer,
    "event_type" integer,
    "person_id" integer,
    "model" text,
    "deleted" boolean not null default false,
    "is_accept" boolean default false,
    "is_coming" boolean default true,
    "photo_url" varchar(500)
);

alter table events
owner to triple_seven;

-- Indexes, event_time, organization_id, person_id, terminal_id lar bo'yicha deleted = false bo'lganlarni qidirish uchun
create index if not exists idx_events_event_time on events(event_time) where deleted = false;
create index if not exists idx_events_organization_id on events(organization_id) where deleted = false;
create index if not exists idx_events_person_id on events(person_id) where deleted = false;
create index if not exists idx_events_terminal_id on events(terminal_id) where deleted = false;
