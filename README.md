# Beyond the Rumour Mill

Placement preparation with published campus rules, evidence-reviewed student experiences, saved prep plans and a separate public-source company research catalog.

## Run locally

Node 22+, npm, Docker (only for local Supabase tests).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`. Server-only maintenance scripts may require `SUPABASE_SECRET_KEY`. Never expose a secret/service-role key to the browser or commit credentials.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run db:start
npm run db:reset
npm run test:rls
npm run test:e2e
npm run db:stop
```

DB/E2E tests need an isolated local Supabase project and its keys in `.env.local`. Do not point destructive fixtures at production. CI resets its own database and runs RLS and production-build browser tests.

## Hosting and authentication

The canonical address is https://clg.143.lat, configured with `NEXT_PUBLIC_SITE_URL`. The VPS runs the full Next.js app behind nginx; a Vercel deployment is another full app, not a frontend proxying to the VPS. Both can use the same Supabase project. Supabase provides Auth, Postgres and private evidence storage. Resend SMTP delivers auth emails.

Email confirmation stays on. Token-hash email links enter `/auth/confirm`; recovery continues to `/reset-password`. Provider failures and rate limits are shown without exposing account existence. Never reuse an already-consumed recovery link. Google sign-in requires a separately configured provider/client and a tested callback; it is not enabled merely by deploying a button.

## Data and trust

- `/drives`: admin-published campus drives plus a separate source-linked public opportunity catalog. Listings with `source_kind = 'public_hiring'` (internships and early-career roles read from employer pages, see `data/public-opportunities.json`) are labelled "Public hiring, not an LPU drive", show the official source, apply link, check date and any deadline note, and are never run through the campus eligibility checker. `scripts/seed-public-opportunities.mjs` upserts them (needs `SUPABASE_URL` and `SUPABASE_SECRET_KEY`); re-read each source and bump `checked` before re-running. Campus drives stay `campus` and only come from an admin.
- `/companies`: 12 company research pages. `data/company-research.json` records official requirements, source links, historical candidate reports and check date. Unknown requirements are unknown, not automatic eligibility. Closed cycles remain closed. Update facts, links and check date together.
- `/experiences`: only reviewed student experiences affect verified topic counts and rumour verdicts. Public candidate reports are labelled separately and never become fake student accounts or verification events.
- `/dashboard`: profile and saved prep plans. Plan changes show pending/saved/error states; failed changes roll back and can be retried. Markdown exports use persisted plan state.
- `/admin`: server-gated verification queue, campus drive management, minimal read-only profile directory, submission states and source coverage. No auth secrets or private storage paths are exposed. No bulk account deletion or role escalation UI.

Migrations are in `supabase/migrations`. Base taxonomy is migration-backed. `scripts/import-experiences.ts` imports genuine account-linked CSV experiences as **pending**, never automatically verified.

## Performance boundaries

Native scrolling, static landing sections and immediate hero visibility. Primary navigation prefetches and shows real pending state. Supabase clients/session/profile reads are deduplicated within a request. Public taxonomy has 5-minute revalidation. Anonymous public evidence/tip snapshots have 30-second revalidation and are invalidated after submissions, reviews, profile edits and account deletion. User/account data is not shared-cached.

## Limits

Public openings change and require rechecking on their original pages. Historical interview reports are individual accounts, not guaranteed questions or frequency data. This student project is not affiliated with the LPU placement cell. Do not infer campus eligibility from a general external job posting.
