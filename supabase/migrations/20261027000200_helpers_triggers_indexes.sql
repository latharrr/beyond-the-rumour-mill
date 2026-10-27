-- §1.4 Helpers, triggers, indexes.

-- Role check for RLS + server components. No JWT claims machinery.
-- security definer: reads profiles without tripping profiles RLS (no recursion).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Auto-create profile on signup; role always 'student' (column default).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id); return new; end; $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance. search_path pinned so the Supabase advisor
-- does not flag a mutable search_path.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function public.set_updated_at() from public;

create trigger trg_drives_updated      before update on public.drives      for each row execute function public.set_updated_at();
create trigger trg_experiences_updated before update on public.experiences for each row execute function public.set_updated_at();
create trigger trg_plans_updated       before update on public.prep_plans  for each row execute function public.set_updated_at();

create index on public.experiences (company_id, status);
create index on public.experiences (role_id, status);
create index on public.experiences (user_id, status);
create index on public.experience_topics (topic_id);
create index on public.drives (status, drive_date);
create index on public.plan_items (plan_id);
