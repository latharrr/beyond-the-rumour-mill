-- Hosted Supabase projects may ship public.rls_auto_enable(), an event-trigger
-- function owned by postgres and executable by anon/authenticated by default.
-- It returns event_trigger, so it can't be called over PostgREST, but the
-- security advisor still flags it. Revoke so the advisor only lists the four
-- documented definer views. No-op locally, where the function doesn't exist.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
