-- §1.5 RPCs (atomic multi-table writes).
--
-- submit_experience is SECURITY DEFINER (team decision, deviates from §1.5's
-- "security invoker"): clients have no INSERT grant on experiences or its
-- join tables, so this function is structurally the only insert path, and
-- the pending cap / evidence-path rules cannot be bypassed via PostgREST.
-- It derives the caller from auth.uid() and never trusts a passed user id.
--
-- save_plan stays SECURITY INVOKER: every write goes through the caller's
-- RLS policies on prep_plans / plan_items / plan_item_resources /
-- plan_experiences.

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

  -- Serialise this user's submissions so two concurrent calls cannot both
  -- pass the pending cap.
  perform pg_advisory_xact_lock(hashtextextended('submit_experience:' || v_uid::text, 0));

  if (select count(*) from public.experiences
      where user_id = v_uid and status = 'pending') >= 5 then
    raise exception 'You already have 5 experiences awaiting verification'
      using errcode = 'P0001';
  end if;

  -- Evidence is optional. When present it must be {own uid}/{uuid}.{ext}.
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


-- items: [{topic_id, position, week, label, resource_ids[]}] — transport only,
-- never stored as jsonb. Regenerate = replace: the old plan is deleted
-- (cascades) and the new one inserted in the same transaction, so any
-- failure leaves the previous plan untouched.
create or replace function public.save_plan(
  p_drive_id       uuid,
  p_items          jsonb,
  p_experience_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_plan uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'items must be a JSON array' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_experience_ids, '{}')) as x(id)
    where not exists (select 1 from public.public_experiences pe where pe.id = x.id)
  ) then
    raise exception 'Plans may only cite verified experiences' using errcode = '22023';
  end if;

  delete from public.prep_plans where user_id = v_uid and drive_id = p_drive_id;

  insert into public.prep_plans (user_id, drive_id)
  values (v_uid, p_drive_id)
  returning id into v_plan;

  insert into public.plan_items (plan_id, topic_id, position, week, label)
  select v_plan, i.topic_id, i.position, i.week, i.label
  from jsonb_to_recordset(p_items)
       as i(topic_id uuid, position int, week int, label text);

  insert into public.plan_item_resources (plan_item_id, resource_id)
  select distinct pi.id, r.resource_id
  from jsonb_to_recordset(p_items) as i(position int, resource_ids uuid[])
  join public.plan_items pi on pi.plan_id = v_plan and pi.position = i.position
  cross join lateral unnest(coalesce(i.resource_ids, '{}')) as r(resource_id);

  insert into public.plan_experiences (plan_id, experience_id)
  select distinct v_plan, x from unnest(coalesce(p_experience_ids, '{}')) as x;

  return v_plan;
end;
$$;

revoke all on function public.save_plan(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_plan(uuid, jsonb, uuid[]) to authenticated;
