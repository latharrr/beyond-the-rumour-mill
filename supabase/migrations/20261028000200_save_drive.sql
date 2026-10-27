-- Team decision: createDrive / updateDrive write drives, drive_branches,
-- rounds, round_topics and round_resources in ONE transaction (spec §2.2 lists
-- the tables but no RPC; PostgREST calls would not be atomic).
--
-- security invoker: every write still goes through the caller's RLS
-- (admin-only write policies). The explicit is_admin() check only turns an
-- RLS violation into a clear error before anything runs.
--
-- p_drive_id null = create, otherwise update. Branches and rounds are
-- replaced wholesale (rounds cascade to round_topics / round_resources).
-- p_rounds: [{name, position, description, topic_ids[], resource_ids[]}] —
-- transport only, never stored as jsonb.

create or replace function public.save_drive(
  p_drive_id         uuid,
  p_company_id       uuid,
  p_role_id          uuid,
  p_title            text,
  p_eligibility_cgpa numeric,
  p_max_backlogs     int,
  p_min_10th_pct     numeric,
  p_min_12th_pct     numeric,
  p_grad_years       int[],
  p_drive_date       date,
  p_location         text,
  p_status           text,
  p_branch_ids       uuid[],
  p_rounds           jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can save drives' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_rounds, '[]'::jsonb)) <> 'array' then
    raise exception 'rounds must be a JSON array' using errcode = '22023';
  end if;

  if p_drive_id is null then
    insert into public.drives
      (company_id, role_id, title, eligibility_cgpa, max_backlogs, min_10th_pct,
       min_12th_pct, grad_years, drive_date, location, status, created_by)
    values
      (p_company_id, p_role_id, p_title, p_eligibility_cgpa, coalesce(p_max_backlogs, 0),
       p_min_10th_pct, p_min_12th_pct, coalesce(p_grad_years, '{}'), p_drive_date,
       p_location, coalesce(p_status, 'upcoming'), auth.uid())
    returning id into v_id;
  else
    update public.drives set
      company_id = p_company_id, role_id = p_role_id, title = p_title,
      eligibility_cgpa = p_eligibility_cgpa, max_backlogs = coalesce(p_max_backlogs, 0),
      min_10th_pct = p_min_10th_pct, min_12th_pct = p_min_12th_pct,
      grad_years = coalesce(p_grad_years, '{}'), drive_date = p_drive_date,
      location = p_location, status = coalesce(p_status, 'upcoming')
    where id = p_drive_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Drive not found' using errcode = 'P0002';
    end if;

    delete from public.drive_branches where drive_id = v_id;
    delete from public.rounds where drive_id = v_id;
  end if;

  insert into public.drive_branches (drive_id, branch_id)
  select distinct v_id, b from unnest(coalesce(p_branch_ids, '{}')) as b;

  insert into public.rounds (drive_id, name, position, description)
  select v_id, r.name, r.position, r.description
  from jsonb_to_recordset(coalesce(p_rounds, '[]'::jsonb))
       as r(name text, position int, description text);

  insert into public.round_topics (round_id, topic_id)
  select distinct ro.id, t.topic_id
  from jsonb_to_recordset(coalesce(p_rounds, '[]'::jsonb)) as r(position int, topic_ids uuid[])
  join public.rounds ro on ro.drive_id = v_id and ro.position = r.position
  cross join lateral unnest(coalesce(r.topic_ids, '{}')) as t(topic_id);

  insert into public.round_resources (round_id, resource_id)
  select distinct ro.id, x.resource_id
  from jsonb_to_recordset(coalesce(p_rounds, '[]'::jsonb)) as r(position int, resource_ids uuid[])
  join public.rounds ro on ro.drive_id = v_id and ro.position = r.position
  cross join lateral unnest(coalesce(r.resource_ids, '{}')) as x(resource_id);

  return v_id;
end;
$$;

revoke all on function public.save_drive(uuid, uuid, uuid, text, numeric, int, numeric, numeric, int[], date, text, text, uuid[], jsonb)
  from public, anon;
grant execute on function public.save_drive(uuid, uuid, uuid, text, numeric, int, numeric, numeric, int[], date, text, text, uuid[], jsonb)
  to authenticated;
