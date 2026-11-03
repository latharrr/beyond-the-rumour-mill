# Beyond the Rumour Mill

Placement preparation with published campus rules, evidence-reviewed student experiences, saved prep plans and a public-source company research catalog.

Where each P08 module and each INT252 / INT257 syllabus topic lives in the code: [SYLLABUS.md](SYLLABUS.md).

## Run locally

Node 22+, npm, Docker (only for local Supabase tests).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`. The server needs `SUPABASE_SECRET_KEY` to clean up an evidence upload when a submission fails. Never expose a secret/service-role key to the browser or commit credentials.

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

Email confirmation stays on. Token-hash email links enter `/auth/confirm`; recovery continues to `/reset-password`. Provider failures and rate limits are shown without exposing account existence. Never reuse an already-consumed recovery link. Sign-in is email and password only.

## Data and trust

- `/drives`: admin-published campus drives (`source_kind = 'campus'`). Older `public_hiring` rows may still exist in the database; the app no longer shows them.
- `/companies`: 12 company research pages. `data/company-research.json` records official requirements, source links, historical candidate reports and check date. Unknown requirements are unknown, not automatic eligibility. Closed cycles remain closed. Update facts, links and check date together.
- `/experiences`: only reviewed student experiences affect verified topic counts and rumour verdicts. Public candidate reports are labelled separately and never become fake student accounts or verification events.
- `/dashboard`: profile and saved prep plans. Plan changes show pending/saved/error states; failed changes roll back and can be retried. Markdown exports use persisted plan state.
- `/admin`: server-gated verification queue, live counts and campus drive management. No auth secrets or private storage paths are exposed. No account deletion or role escalation UI.

Migrations are in `supabase/migrations`. Base taxonomy is migration-backed.

## Performance boundaries

Native scrolling, static landing sections and immediate hero visibility. Primary navigation prefetches and shows real pending state. Supabase clients/session/profile reads are deduplicated within a request. Public taxonomy has 5-minute revalidation. Anonymous public evidence/tip snapshots have 30-second revalidation and are invalidated after submissions, reviews and profile edits. User/account data is not shared-cached.

## Limits

Public openings change and require rechecking on their original pages. Historical interview reports are individual accounts, not guaranteed questions or frequency data. This student project is not affiliated with the LPU placement cell. Do not infer campus eligibility from a general external job posting.
