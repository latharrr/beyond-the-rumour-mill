# Demo script (2 minutes, §7)

Runs against the **local seed** (`npx supabase db reset && npm run dev`, http://localhost:3000). All seed passwords are `password123`. The seeded experiences are synthetic; say so if asked, and say that Phase 3 replaces them with senior-sourced ones.

For a demo on production (https://beyond-the-rumour-mill.vercel.app), run the same clicks after the Phase 3 data exists there (real accounts, drives created at `/admin/drives`, imported/verified experiences).

## Before the demo (5 minutes, once)

1. `npx supabase db reset` (fresh seed: student profile empty, no plans).
2. Prepare a pending experience **with evidence** for step 5:
   - Sign in as `alumni3@seed.test` and open `/experiences/new`.
   - Fill in Company **TCS**, Role **Systems Engineer (SE, Ninja)**, Drive **TCS NQT 2026 — Ninja & Digital**.
   - For "What happened in each round?", enter any 30+ character summary.
   - Search topics for `pseudo` and tick **Pseudocode**.
   - Attach any small PDF and click **Submit for verification**. Then sign out.
3. Open two browser windows: window A for the student, window B (private) for `admin@seed.test`.

## Script

**1. Profile → eligibility (25 s).** Window A:
- Sign in as `student@seed.test`. The dashboard shows *"Your profile is incomplete…"*.
- Click **Complete your profile** and fill in:
  - Branch **CSE — Computer Science & Engineering**
  - CGPA `6.8`, Active backlogs `0`
  - 10th `82`, 12th `78`
  - Graduation year `2027`
- Click **Save profile**.
- Open **Browse drives**, tick *Only drives I’m eligible for* and **Apply filters**. Only **TCS NQT 2026** remains.
- Untick it, open **Amazon SDE-1 New Grad** and point at *Why you're not eligible*: "Your CGPA 6.80 is below the 7.50 minimum."

**2. Drive detail (15 s).** Open **TCS NQT 2026 — Ninja & Digital**. Point at the Requirements (Eligible), the three Rounds with their topics, and the *Verified experiences* for TCS · Systems Engineer.

**3. Generate the plan (25 s).**
- Click **Generate my prep plan**. It lands on the plan.
- Point at:
  - the items ("Pseudocode — asked in 6 of 7 verified experiences"): weighted by count × recency, top 12;
  - the resources attached to each item;
  - the Week 1…n buckets, sized from the drive date;
  - *Built from*: every experience the plan used, linked.
- Tick the first item. The counter updates instantly (optimistic), and it survives a reload.
- Click **Export as Markdown** to download the plan.

**4. Rumour check (20 s).**
- Open `/rumour-check`, choose Company **TCS** and search the topic `dp`, then tick **Dynamic Programming** and click **Check claim**.
- Verdict: **Not supported** (1 of 9 TCS experiences).
- Repeat with **Pseudocode**: **Supported**, with every cited experience linked.

**5. Quarantine and verification (25 s).**
- Open `/experiences`. Point at the topic table (real counts from the data), the verified list with TrustScores, and the separate **Community tips** lane under *"Unverified — treat as rumour…"*.
- Window B: sign in as `admin@seed.test`, which opens `/admin`.
- On the alumni3 submission, click **View evidence**. A 60-second signed URL opens the PDF.
- Click **Verify**. Back on `/experiences`, it has moved from the tips lane to the verified list.

**6. If asked about security (10 s).** Open the CI run on GitHub and point at the RLS job:
- `tests/rls/rls.test.ts`: "student cannot promote themselves to admin";
- `tests/rls/experiences-actions.test.ts`: "non-admin calling verifyExperience → rejected";
- `tests/rls/plans-actions.test.ts`: "another user gets 404, not the plan".

## Fallbacks

- A step fails live: say what it should show, and move on. Every step has a Playwright spec that passed in CI (`e2e/drives.spec.ts`, `e2e/plans.spec.ts`, `e2e/experiences.spec.ts`).
- Seed state drifted: `npx supabase db reset` takes about 20 s, then redo the "Before the demo" steps.
