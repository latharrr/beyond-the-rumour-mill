-- Public hiring opportunities sit next to LPU campus drives but are a separate
-- kind: they carry an official source, an apply link, a deadline when the
-- source states one, and the date the source was last read. Additive only.
alter table public.drives
  add column source_kind          text not null default 'campus'
    check (source_kind in ('campus', 'public_hiring')),
  add column source_url           text,
  add column apply_url            text,
  add column application_deadline date,
  add column deadline_note        text,
  add column eligibility_note     text,
  add column verified_on          date;

alter table public.drives
  add constraint drives_public_needs_source
  check (source_kind = 'campus' or (source_url is not null and verified_on is not null));

grant select (source_kind, source_url, apply_url, application_deadline,
              deadline_note, eligibility_note, verified_on)
  on public.drives to anon, authenticated;
