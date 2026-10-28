-- What the employer's own page actually establishes about applying.
-- open_stated: the page says applications are open (optionally until a date).
-- posting_live: a live posting with an apply route, but no stated window.
-- unconfirmed: a program or info page that does not show current application status.
alter table public.drives
  add column application_status text not null default 'unconfirmed'
    check (application_status in ('open_stated', 'posting_live', 'unconfirmed'));

grant select (application_status) on public.drives to anon, authenticated;
