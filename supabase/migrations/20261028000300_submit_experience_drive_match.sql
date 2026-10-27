-- Team decision: an experience tied to a drive must name that drive's own
-- company and role, so plan-engine and rumour-check aggregates (which group
-- by company_id / role_id) can never be skewed by a mismatched drive_id.
-- Same function as 20261027000600 plus the drive check; still SECURITY
-- DEFINER (README deviations) with the caller taken from auth.uid().

create or replace function public.submit_experience(
  p_company_id     uuid,
  p_role_id        uuid,
  p_drive_id       uuid,
  p_rounds_summary text,
  p_timeline       text,
  p_evidence_path  text,
  p_topic_ids      uuid[],
  p_resource_ids   uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_drive_id is not null and not exists (
    select 1 from public.drives d
    where d.id = p_drive_id and d.company_id = p_company_id and d.role_id = p_role_id
  ) then
    raise exception 'The selected drive does not match the company and role'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('submit_experience:' || v_uid::text, 0));

  if (select count(*) from public.experiences
      where user_id = v_uid and status = 'pending') >= 5 then
    raise exception 'You already have 5 experiences awaiting verification'
      using errcode = 'P0001';
  end if;

  if p_evidence_path is not null and p_evidence_path !~ (
       '^' || v_uid::text
       || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|pdf)$'
     ) then
    raise exception 'Invalid evidence path' using errcode = '22023';
  end if;

  insert into public.experiences
    (user_id, company_id, role_id, drive_id, rounds_summary,
     preparation_timeline, evidence_path, status)
  values
    (v_uid, p_company_id, p_role_id, p_drive_id, p_rounds_summary,
     p_timeline, p_evidence_path, 'pending')
  returning id into v_id;

  insert into public.experience_topics (experience_id, topic_id)
  select distinct v_id, t from unnest(coalesce(p_topic_ids, '{}')) as t;

  insert into public.experience_resources (experience_id, resource_id)
  select distinct v_id, r from unnest(coalesce(p_resource_ids, '{}')) as r;

  return v_id;
end;
$$;

revoke all on function public.submit_experience(uuid, uuid, uuid, text, text, text, uuid[], uuid[])
  from public, anon;
grant execute on function public.submit_experience(uuid, uuid, uuid, text, text, text, uuid[], uuid[])
  to authenticated;
