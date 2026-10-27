-- §1.3 Public views (security definer — safe columns only).
--
-- These run as the view owner, so visitors can read verified/pending content
-- without any base-table policy that would expose user_id or evidence_path.
-- The Supabase advisor flags them as security-definer views: intentional,
-- documented in README ("Why definer views").
--
-- security_barrier: stops caller-supplied predicates from being evaluated
-- against rows the view's WHERE would have filtered out.

create view public.public_experiences
  with (security_invoker = false, security_barrier = true) as
  select e.id, e.company_id, e.role_id, e.drive_id,
         e.rounds_summary, e.preparation_timeline,
         e.verified_at, e.created_at,
         p.grad_year, p.role as author_role,
         (e.evidence_path is not null) as has_evidence   -- TrustScore input; path never exposed
  from public.experiences e
  join public.profiles p on p.id = e.user_id
  where e.status = 'verified';

create view public.public_experience_topics
  with (security_invoker = false, security_barrier = true) as
  select et.experience_id, et.topic_id
  from public.experience_topics et
  join public.experiences e on e.id = et.experience_id
  where e.status = 'verified';

create view public.public_experience_resources
  with (security_invoker = false, security_barrier = true) as
  select er.experience_id, er.resource_id
  from public.experience_resources er
  join public.experiences e on e.id = er.experience_id
  where e.status = 'verified';

create view public.community_tips                    -- no author info at all
  with (security_invoker = false, security_barrier = true) as
  select e.id, e.company_id, e.role_id, e.rounds_summary, e.created_at
  from public.experiences e
  where e.status = 'pending';

-- Supabase grants ALL on new relations to anon/authenticated directly (not via
-- PUBLIC), so they must be revoked by name. community_tips is a single-table
-- view and therefore auto-updatable: without this revoke, anon could
-- UPDATE/DELETE pending experiences through it with the owner's rights.
revoke all on public.public_experiences, public.public_experience_topics,
              public.public_experience_resources, public.community_tips
  from public, anon, authenticated;
grant select on public.public_experiences, public.public_experience_topics,
                public.public_experience_resources, public.community_tips
  to anon, authenticated;
