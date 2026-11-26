import type { Metadata } from "next";
import Link from "next/link";
import { cache, Suspense, type ReactNode } from "react";
import { BriefSkeleton, CompanyBrief, CompanyList } from "@/components/home/CompanyBrief";
import { HomeMotion, Hydrated } from "@/components/home/HomeMotion";
import { RuleLab } from "@/components/rumour/RuleLab";
import { RUMOURS, RumourRegister, RumourRegisterFallback } from "@/components/rumour/RumourRegister";
import { ArrowLink, PillLink } from "@/components/ui/pill";
import { Strike } from "@/components/ui/marks";
import { SampleTag } from "@/components/ui/status";
import { getSessionUser } from "@/lib/auth";
import { listVerifiedExperiences } from "@/lib/experiences/data";
import { companyResearch } from "@/lib/placement/company-research";
import { isUuid, listDrives, withRoundCounts, type DriveSummary } from "@/lib/placement/data";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// One query each per request, shared by the sections that need them.
const getDrives = cache(listDrives);
const getEvidence = cache(() => listVerifiedExperiences());

const H2 = "font-serif text-[48px] leading-[0.95] font-normal tracking-[-0.03em] text-balance text-ink md:text-[88px] lg:text-[112px]";
const SECTION = "relative pb-24 md:pb-40";
// The page grid: 4 columns on phones, 12 from tablet up. <Guides> draws its column lines.
const GRID = "grid grid-cols-4 gap-x-6 md:grid-cols-12";
const SECTIONS = 6;

/**
 * The home page: hero, rumour board, how it works, company list, evidence
 * counts, FAQ, CTA. Server Components throughout; HomeMotion adds the motion on
 * top, so the page reads the same without it. "Clean desk, real paper": a calm
 * hairline grid, with only the evidence objects (notes, stamps, tickets, the
 * brief) made physical.
 */
export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main data-home className="relative z-[1] bg-bg">
      <HomeMotion />

      {/* Hero */}
      <section data-hero aria-labelledby="hero-title" className="relative">
        <Guides />
        <div className="relative container-page pt-8 pb-24 md:pt-12 md:pb-40">
          <div className={`${GRID} type-label text-ink-2 motion-safe:animate-rise`}>
            <p className="col-span-3 md:col-span-4">Placement prep, from evidence</p>
            <p className="hidden md:col-span-3 md:col-start-7 md:block">LPU CA2 · Group 8</p>
            <p className="col-start-4 text-right md:col-start-12">P08</p>
          </div>
          <div className={`mt-20 md:mt-32 ${GRID}`}>
            <h1 id="hero-title" className="col-span-4 font-serif text-[clamp(52px,10vw,160px)] leading-[0.9] font-normal tracking-[-0.03em] text-ink md:col-span-12 lg:col-span-9">
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="block motion-safe:line-up">Prepare from evidence,</span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="block text-ink-2 italic motion-safe:line-up [--d:80ms]">
                  not{" "}
                  {/* Hearsay, struck out: an oxblood pen line draws through each word as you scroll (HomeMotion). */}
                  <span className="relative">
                    hostel
                    <Strike className="top-[0.44em] left-[-0.04em] h-[0.24em] w-[calc(100%+0.08em)]" />
                  </span>{" "}
                  <span className="relative">
                    rumours
                    <Strike className="top-[0.42em] left-[-0.04em] h-[0.24em] w-[calc(100%+0.08em)]" />
                  </span>
                  .
                </span>
              </span>
            </h1>
          </div>

          <div className={`mt-24 gap-y-14 md:mt-40 ${GRID}`}>
            <div className="col-span-4 grid content-start gap-6 md:col-span-6 lg:col-span-4">
              <p className="max-w-[36ch] type-body text-pretty text-ink-2">Pick a company. See its drive, what verified seniors were asked, and what to do next.</p>
              <ArrowLink href="#companies">Choose a company</ArrowLink>
              <p className="max-w-[36ch] border-t border-line pt-6 type-small text-ink-2">
                Every verdict counts verified senior experiences. Hostel tips stay labelled as rumours and never count.
              </p>
            </div>
            <div id="brief" className="col-span-4 min-w-0 scroll-mt-28 md:col-span-12 lg:col-span-7 lg:col-start-6">
              <Suspense fallback={<BriefSkeleton />}>
                <HeroBrief searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* 01 Rumour → verdict */}
      <section data-board aria-labelledby="board-title" className={`${SECTION} bg-bg-alt`}>
        <SectionHead n={1} label="Hearsay, checked" />
        <div className="container-page">
          <div className={`mt-16 md:mt-24 ${GRID}`}>
            <h2 id="board-title" data-split className={`col-span-4 md:col-span-10 ${H2}`}>
              Heard in the hostel. Checked against the record.
            </h2>
            <p className="col-span-4 mt-10 max-w-[52ch] type-body text-ink-2 md:col-span-6">
              Each rumour is checked against verified experiences for that company. Half or more mention it: supported. Fifteen percent or less: not supported. In between: mixed.
            </p>
          </div>
          <div className="mt-16 md:mt-24">
            <Suspense fallback={<RumourRegisterFallback />}>
              <RumourRegister evidence={getEvidence()} />
              <Hydrated name="board" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* 02 How it works */}
      <section aria-labelledby="how-title" className={SECTION}>
        <Guides />
        <SectionHead n={2} label="Procedure" />
        <div className="relative container-page">
          <h2 id="how-title" data-split className={`mt-16 md:mt-24 ${H2}`}>
            How it works
          </h2>
          <ol className={`mt-16 gap-y-12 md:mt-24 ${GRID}`}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="col-span-4 flex flex-col gap-6 border-t border-ink pt-5">
                <span className="type-label text-ink-2">0{i + 1} / 03</span>
                <h3 className="font-serif text-[36px] leading-[0.95] tracking-[-0.03em] text-ink md:text-[48px]">{s.title}</h3>
                <p className="max-w-[40ch] type-body text-ink-2">{s.body}</p>
                <ArrowLink href={s.href} className="mt-auto">
                  {s.link}
                </ArrowLink>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 03 Company list */}
      <section id="companies" aria-labelledby="companies-title" className={`${SECTION} scroll-mt-16`}>
        <Guides />
        <SectionHead n={3} label="Drives on file" />
        <div className="relative container-page">
          <div className={`mt-16 md:mt-24 ${GRID}`}>
            <h2 id="companies-title" data-split className={`col-span-4 md:col-span-10 ${H2}`}>
              Which company are you preparing for?
            </h2>
          </div>
          <nav aria-label="Company guides" className="mt-16 border-y border-line py-5 md:mt-20">
            <ul className="flex flex-wrap gap-x-7 gap-y-2">
              {companyResearch.map((c) => (
                <li key={c.slug}>
                  <Link href={`/companies/${c.slug}`} className="font-serif text-[26px] tracking-[-0.02em] text-ink-2 italic hover:text-ink md:text-[32px]">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-12 md:mt-16">
            <Suspense fallback={<div aria-hidden="true" className="h-[480px] rounded-[2px] bg-surface/50" />}>
              <CompanyRows searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* 04 Evidence counters */}
      <section aria-labelledby="counts-title" className={`${SECTION} bg-bg-alt`}>
        <SectionHead n={4} label="The evidence so far" />
        <div className="container-page">
          <h2 id="counts-title" data-split className={`mt-16 md:mt-24 ${H2}`}>
            Counted, not guessed.
          </h2>
          <Suspense fallback={<div aria-hidden="true" className="mt-16 h-[300px]" />}>
            <EvidenceCounts />
          </Suspense>
        </div>
      </section>

      {/* 05 FAQ */}
      <section aria-labelledby="faq-title" className={SECTION}>
        <Guides />
        <SectionHead n={5} label="The rules" />
        <div className={`relative mt-16 gap-y-12 container-page md:mt-24 ${GRID}`}>
          <h2 id="faq-title" data-split className={`col-span-4 md:col-span-5 ${H2}`}>
            How the stamps work
          </h2>
          <div className="col-span-4 md:col-span-6 md:col-start-7">
            <Faq title="The rule, in one line">
              <p>
                Count the verified experiences for the company that mention the topic. Half or more is <span className="text-ink">supported</span>. Fifteen percent or less is{" "}
                <span className="text-ink">not supported</span>. In between is <span className="text-ink">mixed</span>.
              </p>
              <div className="mt-4">
                <RuleLab />
              </div>
            </Faq>
            <Faq title="What &ldquo;low sample&rdquo; means">
              <p>Fewer than three verified experiences. The stamp still follows the rule, but one experience can swing it, so read it with care.</p>
            </Faq>
            <Faq title="Who verifies experiences">
              <p>
                A project admin checks each submission before it counts. Unverified tips stay labelled as rumours and never count. This is a student project, not run by the LPU placement cell.
              </p>
            </Faq>
          </div>
        </div>
      </section>

      {/* 06 CTA */}
      <section aria-labelledby="cta-title" className={SECTION}>
        <Guides />
        <SectionHead n={6} label="Verified, not heard · Share your rounds" />
        <div className={`relative mt-16 gap-y-12 container-page md:mt-24 lg:items-end ${GRID}`}>
          <h2 id="cta-title" data-split className={`col-span-4 md:col-span-12 lg:col-span-7 ${H2}`}>
            Start from evidence. Then add yours.
          </h2>
          <div className="col-span-4 grid gap-6 md:col-span-8 lg:col-span-4 lg:col-start-9">
            <p className="max-w-[40ch] type-body text-ink-2">
              Heard something else? Check one company and up to five topics against the same evidence. Placed already? Add what your rounds asked; once verified, it feeds every junior&rsquo;s plan.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Suspense fallback={<PillLink href="/login?mode=signup" variant="primary">Get started</PillLink>}>
                <GetStarted />
              </Suspense>
              <PillLink href="/experiences/new">Share your rounds</PillLink>
            </div>
            <ArrowLink href="/rumour-check">Open rumour check</ArrowLink>
          </div>
        </div>
      </section>
    </main>
  );
}

const STEPS = [
  { title: "Official drive", body: "Start from the drive the placement cell posted: date, CGPA cut-off, backlogs and rounds.", href: "/drives", link: "See drives" },
  {
    title: "Verified experiences",
    body: "Seniors add what each round asked. A project admin verifies it before it counts toward any stamp.",
    href: "/experiences",
    link: "Read experiences",
  },
  { title: "Your plan", body: "The two combine into a checklist for that drive, weighted by what verified seniors were actually asked.", href: "/drives", link: "Generate a plan" },
];

/** One entry per company: its first drive in listDrives order (soonest open one, else the latest), plus the pick from ?company=. */
function pickCompany(drives: DriveSummary[], company: string | string[] | undefined) {
  const byCompany = new Map<string, DriveSummary>();
  const counts = new Map<string, number>();
  for (const d of drives) {
    if (!byCompany.has(d.company_id)) byCompany.set(d.company_id, d);
    counts.set(d.company_id, (counts.get(d.company_id) ?? 0) + 1);
  }
  const entries = [...byCompany.values()];
  const wanted = typeof company === "string" && isUuid(company) ? company : null;
  const selected = entries.find((d) => d.company_id === wanted) ?? entries[0];
  return { entries, counts, selected };
}

async function HeroBrief({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { company } = await searchParams;
  const { counts, selected } = pickCompany(await getDrives(), company);
  if (!selected) {
    return (
      <div className="rounded-[2px] border border-line bg-surface p-6 md:p-8">
        <p className="type-body text-ink-muted">No drives are listed right now. The company guides and verified experiences are still open.</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          <ArrowLink href="/companies">Company guides</ArrowLink>
          <ArrowLink href="/experiences">Verified experiences</ArrowLink>
        </div>
      </div>
    );
  }
  return <CompanyBrief drive={selected} moreDrives={(counts.get(selected.company_id) ?? 1) - 1} />;
}

async function CompanyRows({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { company } = await searchParams;
  const { entries, selected } = pickCompany(await getDrives(), company);
  const others = companyResearch.length - entries.length;
  return (
    <>
      {selected ? (
        <CompanyList drives={await withRoundCounts(entries)} selectedId={selected.company_id} />
      ) : (
        <p className="type-body text-ink-muted">No drives are listed right now.</p>
      )}
      <p className="mt-6 type-small text-ink-muted">
        {companyResearch.length} company guides in all.{" "}
        <Link href="/companies" className="font-medium text-ink link-draw">
          Browse {others > 0 ? `the other ${others}` : "them"}
        </Link>
      </p>
    </>
  );
}

async function EvidenceCounts() {
  const { experiences } = await getEvidence();
  const perCompany = new Map<string, number>();
  for (const e of experiences) perCompany.set(e.company, (perCompany.get(e.company) ?? 0) + 1);
  const low = [...perCompany].filter(([, n]) => n < 3).sort((a, b) => a[1] - b[1]);
  const stats = [
    {
      n: experiences.length,
      label: "Verified experiences",
      note:
        low.length > 0 ? (
          <>
            {low.slice(0, 2).map(([name, n]) => (
              <span key={name} className="block whitespace-nowrap">
                {name}: n = {n}
              </span>
            ))}
            <span className="mt-1 block">read with care</span>
          </>
        ) : perCompany.size > 0 ? (
          "n ≥ 3 for every company"
        ) : (
          "n = 0 so far"
        ),
    },
    { n: companyResearch.length, label: "Company guides", note: `n = ${perCompany.size} with verified rounds` },
    { n: RUMOURS.length, label: "Hostel rumours checked", note: "n counts verified seniors only" },
  ];
  const tilt = ["rotate-[3deg]", "-rotate-[2deg]", "rotate-[1.5deg]"];

  return (
    <>
      <dl className="mt-16 grid border-t border-line md:mt-24 md:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-col-reverse gap-6 border-b border-line py-10 md:border-b-0 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0">
            <dt className="type-label text-ink-2">{s.label}</dt>
            <dd className="flex items-start gap-5">
              <span className="font-serif text-[120px] leading-[0.85] tracking-[-0.04em] text-ink tabular-nums lg:text-[160px]">{s.n}</span>
              {/* "n" notes, stuck beside the number like a yellow sticky. */}
              <span className={`mt-2 w-[136px] shrink-0 bg-sticky p-3 font-mono text-[12px] leading-[1.45] text-object-ink paper-fibre shadow-[var(--shadow-object)] ${tilt[i]}`}>
                {s.note}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {SEED_EXPERIENCES_ARE_SAMPLE && (
        <div className="mt-6">
          <SampleTag />
        </div>
      )}
    </>
  );
}

/** Reads the session, so it streams inside <Suspense>. */
async function GetStarted() {
  const user = await getSessionUser();
  return user ? (
    <PillLink href="/dashboard" variant="primary">
      Open your dashboard
    </PillLink>
  ) : (
    <PillLink href="/login?mode=signup" variant="primary">
      Get started
    </PillLink>
  );
}

/** Full-width hairline, then the section's meta label on the first column and its index in the last. */
function SectionHead({ n, label }: { n: number; label: string }) {
  return (
    <div className="relative border-t border-line">
      <div className={`container-page pt-4 type-label text-ink-2 ${GRID}`}>
        <p className="col-span-3 md:col-span-6">{label}</p>
        <p className="col-start-4 text-right tabular-nums md:col-start-12">
          0{n} / 0{SECTIONS}
        </p>
      </div>
    </div>
  );
}

/** The 12-column hairline guides behind a section on plain paper. */
function Guides() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="h-full container-page">
        <div className="-mx-3 h-full guides" />
      </div>
    </div>
  );
}

/** A native <details> row: no client code. + turns to × when open. */
function Faq({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details data-faq className="group border-b border-line first:border-t">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-6 font-serif text-[24px] tracking-[-0.02em] text-ink md:text-[30px]">
        {title}
        <span aria-hidden="true" className="text-[32px] leading-none text-ink-2 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-6 type-body text-ink-2">{children}</div>
    </details>
  );
}
