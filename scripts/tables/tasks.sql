drop table if exists tasks;
create table if not exists tasks(
    "id" bigserial,
    "person_id" int,
    "organization_id" int,
    "terminal_id" int,
    "status" int,
    "created_time" timestamp not null default now(),
    "deleted" boolean not null default false,
    "task_type" integer,
    "data" varchar(2000),
    "executed_time" timestamp
);

alter table tasks
owner to triple_seven;

--Indexlar, organization_id, terminal_id, person_id, status, task_type lar uchun deleted = false bo'lgan qiymatlar uchun
create index if not exists idx_tasks_organization_id on tasks(organization_id) where deleted = false;
create index if not exists idx_tasks_terminal_id on tasks(terminal_id) where deleted = false;
create index if not exists idx_tasks_person_id on tasks(person_id) where deleted = false;
create index if not exists idx_tasks_status on tasks(status) where deleted = false;
create index if not exists idx_tasks_task_type on tasks(task_type) where deleted = false;