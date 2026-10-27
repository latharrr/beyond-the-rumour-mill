# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** LPU students (juniors) heading into campus placement drives, such as TCS NQT, Infosys and Amazon. They need to know whether they're eligible, what each drive actually asks, and how to prepare in the weeks before the drive date. Today that knowledge comes from hostel and WhatsApp rumours.
- **Contributors:** placed seniors (alumni). They submit their real interview experience: rounds, topics, timeline, resources and optional evidence.
- **Admins:** placement-cell staff. They list official drives and verify or reject senior submissions after checking the evidence.

## Product Purpose

A placement-prep platform where official drive information and verified senior experiences feed a personal preparation-plan generator. The rumour mill is visibly quarantined behind a verification layer.

Success means a junior can do four things:
- see whether they're eligible for a drive and why;
- see what that company and role really asks, backed by verified experiences;
- check a claim they heard ("TCS heavily asks DP") against the evidence;
- leave with a week-by-week checklist they can tick off and export.

## Positioning

The product replaces placement rumours with attributable data. Every claim the product makes about a company is computed from verified senior experiences and cites them. Unverified tips are shown but explicitly flagged as rumour ("treat as rumour until a placement-cell admin verifies it"). Generic prep sites can't copy this: it is campus-specific, drive-specific, and verification-gated by the placement cell.

## Operating Context

- Students use it between classes and in the run-up to a drive, often on phones.
- A drive has a company, a role, a date, eligibility rules (CGPA, branch, backlogs, 10th/12th %, graduation year) and ordered rounds with topics.
- **Plan generation:** topics are weighted by how often verified experiences mention them, with recency decay. The weighted topics are chunked into weeks until the drive date, with resources attached. The plan exports to Markdown.
- **Rumour check:** one fixed claim type, "{company} heavily asks {topic}". The verdict is Supported (≥ 50% of experiences mention it), Not supported (≤ 15%) or Mixed evidence, plus a "Low sample" flag when n < 3, with the cited experiences listed.
- **TrustScore:** 0–100 per experience, made of recency (40%), corroboration (40%) and completeness (20%).

## Capabilities and Constraints

- **Stack:** Next.js 16 App Router (cacheComponents), Supabase (Postgres + RLS, Auth, private Storage), Vercel, Zod, Vitest, Playwright.
- **Routes:**
  - Public: `/`, `/login`, `/drives`, `/drives/[id]`, `/experiences`, `/experiences/[id]`, `/experiences/new`, `/rumour-check`
  - Student: `/onboarding`, `/dashboard`, `/dashboard/plans/[id]`
  - Admin: `/admin`, `/admin/drives`
- Public pages must never expose `user_id` or evidence paths. Authors appear only as "Placed senior · Batch of YYYY".
- The Definition of Done requires Lighthouse 90+ on `/` and `/drives`, a mobile check on all pages, and validation/empty/loading/error states on every form.
- Playwright specs rely on existing accessible names ("Generate my prep plan", "Export as Markdown", "Check claim", "Verify", "Submit for verification", "Save profile", "Apply filters").
- This is a student course project (LPU CA2, Group 8). It is not yet commissioned by the placement cell.

## Brand Commitments

- The name is "Beyond the Rumour Mill". There is no logo or brand assets yet.
- **Voice:** plain, direct, evidence-first. Rumours are named as rumours.
- **Visual reference chosen by the user for the landing page:** Handshake (joinhandshake.com), the student career platform.

## Evidence on Hand

- Local seed data (`supabase/seed.sql`): 3 companies (TCS, Infosys, Amazon), 3 drives and 28 experiences (24 verified, 3 pending, 1 rejected). It also has 30 topics with real-looking frequency, trust scores and rumour verdicts. **All seed experiences are synthetic** and must be labelled as sample data wherever a visitor could take them as real.
- Production has the taxonomy (companies, topics, resources) but no real senior experiences yet.
- There are no testimonials, user counts, placement-cell endorsements or press. Never invent them.

## Product Principles

1. **Evidence before opinion.** Every number or verdict links back to the verified experiences it came from.
2. **Rumours stay visible but quarantined.** Unverified content is shown, clearly labelled, and never mixed into counts.
3. **Tell students why.** Ineligibility, verdicts and plan weights are always explained in a sentence.
4. **Attributable, not identifiable.** Seniors are credited by batch, never exposed.
5. **Useful in the week before the drive.** Plans are dated, chunked and exportable, and they work on a phone.

## Accessibility & Inclusion

- Target WCAG 2.2 AA: contrast, visible focus, keyboard operation and reduced motion.
- Status (eligible, verified, verdict) is never conveyed by colour alone.
