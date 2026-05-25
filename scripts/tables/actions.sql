drop table if exists actions;
create table if not exists actions(
    "id" bigserial,
    "person_id" int,
    "organization_id" int,
    "incoming_time" timestamp,
    "outgoing_time" timestamp,
    "created_time" timestamp not null default now(),
    "deleted" boolean not null default false,
    "today_is_important" boolean,
    "date" date not null default current_date,
    "datetime" timestamp,
    "s_days" integer not null default 0
);

alter table actions
owner to triple_seven;

-- Actions uchun
CREATE UNIQUE INDEX IF NOT EXISTS idx_actions_date_person 
ON actions(date, person_id) where deleted = false;

--Tezroq ishlashi uchun indexlarning barchasini yaratish:
CREATE INDEX IF NOT EXISTS idx_actions_person_id
ON actions(person_id) where deleted = false;
CREATE INDEX IF NOT EXISTS idx_actions_organization_id
ON actions(organization_id) where deleted = false;
CREATE INDEX IF NOT EXISTS idx_actions_incoming_time
ON actions(incoming_time) where deleted = false;
CREATE INDEX IF NOT EXISTS idx_actions_outgoing_time
ON actions(outgoing_time) where deleted = false;
