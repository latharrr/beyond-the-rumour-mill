import { CompanyCards } from "@/components/research/CompanyCards";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CommunityTipsLane } from "@/components/experiences/CommunityTipsLane";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import { TopicFrequencyBars } from "@/components/experiences/TopicFrequencyBars";
import { PillLink } from "@/components/ui/pill";
import { SampleTag } from "@/components/ui/status";
import { card, EmptyState, PageHeader, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { isUuid } from "@/lib/data/drives";
import { listCommunityTips, listVerifiedExperiences } from "@/lib/data/experiences";
import { type Company, listCompanies } from "@/lib/data/taxonomy";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Verified interview experiences",
  description:
    "What placed seniors were actually asked, round by round, with a TrustScore for each write-up and the most-asked topics per company. Unverified tips are labelled as rumours.",
  alternates: { canonical: "/experiences" },
};

// §3.2: verified experiences (with TrustScore) and the quarantined
// community-tips lane, visually separate sections.
export default function ExperiencesPage({ searchParams }: PageProps<"/experiences">) {
  return (
    <main className={pageMain}>
      <PageHeader
        label="Senior experiences"
        title="Experiences"
        lede="What placed seniors were asked, round by round. Only experiences a project admin has verified are counted; everything else waits below as a rumour."
        actions={<PillLink href="/experiences/new" variant="primary">Share your experience</PillLink>}
      />
      <Suspense fallback={<ExperiencesFallback />}>
        <Experiences searchParams={searchParams} />
      </Suspense>
      <CompanyCards compact />
    </main>
  );
}

function ExperiencesFallback() {
  return (
    <div role="status" aria-label="Loading experiences" className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div aria-hidden="true" className={cn(card, "h-[420px]")} />
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(card, "h-[220px]")} />
        ))}
      </div>
    </div>
  );
}

async function Experiences({ searchParams }: Pick<PageProps<"/experiences">, "searchParams">) {
  const { company } = await searchParams;
  const companyId = typeof company === "string" && isUuid(company) ? company : undefined;
  const [{ experiences, frequency }, tips, companies] = await Promise.all([
    listVerifiedExperiences({ companyId }),
    listCommunityTips({ companyId }),
    listCompanies(),
  ]);
  const companyName = companies.find((c) => c.id === companyId)?.name;
  const total = experiences.length;

  return (
    <>
      <CompanyFilter companies={companies} current={companyId} />

      <div className="mt-8 grid gap-8 pb-16 md:mt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10 lg:pb-24">
        <section aria-labelledby="topic-frequency" className={cn(card, "p-5 md:p-6 lg:sticky lg:top-24")}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id="topic-frequency" className="type-title text-ink">
              What gets asked
            </h2>
            {total > 0 && SEED_EXPERIENCES_ARE_SAMPLE && <SampleTag />}
          </div>
          <p className="mt-1 type-small text-ink-muted">
            {total > 0 ? (
              <>
                Across <span className="type-data">{total}</span> verified {companyName ?? ""} experience{total === 1 ? "" : "s"}.
              </>
            ) : (
              "No verified experiences yet."
            )}
          </p>
          <div className="mt-6">
            <TopicFrequencyBars frequency={frequency} total={total} />
          </div>
        </section>

        <section aria-labelledby="verified">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 id="verified" className="type-title text-ink">
              Verified experiences
            </h2>
            {total > 0 && (
              <p className="type-small text-ink-muted">
                <span className="type-data text-ink">{total}</span> {total === 1 ? "write-up" : "write-ups"}, newest first
              </p>
            )}
          </div>
          {total === 0 ? (
            <div className="mt-5">
              <EmptyState title={`No verified experiences yet${companyName ? ` for ${companyName}` : ""}.`}>
                Placed seniors can share theirs; it counts once a project admin verifies it.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {experiences.map((e) => (
                <li key={e.id}>
                  <ExperienceCard experience={e} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CommunityTipsLane tips={tips} />
    </>
  );
}

/** Company filter as links: shareable URLs, no form, works without JS. */
function CompanyFilter({ companies, current }: { companies: Company[]; current?: string }) {
  const chip = (active: boolean) =>
    cn(
      "hit-44 inline-flex h-9 items-center rounded-full border px-4 text-[14px] transition-colors duration-200",
      active ? "border-white/16 bg-panel-2 text-ink" : "border-line text-ink-muted hover:bg-panel hover:text-ink",
    );
  return (
    <nav aria-label="Filter by company">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/experiences" aria-current={!current ? "page" : undefined} className={chip(!current)}>
            All companies
          </Link>
        </li>
        {companies.map((c) => (
          <li key={c.id}>
            <Link href={`/experiences?company=${c.id}`} aria-current={current === c.id ? "page" : undefined} className={chip(current === c.id)}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
