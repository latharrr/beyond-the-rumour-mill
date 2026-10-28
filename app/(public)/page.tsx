import Link from "next/link";
import { CompanyCards } from "@/components/research/CompanyCards";
import { companyResearch } from "@/lib/company-research";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimBar } from "@/components/landing/ClaimBar";
import { ClaimBarFallback } from "@/components/landing/ClaimBarFallback";
import { CLAIM_ANCHOR } from "@/components/landing/anchors";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { DrivesSection, DrivesSectionFallback } from "@/components/landing/DrivesSection";
import { ExperienceSection, ExperienceSectionFallback } from "@/components/landing/ExperienceSection";
import { HeroStage } from "@/components/landing/HeroStage";
import { IntegrationStrip, IntegrationStripFallback } from "@/components/landing/IntegrationStrip";
import { PlanSection, PlanSectionFallback } from "@/components/landing/PlanSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { listClaimExamples } from "@/lib/data/claims";
import { listCompanies, listTopics } from "@/lib/data/taxonomy";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function LandingPage() {
  return (
    <main>
      <HeroStage>
        <h1 id="hero-title" className="type-hero text-ink">
          <span className="block overflow-hidden pb-[0.04em]">
            <span data-reveal="line" className="block">
              Heard it said?
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.04em]">
            <span data-reveal="line" className="block">
              See it counted.
            </span>
          </span>
        </h1>
        {/* Not animated: it is the page's LCP element, so it paints with the first frame. */}
        <p className="mt-6 max-w-[38ch] type-body text-ink md:mt-7 md:max-w-none">
          Check what you&rsquo;ve heard against what verified seniors were actually asked.
        </p>
        <div id={CLAIM_ANCHOR} data-reveal="rise" className="mt-9 w-full md:mt-10">
          <Suspense fallback={<ClaimBarFallback />}>
            <HeroClaim />
          </Suspense>
        </div>
      </HeroStage>

      <section className="container-page -mt-10 pb-12 text-center" aria-label="12 researched companies">
        <Link href="/companies" className="type-title text-amber hover:underline">Research all 12 companies: requirements, questions & opportunities</Link>
        <p className="mx-auto mt-3 max-w-[70ch] type-small text-ink-muted">The claim checker above counts verified student evidence only. The source-linked research below is separate, including historical interviews and clearly labelled public hiring status.</p>
        <ul className="mt-5 flex flex-wrap justify-center gap-2">{companyResearch.map(c => <li key={c.slug}><Link href={`/companies/${c.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 type-small text-ink hover:bg-panel">{c.name}</Link></li>)}</ul>
      </section>
      <div className="container-page"><CompanyCards compact /></div>
      <ProblemSection />
      <Suspense fallback={<DrivesSectionFallback />}>
        <DrivesSection />
      </Suspense>
      <Suspense fallback={<ExperienceSectionFallback />}>
        <ExperienceSection />
      </Suspense>
      <Suspense fallback={<PlanSectionFallback />}>
        <PlanSection />
      </Suspense>
      <Suspense fallback={<IntegrationStripFallback />}>
        <IntegrationStrip />
      </Suspense>
      <ClosingCta />
    </main>
  );
}

async function HeroClaim() {
  const [companies, topics] = await Promise.all([listCompanies(), listTopics()]);
  const examples = await listClaimExamples(companies, topics);
  return (
    <ClaimBar
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      topics={topics.map((t) => ({ id: t.id, label: t.label, category: t.category }))}
      examples={examples}
      sample={SEED_EXPERIENCES_ARE_SAMPLE}
    />
  );
}
