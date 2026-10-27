-- Team decision (Phase 1): accounts can be deleted on request.
--
-- Deleting auth.users cascades to profiles. Every FK that points at profiles
-- must therefore either cascade (personal data: prep_plans, already does) or
-- be cleared (contributions that stay useful to others, anonymised):
--   experiences.user_id   → set null (content stays, author becomes anonymous)
--   experiences.verified_by, drives.created_by → set null (otherwise deleting
--   an admin account would be blocked)
-- The Server Action deleteAccount removes the user's evidence objects and
-- clears evidence_path before deleting the auth user (service role).

alter table public.experiences alter column user_id drop not null;

alter table public.experiences
  drop constraint experiences_user_id_fkey,
  add constraint experiences_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.experiences
  drop constraint experiences_verified_by_fkey,
  add constraint experiences_verified_by_fkey
    foreign key (verified_by) references public.profiles(id) on delete set null;

alter table public.drives
  drop constraint drives_created_by_fkey,
  add constraint drives_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

-- Anonymised experiences have no profile: left join, so they stay public.
-- grad_year and author_role are null for them; the UI renders that as
-- "Former student" (lib/format.ts → authorLabel).
create or replace view public.public_experiences
  with (security_invoker = false, security_barrier = true) as
  select e.id, e.company_id, e.role_id, e.drive_id,
         e.rounds_summary, e.preparation_timeline,
         e.verified_at, e.created_at,
         p.grad_year, p.role as author_role,
         (e.evidence_path is not null) as has_evidence
  from public.experiences e
  left join public.profiles p on p.id = e.user_id
  where e.status = 'verified';

revoke all on public.public_experiences from public, anon, authenticated;
grant select on public.public_experiences to anon, authenticated;
