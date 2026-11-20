import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompanyBrief, CompanyList } from "@/components/home/CompanyBrief";
import { RuleLab } from "@/components/rumour/RuleLab";
import { ArrowLink } from "@/components/ui/pill";
import { companyResearch } from "@/lib/placement/company-research";
import { isUuid, listDrives, type DriveSummary } from "@/lib/placement/data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <main className="container-page pt-12 pb-20 md:pt-16 md:pb-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        <Suspense fallback={<div role="status" aria-label="Loading" className="h-[560px] rounded-[var(--radius-card)] border border-line bg-panel lg:col-span-2" />}>
          <HomeBrief searchParams={searchParams} />
        </Suspense>
      </div>

      <section aria-label="More about the evidence" className="mt-16 grid gap-10 border-t border-line pt-10 md:mt-24 lg:grid-cols-3">
        <div className="grid content-start">
          <Details title="The rule, in one line">
            <p>
              Count the verified experiences for the company that mention the topic. Half or more is <span className="text-ink">supported</span>.
              Fifteen percent or less is <span className="text-ink">not supported</span>. In between is <span className="text-ink">mixed</span>.
            </p>
            <div className="mt-4">
              <RuleLab />
            </div>
          </Details>
          <Details title="What &ldquo;low sample&rdquo; means">
            <p>Fewer than three verified experiences. The stamp still follows the rule, but one experience can swing it, so read it with care.</p>
          </Details>
          <Details title="Who verifies experiences">
            <p>A project admin checks each submission before it counts. Unverified tips stay labelled as rumours and never count. This is a student project, not run by the LPU placement cell.</p>
          </Details>
        </div>
        <div className="grid content-start gap-3">
          <h2 className="font-serif text-[22px] font-bold text-ink">Heard something else?</h2>
          <p className="type-small text-ink-muted">Check one company and up to five topics against the same evidence. Each topic gets its own stamp.</p>
          <ArrowLink href="/rumour-check">Open rumour check</ArrowLink>
        </div>
        <div className="grid content-start gap-3">
          <h2 className="font-serif text-[22px] font-bold text-ink">Placed already?</h2>
          <p className="type-small text-ink-muted">Add what your rounds asked. Once a project admin verifies it, it feeds every junior&rsquo;s plan for that company.</p>
          <ArrowLink href="/experiences/new">Share your experience</ArrowLink>
        </div>
      </section>
    </main>
  );
}

/** Server Component: picks the company from ?company=, then renders the list and its brief side by side. */
async function HomeBrief({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { company } = await searchParams;
  const drives = await listDrives(); // open drives first, soonest first
  if (drives.length === 0) return <NoDrives />;

  // One entry per company: its first drive in that order (soonest open one, else the latest).
  const byCompany = new Map<string, DriveSummary>();
  const counts = new Map<string, number>();
  for (const d of drives) {
    if (!byCompany.has(d.company_id)) byCompany.set(d.company_id, d);
    counts.set(d.company_id, (counts.get(d.company_id) ?? 0) + 1);
  }
  const entries = [...byCompany.values()];
  const wanted = typeof company === "string" && isUuid(company) ? company : null;
  const selected = entries.find((d) => d.company_id === wanted) ?? entries[0];
  const others = companyResearch.length - entries.length;

  return (
    <>
      <div className="min-w-0">
        <p className="type-label text-ink-muted">Placement prep, from evidence</p>
        <h1 id="hero-title" className="mt-4 font-serif text-[44px] leading-[1] font-bold tracking-[-0.035em] text-balance text-ink sm:text-[56px] lg:text-[60px]">
          Prepare from evidence, <span className="font-normal text-ink-muted italic">not hostel rumours.</span>
        </h1>
        <p className="mt-6 max-w-[40ch] type-body text-pretty text-ink-muted">Pick a company. See its drive, what verified seniors were asked, and what to do next.</p>
        <h2 className="mt-8 mb-3 type-label text-ink">Which company are you preparing for?</h2>
        <CompanyList drives={entries} selectedId={selected.company_id} />
        <p className="mt-4 type-small text-ink-muted">
          {companyResearch.length} company guides in all.{" "}
          <Link href="/companies" className="font-medium text-ink underline underline-offset-4">
            Browse {others > 0 ? `the other ${others}` : "them"}
          </Link>
        </p>
      </div>
      <CompanyBrief drive={selected} moreDrives={(counts.get(selected.company_id) ?? 1) - 1} />
    </>
  );
}

/** No drives at all: send people to what still works. */
function NoDrives() {
  return (
    <div className="lg:col-span-2">
      <h1 className="font-serif text-[44px] leading-[1] font-bold tracking-[-0.035em] text-ink sm:text-[56px]">
        Prepare from evidence, <span className="font-normal text-ink-muted italic">not hostel rumours.</span>
      </h1>
      <p className="mt-6 max-w-[46ch] type-body text-ink-muted">No drives are listed right now. The company guides and verified experiences are still open.</p>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
        <ArrowLink href="/companies">Company guides</ArrowLink>
        <ArrowLink href="/experiences">Verified experiences</ArrowLink>
      </div>
    </div>
  );
}

/** A native collapsible row: no client code. */
function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line py-4 first:border-t">
      <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-[20px] font-bold text-ink">
        {title}
        <span aria-hidden="true" className="text-ink-muted group-open:hidden">+</span>
        <span aria-hidden="true" className="hidden text-ink-muted group-open:inline">&minus;</span>
      </summary>
      <div className="mt-3 type-small text-ink-muted">{children}</div>
    </details>
  );
}
