# Syllabus map

Where each INT252 / INT257 topic and each P08 module lives in the code. Paths are clickable on GitHub.

## Folder structure

```
app/                     Next.js App Router (INT257 U1)
  (public)/ (student)/ (admin)/   route groups, each with layout, loading, error, not-found
  _actions/              Server Actions: every write (INT257 U3)
  api/plans/[id]/export/ Route Handler: GET a plan as Markdown (INT257 U3)
  api/ask/               Route Handler: POST a question, Claude Haiku 5.5 streams the answer
  auth/confirm/          Route Handler: email confirmation / password-reset link
  sitemap.ts robots.ts opengraph-image.tsx   SEO + Metadata API (INT257 U5)
proxy.ts                 Proxy: refreshes the session, guards private paths (INT257 U6)
lib/
  placement/             Module 1 - Placement Information
  experiences/           Module 2 - Experience Repository
  preparation/           Module 3 - Student Preparation
  db/                    Supabase clients + generated DB types (INT257 U4)
  auth.ts                session, protected routes, admin role check (INT257 U4)
  validation.ts          Zod schemas shared by forms and Server Actions (INT252 U4)
  taxonomy.ts            cached reference data: companies, roles, topics
components/              React components, grouped by feature (INT252 U2)
hooks/                   custom hooks (INT252 U3)
supabase/migrations/     database schema, row-level security, RPCs
tests/ e2e/              Vitest unit + RLS tests, Playwright end-to-end tests
```

Each module folder has one `data.ts` (database reads) plus pure logic files that have unit tests.

## P08 modules

| Module | Logic | Data | Pages |
|---|---|---|---|
| 1 Placement information: drives, eligibility, roles, requirements | `lib/placement/eligibility.ts`, `drive-search.ts` | `lib/placement/data.ts` | `/drives`, `/drives/[id]`, `/companies/[slug]` |
| 2 Experience repository: verified senior experiences | `lib/experiences/rumour.ts`, `topic-frequency.ts`, `evidence.ts` | `lib/experiences/data.ts` | `/experiences`, `/experiences/new`, `/rumour-check`, `/admin` (verify) |
| 3 Student preparation: checklist, resources, progress | `lib/preparation/plan-engine.ts`, `export.ts` | `lib/preparation/data.ts` | `/dashboard`, `/dashboard/plans/[id]` |
| Integration: requirement → experiences → plan | `buildPlan()` in `lib/preparation/plan-engine.ts` reads the drive's rounds (M1) and verified experiences (M2) | `loadEngineInput()` in `lib/preparation/data.ts` | "Generate my prep plan" on `/drives/[id]` |

## INT257 Modern Web Application Development (Next.js)

| Unit | Topic | Where |
|---|---|---|
| I | App Router, project structure | `app/`, route groups `(public)` `(student)` `(admin)` |
| I | Dynamic + nested routes, layouts | `app/(public)/drives/[id]`, `app/(student)/dashboard/plans/[id]`, `app/*/layout.tsx` |
| I | Loading and error UI | `app/(public)/loading.tsx`, `error.tsx`, `not-found.tsx` |
| II | SSG | `generateStaticParams` in `app/(public)/companies/[slug]/page.tsx` |
| II | Server / Client Components | pages are Server Components; `"use client"` forms in `components/`; home page: `RumourRegister` (server, streamed in `<Suspense>`) beside `RuleLab` (client) |
| II | Caching + revalidation | `"use cache"` + `cacheLife` in `lib/taxonomy.ts`; `revalidatePath` / `updateTag` in `app/_actions/*` |
| III | Route Handlers, request/response | `app/api/plans/[id]/export/route.ts` (GET), `app/api/ask/route.ts` (POST: validates JSON with Zod, checks the session, streams the answer), `app/auth/confirm/route.ts` |
| III | Server Actions, form validation, data mutations | `app/_actions/*.ts` + `lib/validation.ts` |
| III | File upload | evidence upload in `app/_actions/experiences.ts` (`submitExperience`) |
| III | Optimistic UI | `useOptimistic` in `components/plans/Checklist.tsx` |
| IV | Authentication, sessions | `app/_actions/auth.ts`, `lib/auth.ts`, `lib/db/server.ts` (cookie session) |
| IV | Protected routes | `proxy.ts` + `lib/db/proxy.ts` (`isProtectedPath`) |
| IV | Role-based access control | `requireAdmin()` in `lib/auth.ts`, used by `app/(admin)/layout.tsx` and admin actions; enforced again by RLS in `supabase/migrations` |
| IV | Database, CRUD, env variables | `lib/*/data.ts`, `lib/db/env.ts`, `.env.example` |
| V | Image optimization | `next/image` in `components/nav/BrandMark.tsx`, `components/footer/SiteFooter.tsx` |
| V | Performance (fonts) | `next/font/local` self-hosts the Fontshare fonts from `app/fonts/` in `app/layout.tsx`: no extra network request, no layout shift |
| V | Metadata API, SEO | `generateMetadata` in `app/(public)/drives/[id]/page.tsx`; `app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` |
| V | Deployment, production build | `.github/workflows/ci.yml`, `scripts/deploy/`, live at clg.143.lat |
| VI | Proxy | `proxy.ts` |
| VI | Testing | `tests/unit`, `tests/rls`, `e2e/` |

## INT252 Web App Development with ReactJS

| Unit | Topic | Where |
|---|---|---|
| I | ES6+, immutability, array methods | pure functions in `lib/placement/eligibility.ts`, `lib/preparation/plan-engine.ts` |
| II | Props, composition, conditional rendering | `components/drives/DriveCard.tsx`, `components/ui/*` |
| II | Tailwind, responsive design | `app/globals.css`, utility classes throughout `components/` |
| II | Theming: light / dark | colour tokens + `[data-theme="light"]` overrides in `app/globals.css`; `components/nav/ThemeToggle.tsx` (event handler + `localStorage`); no-flash script in `app/layout.tsx` |
| II | CSS animation (no library) | `animate-marquee` in `components/rumour/RumourTicker.tsx`, `stamp-in` in `components/rumour/RumourRegister.tsx`; both off under reduced motion |
| III | useState, events, derived state | `app/(public)/login/login-form.tsx`; `components/rumour/RuleLab.tsx` (home-page sliders run the real verdict rule) |
| III | useEffect + cleanup | `components/nav/SiteNav.tsx` (scroll and Escape listeners), `components/plans/Checklist.tsx` |
| III | useContext | `components/plans/ChecklistContext.tsx`, read by `ChecklistItem.tsx` |
| III | useCallback, useMemo, React.memo | `toggle` + context value in `components/plans/Checklist.tsx`; `memo(ChecklistItem)`; `hooks/useTopicSearch.ts` |
| III | Custom hooks | `hooks/useTopicSearch.ts`, `useChecklist()` in `components/plans/ChecklistContext.tsx` |
| IV | Controlled forms, submission | `components/profile/ProfileForm.tsx`, `components/experiences/SubmitWizard.tsx` |
| IV | Zod validation with errors shown | `lib/validation.ts` used on both client (`login-form.tsx`) and server (`app/_actions/*`) |
| V | Data fetching, loading / error / empty states | Server Component pages + `components/route-states.tsx`; client-side `fetch` with loading, error and streamed answer states in `components/ask/AskBox.tsx` |
| V | Route-based code splitting | automatic per route in the App Router |
| V | Routing: dynamic routes, query params, protected routes | `/drives?q=&company=&eligibleOnly=` (`lib/validation.ts` `driveFiltersSchema`), `proxy.ts` |
| VI | Context API for shared state | `ChecklistContext`: the checklist shares `toggle` and saving state without prop drilling |
| VI | Deployment, env variables | `.env.example`, `.github/workflows/ci.yml` |

## Deliberately not used

- **Vite, React Router, Axios, React Query, Redux Toolkit, Zustand** (INT252): in a Next.js app the App Router replaces React Router, Server Components fetch data on the server (no Axios / React Query needed), and the only shared client state (the checklist) is small enough for Context.
- **`next/dynamic`** (INT257 V): every client component is visible on first load of its page, so there is nothing worth lazy-loading; routes are already split automatically.
- **ORM** (INT257 IV): Supabase's typed query builder plus generated types (`lib/db/database.types.ts`) fills that role, with security enforced by row-level security in the database.
- **Parallel routes, intercepting routes, Edge runtime, internationalization** (INT257 VI): no screen needs two panes, a modal-over-route or a second language; the Proxy is the Unit VI feature we use.
- **Animation libraries:** none. Hover and entrance effects are Tailwind transitions; the home-page rumour strip and stamps are plain CSS keyframes.
