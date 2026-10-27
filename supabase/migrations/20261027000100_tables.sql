-- §1.2 Tables (in FK dependency order) + check constraints.
-- RLS, grants and policies are applied in 20261027000400_rls_and_grants.sql.

-- Start closed. Supabase's default privileges grant ALL on every new table,
-- view and sequence (and EXECUTE on functions) to anon/authenticated. We
-- revoke those defaults so every object created by migrations is
-- inaccessible until a later migration grants it explicitly (§1.3, §1.6).
-- Postgres' built-in EXECUTE-to-PUBLIC on functions cannot be removed per
-- schema, so every function migration must still `revoke ... from public`.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  logo_url    text,
  sector      text,
  created_at  timestamptz default now()
);

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  label       text unique not null,            -- "Software Engineer"
  aliases     text[] not null default '{}',    -- {"SDE","SDE-1"} for picker search
  created_at  timestamptz default now()
);

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  label       text unique not null,            -- "Dynamic Programming"
  category    text not null,                   -- "DSA" | "CS Fundamentals" | "Aptitude" ...
  aliases     text[] not null default '{}',
  created_at  timestamptz default now()
);

create table public.branches (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,            -- "CSE"
  label       text not null                    -- "Computer Science & Engineering"
);
-- Taxonomy (roles, topics, branches) is managed via seed.sql + migrations only (no admin UI).

create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  url         text not null,
  type        text not null check (type in ('video','article','course','book')),
  topic_id    uuid references public.topics(id),
  company_id  uuid references public.companies(id),
  created_at  timestamptz default now()
);

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'student' check (role in ('student','alumni','admin')),
  branch_id   uuid references public.branches(id),
  cgpa        numeric(4,2) check (cgpa between 0 and 10),
  backlogs    int not null default 0 check (backlogs >= 0),
  pct_10th    numeric(5,2) check (pct_10th between 0 and 100),
  pct_12th    numeric(5,2) check (pct_12th between 0 and 100),
  grad_year   int check (grad_year between 2000 and 2100),
  created_at  timestamptz default now()
);

create table public.drives (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  role_id           uuid not null references public.roles(id),
  title             text not null,
  eligibility_cgpa  numeric(4,2) check (eligibility_cgpa between 0 and 10),
  max_backlogs      int not null default 0 check (max_backlogs >= 0),
  min_10th_pct      numeric(5,2) check (min_10th_pct between 0 and 100),
  min_12th_pct      numeric(5,2) check (min_12th_pct between 0 and 100),
  grad_years        int[] not null default '{}',   -- empty = all years (rule exception, §1.1)
  drive_date        date,
  location          text,
  status            text not null default 'upcoming'
                    check (status in ('upcoming','ongoing','completed','cancelled')),
  created_by        uuid references public.profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table public.drive_branches (                 -- no rows = all branches eligible
  drive_id    uuid not null references public.drives(id) on delete cascade,
  branch_id   uuid not null references public.branches(id),
  primary key (drive_id, branch_id)
);

create table public.rounds (
  id          uuid primary key default gen_random_uuid(),
  drive_id    uuid not null references public.drives(id) on delete cascade,
  name        text not null,
  position    int not null,
  description text,
  unique (drive_id, position)
);

create table public.round_topics (
  round_id    uuid not null references public.rounds(id) on delete cascade,
  topic_id    uuid not null references public.topics(id),
  primary key (round_id, topic_id)
);

create table public.round_resources (
  round_id    uuid not null references public.rounds(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  primary key (round_id, resource_id)
);

create table public.experiences (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id),
  company_id        uuid not null references public.companies(id),
  role_id           uuid not null references public.roles(id),
  drive_id          uuid references public.drives(id),
  rounds_summary    text,                          -- narrative; not aggregated
  preparation_timeline text,
  evidence_path     text,                          -- private bucket; never publicly readable
  status            text not null default 'pending'
                    check (status in ('pending','verified','rejected')),
  rejection_reason  text,
  verified_by       uuid references public.profiles(id),
  verified_at       timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table public.experience_topics (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  topic_id      uuid not null references public.topics(id),
  primary key (experience_id, topic_id)
);

create table public.experience_resources (
  experience_id uuid not null references public.experiences(id) on delete cascade,
  resource_id   uuid not null references public.resources(id) on delete cascade,
  primary key (experience_id, resource_id)
);

create table public.prep_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  drive_id      uuid not null references public.drives(id) on delete cascade,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, drive_id)
);

create table public.plan_items (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.prep_plans(id) on delete cascade,
  topic_id      uuid references public.topics(id),
  position      int not null,
  week          int not null check (week >= 1),
  label         text not null,
  done          boolean not null default false,
  done_at       timestamptz,
  unique (plan_id, position)
);

create table public.plan_item_resources (
  plan_item_id  uuid not null references public.plan_items(id) on delete cascade,
  resource_id   uuid not null references public.resources(id) on delete cascade,
  primary key (plan_item_id, resource_id)
);

create table public.plan_experiences (               -- provenance
  plan_id       uuid not null references public.prep_plans(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete restrict,
  primary key (plan_id, experience_id)
);
-- on delete restrict is intentional: a verified experience cited by a plan
-- must be rejected (status change), not deleted.
