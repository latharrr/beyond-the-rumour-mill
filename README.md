# Beyond the Rumour Mill

**P08 · CA2 (INT252 / INT257) · Group 8** — Deepanshu Lathar, Harsh, Sundram Singh

A placement-prep platform where official drive information and verified senior
experiences feed a personal preparation-plan generator, with the rumour mill
visibly quarantined behind a verification layer.

The frozen build spec is [`docs/placement-prep-plan-v5.md`](docs/placement-prep-plan-v5.md).
Where the implementation deliberately differs from it, see
[Spec deviations](#spec-deviations-team-decisions).

> **Status:** Phase 0 (infrastructure). Pages are functional stubs; the UI
> design pass comes later.

---

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind v4 ·
Supabase (Postgres + Auth + Storage) · Zod · Vitest · Playwright · GitHub Actions

## Setup

Prerequisites: Node 24, Docker Desktop (running).

```bash
npm install
npx supabase start            # first run pulls images (a few minutes)
cp .env.example .env.local    # fill from `npx supabase status`
npm run dev                   # http://localhost:3000
```

`.env.local` values come from `npx supabase status`:

| Variable | From `supabase status` | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `API_URL` | public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` | public |
| `SUPABASE_SECRET_KEY` | `SECRET_KEY` | **server only**, never in client code |

### Seed accounts (local only)

`supabase db reset` loads `supabase/seed.sql`. All passwords are `password123`.

| Email | Role |
|---|---|
| `admin@seed.test` | admin |
| `alumni1@seed.test`, `alumni2@seed.test` | alumni |
| `student@seed.test` | student |

The seed is never pushed to production.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` | Next.js dev server / production build |
| `npm run lint` / `typecheck` | ESLint / `next typegen && tsc --noEmit` |
| `npm test` | Unit tests (Vitest, `tests/unit`) |
| `npm run test:rls` | RLS + grant tests against local Supabase (`tests/rls`) |
| `npm run test:e2e` | Playwright (`e2e/`; starts the dev server) |
| `npm run db:reset` | Rebuild the local DB from migrations + seed |
| `npm run db:types` | Regenerate `lib/supabase/database.types.ts` (CI fails on drift) |

---

## Architecture

```
proxy.ts                    session refresh on every route; redirect to /login on §2.1 paths
app/
  (public)/ (student)/ (admin)/   route groups, each with layout + loading/error/not-found
  (admin)/layout.tsx        server-side is_admin() gate → redirect non-admins
  _actions/                 Server Actions (all mutations, Zod-validated)
  api/plans/[id]/export/    the only Route Handler
  login/                    email + password sign-in / sign-up
lib/
  auth.ts                   DAL: getSessionUser, requireUser, isAdmin, requireAdmin
  supabase/                 server + browser clients, proxy helper, generated DB types
  schemas.ts                Zod schemas shared by client and server
supabase/
  migrations/               run top-to-bottom on a fresh project
  seed.sql                  local/dev data
tests/rls/                  §5 RLS checklist as automated tests
```

> Next.js 16 renamed `middleware.ts` to `proxy.ts`. It does the same job
> (session check only, no role checks).

### Migrations (dependency order)

1. `…100_tables.sql`: tables + checks. Revokes Supabase's default grants first.
2. `…200_helpers_triggers_indexes.sql`: `is_admin()`, `handle_new_user`, `set_updated_at`, indexes.
3. `…300_public_views.sql`: security-definer public views + select-only grants.
4. `…400_rls_and_grants.sql`: explicit grant matrix + RLS policies on every table.
5. `…500_storage_evidence.sql`: private `evidence` bucket + policies.
6. `…600_rpcs.sql`: `submit_experience`, `save_plan`.
7. `…028000100_account_deletion.sql`: anonymise experiences on account deletion.
8. `…028000200_save_drive.sql`: atomic drive + rounds write for admins.
9. `…028000300_submit_experience_drive_match.sql`: `submit_experience` rejects a drive whose company/role differ.
10. `…028000400_evidence_4mb.sql`: evidence bucket limit lowered to 4 MB.

### Security model

**Two layers on every table.**
- **Grants** decide which operations a role may attempt at all.
- **RLS** decides which rows those operations can reach.

Supabase normally grants `ALL` on new tables to `anon` and `authenticated`. Migration 1 revokes those defaults, so a table nobody has granted is unreachable even if its RLS is wrong.

**Rules for new migrations:**
- Every new table needs explicit `grant`s, `enable row level security`, and policies.
- Every new function needs `revoke all … from public, anon`. Postgres' built-in EXECUTE-to-PUBLIC cannot be removed per schema.

| Data | anon | student / alumni | admin |
|---|---|---|---|
| companies, roles, topics, branches, resources, drives, rounds, joins | read | read | read + write |
| `drives.created_by` | — | — | — (column not granted; select drive columns explicitly, never `*`) |
| profiles | — | own row; update only branch, cgpa, backlogs, %s, grad year | read all |
| experiences (+ topics/resources) | — | own rows (read only) | read + update |
| public views (`public_experiences`, …, `community_tips`) | read | read | read |
| prep_plans and children | — | own only; `plan_items` update = `done`, `done_at` | own only |
| evidence objects | — | upload to `{uid}/` only | read / update / delete / sign |

**Key behaviours:**
- **Roles are never client-writable.** No grant exists on `profiles.role`; see [Admin promotion](#admin-promotion-procedure).
- **Experience inserts happen only through `submit_experience`.** Clients have no INSERT grant on `experiences` or its join tables. The RPC:
  - takes `user_id` from `auth.uid()`;
  - forces `status = 'pending'`;
  - caps each user at 5 pending experiences;
  - checks the evidence path format `{uid}/{uuid}.{jpg|jpeg|png|pdf}`.
- **`save_plan` replaces a plan atomically.** It runs as the caller, so RLS applies. Regenerating deletes and re-inserts in one transaction, so a failure leaves the previous plan intact. Plans may cite only verified experiences.
- **Admin checks happen server-side on every request.** `(admin)/layout.tsx` calls `is_admin()`. Layouts do not protect Server Actions, so every admin action must also call `requireAdmin()` / `isAdmin()` itself.

### Why definer views

The base `experiences` and `profiles` tables hold personal data (`user_id`, `evidence_path`, grades), so RLS limits them to the owner and admins. Visitors still need to read verified experiences and community tips.

A normal (security-invoker) view would run under the visitor's RLS:
- it would return nothing;
- or, to make it return rows, we would need a base-table policy that exposes `user_id` and `evidence_path`.

Instead, four views run as their owner and select only safe columns:
- `public_experiences`: verified only. Shows `grad_year` and `author_role` ("Placed senior · Batch of 2025") and a `has_evidence` boolean. The evidence path itself is never exposed.
- `public_experience_topics`, `public_experience_resources`: verified only.
- `community_tips`: pending only, with no author info at all.

Hardening on these views:
- `security_barrier = true`, so caller filters can't be evaluated against hidden rows.
- Select-only grants. `community_tips` is a single-table view, which Postgres makes auto-updatable. Without the explicit revoke, anon could UPDATE or DELETE pending experiences through it.

**The Supabase security advisor flags exactly these four views (`security_definer_view`).** This is intentional. It also WARNs that `is_admin()` and `submit_experience()` are security-definer functions executable by `authenticated`. Both are intentional: `is_admin()` must read `profiles.role` past RLS, and `submit_experience` is the only insert path (see deviations). Any *other* security finding is a bug.

Check with:

```bash
npx supabase db advisors --local --type security
```

### Evidence: PII and retention

- **Bucket:** `evidence` is private, limited to 4 MB, and accepts only JPEG, PNG and PDF. The Server Action also checks the file's magic bytes, so a renamed executable is refused before upload.
- **Paths:** objects are stored at `{user_id}/{uuid}.{ext}`. The server generates the uuid; client filenames are never used.
- **Student access:** students can upload but cannot read, list, overwrite or delete anything, including their own uploads.
- **Admin access:** admins view evidence through 60-second signed URLs. These are issued by a Server Action after a fresh `is_admin()` check.
- **Retention:** evidence is kept for verification only and deleted on request.

**Account deletion** (`deleteAccount`, on the profile page, confirmed by typing DELETE):

1. All of the user's evidence objects are deleted and `evidence_path` is cleared (service role, scoped to the caller's own id).
2. The auth user is deleted. The profile and prep plans cascade away.
3. Experiences they shared **stay**, anonymised: `user_id` becomes null and the author shows as "Former student". This keeps the verified dataset intact for juniors without keeping anything that identifies the author.

If an admin deletes their account, `verified_by` / `drives.created_by` are set to null.

### Email confirmation

Sign-up confirmation links go to `GET /auth/confirm` (token-hash flow). The local template is `supabase/templates/confirmation.html`, wired in `config.toml`.

**Production:** paste the same template into the Supabase dashboard (Auth → Email Templates → Confirm signup) and set Site URL to the Vercel production URL.

---

## Admin promotion procedure

Roles cannot be changed from the app: there is no column grant on `profiles.role`, and the RLS tests prove it. Promotion is a deliberate, audited SQL step run with elevated rights.

**Local**, in Studio (http://127.0.0.1:54323) or `psql`:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'person@lpu.in');
```

**Production:**
- **Preferred:** run the same statement in the Supabase dashboard SQL editor (runs as `postgres`). Record who ran it and why in the team log.
- **Reproducible alternative:** add a migration (`npx supabase migration new promote_admin_<initials>`) that updates by **user id**, never by email, so no personal data lands in git. Review it in a PR.

To demote, set `role = 'student'` (or `'alumni'`) the same way. The change takes effect on the user's next request, because `is_admin()` reads the table every time and nothing is cached in the JWT.

---

## How to add a topic

The taxonomy (topics, roles, branches) has no admin UI by design. It changes only through migrations, so every environment stays identical.

1. Create a migration:

   ```bash
   npx supabase migration new add_topic_bit_manipulation
   ```

2. Insert the row (idempotent):

   ```sql
   insert into public.topics (label, category, aliases)
   values ('Bit Manipulation', 'DSA', '{"bitwise","bits"}')
   on conflict (label) do nothing;
   ```

   Use an existing `category` (`DSA`, `CS Fundamentals`, `Programming`, `Aptitude`, `HR`, `Communication`) unless the team agrees a new one. Aliases feed the topic-picker search only; they never take part in matching.

3. Verify locally, then open a PR:

   ```bash
   npx supabase db reset && npm run test:rls
   ```

4. After merge, apply to production with `npx supabase db push`.

Do **not** also add the topic to `seed.sql`. The seed runs after migrations and would hit the unique `label` constraint. Roles and branches follow the same procedure.

---

## Testing

- **Unit** (`npm test`): pure logic such as schemas and the proxy path matcher. Plan engine, eligibility and TrustScore tests land with those modules.
- **RLS** (`npm run test:rls`): the §5 checklist against a real local Supabase, through PostgREST and Storage exactly as the app calls them. It covers:
  - self-promotion;
  - anon and student read paths never containing `user_id` or `evidence_path`;
  - writes through the definer views;
  - RPC-only inserts, the pending cap and the evidence-path rules;
  - cross-user plan and experience isolation;
  - the `save_plan` forced-error rollback;
  - evidence bucket rules.

  The admin Server Action checks are `todo` until those actions exist.
- **E2E** (`npm run test:e2e`): auth flows today: protected-route redirects, login validation, the admin gate, nav session state and sign-out. The §5 golden path (login → drive → plan → toggle → export) arrives in Phase 2.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests and a build. It also runs `supabase db reset` from scratch, the RLS suite, and a generated-types drift check on every PR.

---

## Spec deviations (team decisions)

| Spec | Implementation | Why |
|---|---|---|
| §1.5 `submit_experience` security invoker | **Security definer**, no client INSERT grant | Under invoker, clients would need an INSERT policy and could bypass the RPC, contradicting §1.6 "inserts only via `submit_experience`" |
| §2.1 `middleware.ts` | `proxy.ts` | Next.js 16 rename |
| §2.1 matcher on protected paths only | Proxy runs on all app routes; the redirect applies only to §2.1 paths | `@supabase/ssr` refreshes auth cookies in the proxy. Without it, sessions silently expire on public pages |
| §1.3 view columns | `public_experiences.has_evidence` added | TrustScore (§2.6) needs it; the path stays private |
| §1.3 `revoke … from public` | Also revokes from `anon` and `authenticated`; views get `security_barrier` | Supabase grants to those roles directly. `community_tips` is auto-updatable |
| §1.6 "select for all" on drives | `drives.created_by` not granted to clients | It is a user id (§ "never expose user_id") |
| Grants (unspecified) | Explicit grant matrix; default grants revoked | Defense in depth alongside RLS |
| §1.5 evidence check "starts with uid/" | Full format check `{uid}/{uuid}.{ext}`; `null` allowed | Matches the §1.6 path format, blocks `..`. Evidence is optional (TrustScore completeness) |
| §1.5 `save_plan` | Rejects unverified `experience_ids` (RPC + RLS) | The FK alone accepts pending or rejected ids |
| §1 "email login" | Email + password | Works offline locally and with e2e, and needs no SMTP for the demo |
| §1.2 `experiences.user_id not null`, no `ON DELETE` | Nullable, `on delete set null`. `verified_by`, `drives.created_by` also set null. `public_experiences` uses a left join | Account deletion on request. Anonymised experiences stay public as "Former student" |
| — | `deleteAccount` clears `evidence_path` after deleting the objects | The objects no longer exist, so `has_evidence` must not claim they do |
| §1.5 `submit_experience` (drive check unspecified) | Raises `22023` if `drive_id` is set and the drive's company/role differ | Team decision: an experience can't be filed against another company's drive |
| §1.6, §2.2 evidence limit 5 MB | 4 MB bucket limit; Server Action body limit 4.4 MB | Team decision: Vercel functions cap request bodies at 4.5 MB, so a 5 MB upload through a Server Action could never arrive |
| §1.6 MIME allowlist | Also sniffs magic bytes (JPEG/PNG/PDF) server-side | Security: the browser-declared MIME type is client-controlled |
| §1.5 lists two RPCs | Third RPC `save_drive` (security invoker, admin RLS + explicit `is_admin()` check) | `createDrive` / `updateDrive` write 5 tables (§2.2); PostgREST calls are not atomic. A half-built drive must be impossible |

## Contribution declarations

_To be completed per §3.5 ownership at submission._
