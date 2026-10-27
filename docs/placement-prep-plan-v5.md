# P08 — Beyond the Rumour Mill: Final Build Plan (v5)

**Course:** CA2 (INT252 / INT257) · **Group 8** — Deepanshu Lathar, Harsh, Sundram Singh
**Status:** FINAL — frozen. Any change needs a team decision.
**Stack:** Next.js (App Router) · Supabase (Postgres + Auth + Storage) · Vercel · Zod · Vitest · Playwright · GitHub Actions

**What we're building:** a placement-prep platform where official drive information and verified senior experiences feed a personal preparation-plan generator — with the rumour mill visibly quarantined behind a verification layer.

**Architecture at a glance:**

```
Browser
  └─ Next.js App Router (Vercel)
       ├─ Server Components — data pages, direct Supabase reads
       ├─ Server Actions — all mutations, Zod-validated
       ├─ Route Handler — GET /api/plans/[id]/export
       └─ middleware.ts — session check only (auth, not roles)
  └─ Supabase
       ├─ Postgres — normalized schema, RLS everywhere, is_admin() for privileged policies
       ├─ RPCs — submit_experience, save_plan (atomic multi-table writes)
       ├─ Auth — email login; profile row auto-created by trigger; admin layout checks role server-side
       └─ Storage — private `evidence` bucket, per-user paths, signed URLs for admins only
```

*v5 changelog (security + correctness pass):*
- *Role column locked: column-level grants + insert check; users cannot self-promote. Admin promotion = SQL migration/service role only.*
- *Profiles auto-created by `handle_new_user` trigger (role forced to `student`).*
- *Public reads moved to security-definer views (`public_experiences`, `public_experience_topics`, `community_tips`); base `experiences` table is owner/admin-only. Fixes the security_invoker + profiles-RLS join that would have returned nothing to visitors.*
- *Evidence bucket: per-user path enforced in policy, 5 MB limit, MIME allowlist, no update/delete for non-admins, 60 s signed URLs.*
- *`generatePlan` writes through one transactional RPC (`save_plan`); regenerate = replace, never partial.*
- *CGPA `numeric(4,2)` with 0–10 check; percentage/backlog range checks.*
- *Branches normalized (`branches` + `drive_branches`, `profiles.branch_id`). `grad_years int[]` kept under an explicit rule exception (non-FK scalar filter).*
- *`plan_items.week` added — weekly buckets are now stored, not recomputed.*
- *TrustScore scaled ×100 explicitly.*
- *Abuse cap: max 5 pending experiences per user (enforced in RPC).*

---

## 1. DATABASE ARCHITECTURE

### 1.1 Design rules
- No free-text fields participate in matching or aggregation. Topics, roles and branches are normalized tables; everything matchable is a foreign key.
- No arrays with implied FKs — including inside stored jsonb. All many-to-many relations are join tables.
- **Exception:** arrays of non-FK scalars used only as filters or search hints are allowed (`drives.grad_years`, `*.aliases`).
- jsonb may be used as an RPC **transport** format only; it is never stored.
- `progress` is derived from `plan_items`, never stored.
- Base tables holding PII (`profiles`, `experiences`) are never read publicly; public reads go through definer views that select safe columns only.
- Migration files run top to bottom on a fresh project. Table creation order respects FK dependencies.

### 1.2 Tables (in migration order)

```sql
companies (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  logo_url    text,
  sector      text,
  created_at  timestamptz default now()
);

roles (
  id          uuid primary key default gen_random_uuid(),
  label       text unique not null,            -- "Software Engineer"
  aliases     text[] not null default '{}',    -- {"SDE","SDE-1"} for picker search
  created_at  timestamptz default now()
);

topics (
  id          uuid primary key default gen_random_uuid(),
  label       text unique not null,            -- "Dynamic Programming"
  category    text not null,                   -- "DSA" | "CS Fundamentals" | "Aptitude" ...
  aliases     text[] not null default '{}',
  created_at  timestamptz default now()
);

branches (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,            -- "CSE"
  label       text not null                    -- "Computer Science & Engineering"
);
-- Taxonomy (roles, topics, branches) is managed via seed.sql + migrations only (no admin UI).
-- Adding a topic = new migration inserting into topics. Documented in README.

resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  url         text not null,
  type        text not null check (type in ('video','article','course','book')),
  topic_id    uuid references topics(id),
  company_id  uuid references companies(id),
  created_at  timestamptz default now()
);

profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'student' check (role in ('student','alumni','admin')),
  branch_id   uuid references branches(id),
  cgpa        numeric(4,2) check (cgpa between 0 and 10),
  backlogs    int not null default 0 check (backlogs >= 0),
  pct_10th    numeric(5,2) check (pct_10th between 0 and 100),
  pct_12th    numeric(5,2) check (pct_12th between 0 and 100),
  grad_year   int check (grad_year between 2000 and 2100),
  created_at  timestamptz default now()
);

drives (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  role_id           uuid not null references roles(id),
  title             text not null,
  eligibility_cgpa  numeric(4,2) check (eligibility_cgpa between 0 and 10),
  max_backlogs      int not null default 0 check (max_backlogs >= 0),
  min_10th_pct      numeric(5,2) check (min_10th_pct between 0 and 100),
  min_12th_pct      numeric(5,2) check (min_12th_pct between 0 and 100),
  grad_years        int[] not null default '{}',   -- empty = all years (rule exception, §1.1)
  drive_date        date,
  location          text,
  status            text not null default 'upcoming'
                    check (status in ('upcoming','ongoing','completed','cancelled')),
  created_by        uuid references profiles(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

drive_branches (                                     -- no rows = all branches eligible
  drive_id    uuid not null references drives(id) on delete cascade,
  branch_id   uuid not null references branches(id),
  primary key (drive_id, branch_id)
);

rounds (
  id          uuid primary key default gen_random_uuid(),
  drive_id    uuid not null references drives(id) on delete cascade,
  name        text not null,
  position    int not null,
  description text,
  unique (drive_id, position)
);

round_topics (
  round_id    uuid not null references rounds(id) on delete cascade,
  topic_id    uuid not null references topics(id),
  primary key (round_id, topic_id)
);

round_resources (
  round_id    uuid not null references rounds(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  primary key (round_id, resource_id)
);

experiences (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id),
  company_id        uuid not null references companies(id),
  role_id           uuid not null references roles(id),
  drive_id          uuid references drives(id),
  rounds_summary    text,                          -- narrative; not aggregated
  preparation_timeline text,
  evidence_path     text,                          -- private bucket; never publicly readable
  status            text not null default 'pending'
                    check (status in ('pending','verified','rejected')),
  rejection_reason  text,
  verified_by       uuid references profiles(id),
  verified_at       timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

experience_topics (
  experience_id uuid not null references experiences(id) on delete cascade,
  topic_id      uuid not null references topics(id),
  primary key (experience_id, topic_id)
);

experience_resources (
  experience_id uuid not null references experiences(id) on delete cascade,
  resource_id   uuid not null references resources(id) on delete cascade,
  primary key (experience_id, resource_id)
);

prep_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  drive_id      uuid not null references drives(id) on delete cascade,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, drive_id)
);

plan_items (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references prep_plans(id) on delete cascade,
  topic_id      uuid references topics(id),
  position      int not null,
  week          int not null check (week >= 1),
  label         text not null,
  done          boolean not null default false,
  done_at       timestamptz,
  unique (plan_id, position)
);

plan_item_resources (
  plan_item_id  uuid not null references plan_items(id) on delete cascade,
  resource_id   uuid not null references resources(id) on delete cascade,
  primary key (plan_item_id, resource_id)
);

plan_experiences (                                  -- provenance
  plan_id       uuid not null references prep_plans(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete restrict,
  primary key (plan_id, experience_id)
);
-- on delete restrict is intentional: a verified experience cited by a plan
-- must be rejected (status change), not deleted.
```

### 1.3 Public views (security definer — safe columns only)

Base `experiences` / `profiles` stay owner/admin-only under RLS. These views run as the view owner, so visitors can read them without any policy that exposes `user_id` or `evidence_path`. Supabase's advisor will flag them as security-definer views — this is intentional and documented in the README.

```sql
create view public_experiences with (security_invoker = false) as
  select e.id, e.company_id, e.role_id, e.drive_id,
         e.rounds_summary, e.preparation_timeline,
         e.verified_at, e.created_at,
         p.grad_year, p.role as author_role
  from experiences e
  join profiles p on p.id = e.user_id
  where e.status = 'verified';

create view public_experience_topics with (security_invoker = false) as
  select et.experience_id, et.topic_id
  from experience_topics et
  join experiences e on e.id = et.experience_id
  where e.status = 'verified';

create view public_experience_resources with (security_invoker = false) as
  select er.experience_id, er.resource_id
  from experience_resources er
  join experiences e on e.id = er.experience_id
  where e.status = 'verified';

create view community_tips with (security_invoker = false) as   -- no author info at all
  select e.id, e.company_id, e.role_id, e.rounds_summary, e.created_at
  from experiences e
  where e.status = 'pending';

revoke all on public_experiences, public_experience_topics,
              public_experience_resources, community_tips from public;
grant select on public_experiences, public_experience_topics,
                public_experience_resources, community_tips to anon, authenticated;
```
UI shows "Placed senior · Batch of 2025" — never an id, never an evidence path.

### 1.4 Helpers, triggers, indexes

```sql
-- Role check for RLS + server components. No JWT claims machinery.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Auto-create profile on signup; role always 'student'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id) values (new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_drives_updated      before update on drives      for each row execute function set_updated_at();
create trigger trg_experiences_updated  before update on experiences  for each row execute function set_updated_at();
create trigger trg_plans_updated       before update on prep_plans   for each row execute function set_updated_at();

create index on experiences (company_id, status);
create index on experiences (role_id, status);
create index on experiences (user_id, status);
create index on experience_topics (topic_id);
create index on drives (status, drive_date);
create index on plan_items (plan_id);
```

### 1.5 RPCs (atomic writes; `security invoker` — RLS still applies)

```
submit_experience(company_id, role_id, drive_id, rounds_summary, timeline,
                  evidence_path, topic_ids uuid[], resource_ids uuid[])
  - raise if caller has ≥ 5 pending experiences
  - raise if evidence_path does not start with auth.uid()::text || '/'
  - insert experiences (user_id = auth.uid(), status forced 'pending')
    + experience_topics + experience_resources — one transaction

save_plan(drive_id, items jsonb, experience_ids uuid[])
  -- items: [{topic_id, position, week, label, resource_ids[]}] — transport only
  - delete existing prep_plans row for (auth.uid(), drive_id)  (cascades)
  - insert prep_plans + plan_items + plan_item_resources + plan_experiences
  - one transaction: any failure rolls back everything; regenerate is idempotent
```

### 1.6 RLS + grants

**profiles**
```sql
-- select: own row, or admin
-- insert: none for clients (trigger creates rows)
-- update: own row only, and only these columns:
revoke update on profiles from authenticated, anon;
grant update (branch_id, cgpa, backlogs, pct_10th, pct_12th, grad_year)
  on profiles to authenticated;
-- role is never client-writable. Admin promotion = migration or service-role SQL.
```

**Reference tables + drives + rounds + their join tables:** `select` for all; write only when `public.is_admin()`.

**experiences (+ experience_topics, experience_resources):** `select` where `auth.uid() = user_id` or `public.is_admin()`; inserts only via `submit_experience`; `update` only when `public.is_admin()`. Public reads only via §1.3 views.

**prep_plans, plan_items, plan_item_resources, plan_experiences:** all operations only when the plan belongs to `auth.uid()`. `plan_items` client update limited to `done`, `done_at` via column grant.

**Storage bucket `evidence`** (private, `file_size_limit = 5MB`, `allowed_mime_types = {image/jpeg, image/png, application/pdf}`):
```sql
-- insert: authenticated, own folder only
create policy evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence'
              and (storage.foldername(name))[1] = auth.uid()::text);
-- select / update / delete: admin only
create policy evidence_admin on storage.objects for all to authenticated
  using (bucket_id = 'evidence' and public.is_admin());
```
Path format: `{user_id}/{uuid}.{ext}` (uuid generated server-side; no client filenames). Signed URLs generated in a Server Action after a fresh `is_admin()` check, 60 s expiry. README carries the retention note: evidence kept for verification only, deleted on request.

### 1.7 Migrations & seed
- `supabase/migrations/*.sql` in dependency order. Verified on a fresh project in CI (`supabase db reset`), at minimum locally before freeze.
- `supabase/seed.sql`: 3 companies, 5 roles, ~30 topics, branches, **25+ experiences** with overlapping topics and spread dates, 3 drives, resources wired via join tables. Seed rows shaped exactly like real rows.
- `supabase/tests/rls.sql` (pgTAP) or Vitest against local Supabase: the §5 RLS checks as automated tests.

---

## 2. BACKEND STRUCTURE

### 2.1 middleware.ts — session check only
```ts
matcher: ['/admin/:path*', '/dashboard/:path*', '/onboarding', '/experiences/new', '/api/plans/:path*']
// No session → /login. Role checks happen in (admin)/layout.tsx (server component, one query)
// AND in every admin Server Action (layouts don't protect actions).
```

### 2.2 Server Actions (`app/_actions/`, Zod-validated, schemas in `lib/schemas.ts`)

| Action | Who | What it does |
|---|---|---|
| `saveProfile` | student | Updates own `profiles` row (branch_id, cgpa, backlogs, percentages, grad year). Schema has no `role` field; DB grant enforces it anyway |
| `submitExperience` | student/alumni | Validates file (type, ≤5 MB), uploads to `{uid}/{uuid}.ext`, then `rpc('submit_experience', …)`. On RPC failure, deletes the uploaded object (service role) |
| `verifyExperience` / `rejectExperience` | admin | `is_admin()` check; sets `status`, `verified_by/at` or `rejection_reason`; revalidates |
| `getEvidenceUrl` | admin | `is_admin()` check; returns 60 s signed URL |
| `createDrive` / `updateDrive` | admin | `is_admin()` check; writes `drives`, `drive_branches`, `rounds`, `round_topics`, `round_resources`; revalidates `/drives` |
| `generatePlan` | student | Runs pure plan engine (§2.4), then `rpc('save_plan', …)` |
| `toggleChecklistItem` | student (owner) | Single-row update on `plan_items` (`done`, `done_at`); driven by `useOptimistic` |
| `checkClaim` | anyone | Deterministic verdict (§2.5) |

### 2.3 Route Handlers
- `GET /api/plans/[id]/export` — ownership check (RLS + explicit), renders plan as Markdown, file download. Mutations stay in Server Actions deliberately.

### 2.4 Plan engine — `lib/plan-engine.ts` (server-only, pure compute)

```
generatePlan(userId, driveId):
  1. Load drive → company_id, role_id, drive_date.
  2. Verified experiences (public_experiences) for (company_id, role_id);
     fall back to company-level; if still none → use this drive's round_topics.
  3. Join public_experience_topics → per-topic count + newest created_at.
     weight = count × exp(-age_days / 365)
  4. Top 12 topics by weight.
  5. Resources per topic: resources(topic_id) ∪ round_resources of this drive's rounds.
  6. Weeks: weeks = max(1, ceil((drive_date − today) / 7)); drive_date null or past → 4.
     Assign items to weeks by simple chunking (highest weight first).
  7. rpc('save_plan', { drive_id, items, experience_ids }) — atomic.
  8. revalidatePath('/dashboard').
```
Steps 3–6 are pure functions, unit-tested with Vitest.

### 2.5 Rumour-check — deterministic, no NLP, one claim type

Input is constrained: company dropdown + topic dropdown. Claim type is fixed: **"X heavily asks Y"**.

```
checkClaim(companyId, topicId):
  exps = public_experiences where company_id = companyId
  if empty → "No verified evidence yet", cites []
  frac = share of exps linked to topicId (via public_experience_topics)
  frac ≥ 0.50 → "Supported" · frac ≤ 0.15 → "Not supported" · else "Mixed evidence"
  if total < 3 → append "Low sample (n = total)"
  return { verdict, frac, total, cites: [experience ids] }
```
Thresholds and minimum sample are named constants. The topic picker searches `topics.label + aliases` client-side — the only fuzzy matching in the system, labeled as search, not claim parsing.

### 2.6 TrustScore — defined (Sundram's viva piece)

```ts
// lib/trust.ts — pure function, unit-tested
raw(exp, companyExps) =
  0.4 × exp(-age_days / 365)                    // recency
+ 0.4 × (peers sharing ≥1 topic / total peers)  // corroboration (0 if no peers)
+ 0.2 × (fields filled / 5)                     // completeness: rounds_summary,
                                                // timeline, ≥2 topics, ≥1 resource, evidence
trustScore = Math.round(100 × raw)              // 0–100 badge on ExperienceCard
// "evidence" input = boolean computed server-side; path itself never leaves the server.
```

### 2.7 Eligibility engine — `lib/eligibility.ts` (Harsh's viva piece)

Independent predicates `{ pass, reason }`: cgpa ≥ threshold · branch_id ∈ drive_branches (none = all) · backlogs ≤ max · 10th/12th % ≥ minima · grad_year ∈ grad_years (empty = all). Missing profile field → predicate returns `{ pass: false, reason: 'Complete your profile' }` and links to `/onboarding`. `explainEligibility` renders failed predicates as sentences on the drive page. Unit-tested per predicate, including boundary values (cgpa = threshold, 10.00).

---

## 3. FRONTEND STRUCTURE

### 3.1 Route tree

```
app/
  (public)/
    layout.tsx                       # nav + footer
    page.tsx                         # landing
    drives/page.tsx                  # searchParams filters: q, company, eligibleOnly
    drives/[id]/page.tsx             # rounds, requirements, matched experiences,
                                     # generate-plan CTA, ineligibility explainer
    experiences/page.tsx             # verified list + TopicFrequencyBars + community-tips lane
    experiences/[id]/page.tsx
    experiences/new/page.tsx         # submit wizard (auth via middleware)
    rumour-check/page.tsx
  (student)/
    layout.tsx                       # sidebar
    onboarding/page.tsx              # profile form → saveProfile
    dashboard/page.tsx               # <Suspense> streams: plans, progress
    dashboard/plans/[id]/page.tsx    # checklist (optimistic), weekly buckets, export button
  (admin)/
    layout.tsx                       # server-side is_admin() check → redirect if not admin
    admin/page.tsx                   # verification queue + evidence viewer (signed URLs)
    admin/drives/page.tsx            # drive CRUD
  api/plans/[id]/export/route.ts
  login/page.tsx
  loading.tsx  error.tsx  not-found.tsx   # per route group
middleware.ts
```

### 3.2 The community-tips lane (defined)

`/experiences` renders two visually separated sections:
1. **Verified experiences** — from `public_experiences`, with `VerifiedBadge` + `TrustScore`.
2. **Community tips** — from `community_tips` view (pending, no author info), under a banner: *"Unverified — treat as rumour until a placement-cell admin verifies it."* The submission thanks-page explains the queue.

### 3.3 Components

```
components/
  ui/            # Button, Card, Badge, Input, Select, Textarea, EmptyState,
                 # Spinner, ProgressRing, Dialog — the reusable-architecture proof
  drives/        # DriveCard, DriveFilters, EligibilityBadge, IneligibilityExplainer, RoundList
  experiences/   # ExperienceCard, VerifiedBadge, TrustScore, TopicFrequencyBars,
                 # TopicPicker, RoleSelect, SubmitWizard, CommunityTipsLane
  plans/         # Checklist, ChecklistItem (useOptimistic), PlanSummary, WeeklyBuckets
  rumour/        # ClaimForm, VerdictCard
hooks/           # useEligibility, useTopicSearch
```

### 3.4 Rubric-visible patterns
- Server Components for data pages; `drives` filters from `searchParams`.
- Dashboard streams via `<Suspense>`; mutations via Server Actions + `useActionState`; checklist toggles via `useOptimistic` against single-row updates.
- Zod on client (pre-validation) and server (authoritative).
- `loading.tsx` / `error.tsx` / `not-found.tsx` per group. Mobile check on every page.

### 3.5 Ownership
- **Deepanshu:** `plans/`, `lib/plan-engine.ts`, `save_plan` RPC, `dashboard/*`, export handler, infra (repo, migrations, RLS tests, CI, Vercel).
- **Harsh:** `drives/*`, `lib/eligibility.ts`, drive admin CRUD, branches taxonomy.
- **Sundram:** `experiences/*`, `rumour/`, `lib/trust.ts`, `submit_experience` RPC, storage policies, verification queue.
- Shared: `ui/`, `schemas.ts`, `middleware.ts`, seed, README, demo script.
- Branches + PRs per person from day 1; PR titles map to modules for the contribution declaration.

---

## 4. COLD START + VALIDATION (R4 — the real gap)

- **Seed:** 25+ experiences, overlapping topics, spread dates, before any demo. Sourced from placed seniors via placement cell / senior networks, collected in the `/experiences/new` field shape.
- **L2 (10):** structured sessions with 8–10 juniors. Log per session: timestamp · task given · completed (y/n + time) · quote · issue found → fix → before/after screenshot → linked PR.
- **L3 (15):** placement cell or a department formally uses/commissions it — **written confirmation** (email/letter), plus usage over 2+ weeks (accounts, submissions, plans generated). A demo alone does not qualify. Only route toward L4.
- Outreach draft (send after Phase 1):

> Subject: Pilot request — placement prep platform (student project)
> Hello [Name], we're Group 8 (INT252/257), building "Beyond the Rumour Mill" — a platform where verified senior interview experiences feed personalised prep plans for juniors, replacing placement rumours with attributable data. We'd like to pilot it with [department/cell]: you'd list one real drive and verify a few senior experiences; we'd handle everything else and share a usage report. Would a 15-minute walkthrough next week work?

---

## 5. DEFINITION OF DONE

- [ ] Migrations run clean on a fresh Supabase project (`supabase db reset`), in order
- [ ] Vercel live; CI green on every PR (lint, typecheck, Vitest, RLS tests)
- [ ] One Playwright spec passes: login → eligible drive → generate plan → toggle item → export
- [ ] **RLS tests (automated):**
  - [ ] student `update profiles set role='admin'` → fails
  - [ ] anon can read `public_experiences` / `community_tips`; cannot read `experiences` or `profiles`
  - [ ] anon/student response never contains `user_id` or `evidence_path`
  - [ ] student cannot read another user's plan or experience row
  - [ ] student cannot upload outside `{own uid}/`, cannot read any evidence object
  - [ ] non-admin calling admin Server Actions → rejected
- [ ] `save_plan` failure mid-write leaves no partial plan (test with forced error)
- [ ] Every form: validation, empty, loading, error states
- [ ] Lighthouse 90+ on `/` and `/drives`; mobile check on all pages
- [ ] Rumour-check returns cited verdicts; topic bars render from real seed data
- [ ] Supabase advisor reviewed; only the documented definer views flagged
- [ ] README: setup, PII/retention note, definer-view rationale, admin promotion procedure, how to add a topic (migration), demo script, contribution declarations

---

## 6. PHASES (dates pending — CA2 deadline still open)

- **Phase 0:** repo + PR workflow, migrations (incl. grants, views, trigger), auth, middleware, layouts, admin gate, RLS tests, Vercel live, CI green.
- **Phase 1:** onboarding + drives + eligibility w/ explanations (Harsh); submit wizard + tag picker + storage policies (Sundram); checklist basics + `save_plan` (Deepanshu). → send L3 outreach.
- **Phase 2:** plan engine, verification queue, trust scores, topic bars, rumour-check, export handler, community-tips lane.
- **Phase 3:** senior-sourcing (25+ seeds) → L2 sessions → fixes → L3 confirmation → demo rehearsal.

## 7. DEMO SCRIPT (2 minutes)

1. Incomplete profile → `/onboarding` nudge; complete it → `/drives` filters to eligible; open an ineligible drive → *why*.
2. Drive detail → rounds, requirements, verified experiences for that company + role.
3. "Generate my prep plan" → checklist from weighted topics, resources attached, weekly buckets.
4. `/rumour-check` → "TCS heavily asks Dynamic Programming" → verdict with cited experiences.
5. Community-tips lane (flagged, quarantined) vs verified repo. Admin → verification queue, evidence via signed URL.
6. (If asked about security) show the failing self-promotion RLS test in CI.

## 8. HONEST PROJECTION

R1 15–17 (do the design pass) · R2 32–34 · R3 21–23 · R4 10, or 15 with written placement-cell confirmation → **realistic total ~82–90.** 100 is not reachable as scoped; L4 needs paid or exceptional sustained impact.
