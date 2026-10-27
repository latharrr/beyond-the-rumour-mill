-- §1.6 RLS + grants.
--
-- Two layers on every table: table/column GRANTs decide which operations a
-- role may attempt at all; RLS policies decide which rows. Tables were
-- created with no anon/authenticated privileges (see the default-privilege
-- revoke at the top of 20261027000100_tables.sql), so the grants below are
-- the complete matrix.
--
-- Policies call (select auth.uid()) / (select public.is_admin()) so Postgres
-- evaluates them once per statement, not per row (Supabase advisor lint).
-- Policies that call is_admin() are scoped `to authenticated`; anon has no
-- execute on is_admin().

alter table public.companies            enable row level security;
alter table public.roles                enable row level security;
alter table public.topics               enable row level security;
alter table public.branches             enable row level security;
alter table public.resources            enable row level security;
alter table public.profiles             enable row level security;
alter table public.drives               enable row level security;
alter table public.drive_branches       enable row level security;
alter table public.rounds               enable row level security;
alter table public.round_topics         enable row level security;
alter table public.round_resources      enable row level security;
alter table public.experiences          enable row level security;
alter table public.experience_topics    enable row level security;
alter table public.experience_resources enable row level security;
alter table public.prep_plans           enable row level security;
alter table public.plan_items           enable row level security;
alter table public.plan_item_resources  enable row level security;
alter table public.plan_experiences     enable row level security;

-- ---------------------------------------------------------------------------
-- Reference tables + drives + rounds + their join tables:
-- select for all; write only when public.is_admin().
-- ---------------------------------------------------------------------------
grant select on public.companies, public.roles, public.topics, public.branches,
                public.resources, public.drive_branches, public.rounds,
                public.round_topics, public.round_resources
  to anon, authenticated;
grant insert, update, delete
  on public.companies, public.roles, public.topics, public.branches,
     public.resources, public.drives, public.drive_branches, public.rounds,
     public.round_topics, public.round_resources
  to authenticated;

-- drives.created_by is an admin's user id: every column except it is readable.
-- Clients must select drive columns explicitly (no `select *`).
grant select (id, company_id, role_id, title, eligibility_cgpa, max_backlogs,
              min_10th_pct, min_12th_pct, grad_years, drive_date, location,
              status, created_at, updated_at)
  on public.drives to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['companies','roles','topics','branches','resources',
                           'drives','drive_branches','rounds','round_topics',
                           'round_resources']
  loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to anon, authenticated using (true)', t);
    execute format(
      'create policy %1$s_admin_insert on public.%1$I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format(
      'create policy %1$s_admin_update on public.%1$I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format(
      'create policy %1$s_admin_delete on public.%1$I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles: select own row or admin; no client insert (trigger creates rows);
-- update own row only, and only the listed columns. role is never
-- client-writable. Admin promotion = migration or service-role SQL.
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (branch_id, cgpa, backlogs, pct_10th, pct_12th, grad_year)
  on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- experiences (+ experience_topics, experience_resources):
-- select own or admin; inserts only via submit_experience (security definer,
-- so no client insert grant exists); update only when admin; no deletes.
-- Public reads only via §1.3 views.
-- ---------------------------------------------------------------------------
grant select, update on public.experiences, public.experience_topics,
                        public.experience_resources
  to authenticated;

create policy experiences_select on public.experiences for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy experiences_admin_update on public.experiences for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy experience_topics_select on public.experience_topics for select to authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.experiences e
    where e.id = experience_id and e.user_id = (select auth.uid())));
create policy experience_topics_admin_update on public.experience_topics for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy experience_resources_select on public.experience_resources for select to authenticated
  using ((select public.is_admin()) or exists (
    select 1 from public.experiences e
    where e.id = experience_id and e.user_id = (select auth.uid())));
create policy experience_resources_admin_update on public.experience_resources for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- prep_plans, plan_items, plan_item_resources, plan_experiences:
-- all operations only when the plan belongs to auth.uid().
-- plan_items client update limited to done, done_at via column grant.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.prep_plans to authenticated;
grant select, insert, delete on public.plan_items, public.plan_item_resources,
                                public.plan_experiences
  to authenticated;
grant update (done, done_at) on public.plan_items to authenticated;

create policy prep_plans_owner on public.prep_plans for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy plan_items_owner on public.plan_items for all to authenticated
  using (exists (select 1 from public.prep_plans p
                 where p.id = plan_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.prep_plans p
                      where p.id = plan_id and p.user_id = (select auth.uid())));

create policy plan_item_resources_owner on public.plan_item_resources for all to authenticated
  using (exists (select 1 from public.plan_items i
                 join public.prep_plans p on p.id = i.plan_id
                 where i.id = plan_item_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.plan_items i
                      join public.prep_plans p on p.id = i.plan_id
                      where i.id = plan_item_id and p.user_id = (select auth.uid())));

-- Provenance may only cite verified experiences (checked via the public view;
-- the FK alone would accept pending/rejected ids).
create policy plan_experiences_owner on public.plan_experiences for all to authenticated
  using (exists (select 1 from public.prep_plans p
                 where p.id = plan_id and p.user_id = (select auth.uid())))
  with check (
    exists (select 1 from public.prep_plans p
            where p.id = plan_id and p.user_id = (select auth.uid()))
    and exists (select 1 from public.public_experiences pe where pe.id = experience_id));
