# Viva guide: explaining Beyond the Rumour Mill

A short route through the project for an oral exam. Each point names the file to open.
For depth, see [`ARCHITECTURE.md`](ARCHITECTURE.md), [`../SYLLABUS.md`](../SYLLABUS.md) and [`demo-script.md`](demo-script.md).

## One sentence

Students prepare for placements from WhatsApp rumours. This app replaces them with official drive rules, verified senior experiences, and a prep plan built from what verified seniors were actually asked.

## The shape of the code

There is one Next.js app. The "backend" is the server side of that app (Server Components, Server Actions, route handlers) talking to Supabase (Postgres, auth, storage). It is not split into two deployments on purpose: one deploy, one type system, and the database enforces access rules itself.

| Layer | Where | What it does |
|---|---|---|
| Pages and layouts | `app/(public)`, `app/(student)`, `app/(admin)` | Route groups: public, signed-in student, admin |
| UI components | `components/` | Presentational pieces, grouped by feature |
| Server Actions (writes) | `app/_actions/` | Validate input with zod, then call the database |
| Domain logic (pure functions) | `lib/placement`, `lib/experiences`, `lib/preparation` | The three modules; no I/O, unit-tested |
| Database access | `lib/db/` | Supabase clients (server, browser, admin) and session refresh |
| Auth and roles | `lib/auth.ts`, `proxy.ts` | Session check, `is_admin()` role check |
| Schema and rules | `supabase/migrations/` | Tables, row-level security, RPCs |

## Four things worth being able to explain

1. **Eligibility** (`lib/placement/eligibility.ts`): each rule (CGPA, backlogs, 10th, 12th, branch, graduation year) is a small function returning `{ pass, reason }`. A rule a drive does not set always passes. A rule the profile cannot answer yet is marked incomplete, not failed. The UI shows exactly which rule failed.
2. **Rumour check** (`lib/experiences/rumour.ts`): a claim like "Amazon heavily asks DP" is checked against verified experiences only. At least 50% of them mention the topic: Supported. 15% or less: Not supported. In between: Mixed evidence. Fewer than 3 experiences: flagged as low sample.
3. **Prep plan** (`lib/preparation/plan-engine.ts`): pick the experiences for the drive's company and role (falling back to the company, then to the drive's own rounds). Weight each topic as count x exp(-age / 365 days). Take the top 12. Spread them over the weeks left until the drive date (4 if no date). Every item says why it is there, for example "asked in 3 of 4 verified experiences".
4. **Trust model**: only experiences an admin has verified count toward bars, verdicts and plans. Pending and rejected ones never appear publicly. Evidence files are in a private bucket. Access rules live in Postgres row-level security, not only in the UI.

## Auth in one paragraph

`proxy.ts` runs on each request, refreshes the session cookie, and sends signed-out users away from protected paths. It does not check roles. The admin layout and every admin Server Action call `is_admin()` in the database, because layouts do not protect Server Actions.

## Sample data

Demo drives and experiences used for presentations are titled "[DEMO] Sample ... (not a real opening)" and carry a SAMPLE DATA chip in the UI. They are not real openings and not real students. Delete them by title prefix when the viva is over.

## Likely questions

- *Why Next.js and Supabase, not a separate API?* Fewer moving parts, and the database enforces access.
- *Why are plans deterministic and not AI?* Every item can be traced to evidence. See the plan engine above.
- *What is not done?* See "Limits" in the README.
