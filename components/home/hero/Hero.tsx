import { Suspense } from "react";
import { CompanySearch, type SearchCompany } from "@/components/home/hero/CompanySearch";
import { Desk, type DeskBrief } from "@/components/home/hero/Desk";
import type { DeskRumour } from "@/components/home/hero/StickyNote";
import { TicketStrip } from "@/components/home/hero/TicketStrip";
import { checkRumours, RUMOURS } from "@/components/rumour/RumourRegister";
import { Strike } from "@/components/ui/marks";
import type { listVerifiedExperiences } from "@/lib/experiences/data";
import { formatCgpa, formatDriveDate } from "@/lib/format";
import { companyResearch } from "@/lib/placement/company-research";
import { withRoundCounts, type DriveSummary } from "@/lib/placement/data";

type Drives = Promise<DriveSummary[]>;
type Evidence = ReturnType<typeof listVerifiedExperiences>;

const META = "font-mono text-[12px] tracking-[0.1em] text-ink-2 uppercase";
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * The first viewport: headline, company search and a live desk of stamped
 * rumours, with upcoming drives along the fold. Exactly one screen tall from
 * 768px up. The text is static (it is the LCP); everything that reads data
 * streams in behind same-size fallbacks, so nothing shifts.
 */
export function Hero({ drives, evidence }: { drives: Drives; evidence: Evidence }) {
  return (
    <section data-hero aria-labelledby="hero-title" className="relative flex flex-col md:h-[calc(100svh-var(--nav-h-md))] md:min-h-[600px]">
      <div className="container-page grid min-h-0 flex-1 grid-cols-4 content-start gap-x-6 pt-8 pb-10 [--h1:clamp(44px,12.4vw,56px)] md:grid-cols-12 md:grid-rows-[auto_minmax(0,1fr)] md:py-8 md:[--h1:clamp(56px,7.4vw,104px)]">
        <div className="col-span-4 md:col-span-12">
          <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${META} motion-safe:hero-fade`}>
            <span className="inline-flex items-center gap-2 text-ink">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-ok opacity-60 motion-safe:animate-ping" />
                <span className="relative size-2 rounded-full bg-ok" />
              </span>
              <Suspense fallback={<span>Drives on file</span>}>
                <DriveCount drives={drives} />
              </Suspense>
            </span>
            <span aria-hidden="true" className="max-md:hidden">
              ·
            </span>
            <span>Placement prep · from verified evidence</span>
          </p>

          <h1 id="hero-title" className="mt-6 font-serif text-[length:var(--h1)] leading-[0.95] tracking-[-0.02em] text-ink md:mt-7">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block motion-safe:line-up [--d:0.1s]">Prepare from evidence,</span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <span className="block motion-safe:line-up [--d:0.19s]">
                not{" "}
                <span className="relative inline-block font-hand text-[1.18em] leading-[0.8] tracking-normal whitespace-nowrap text-ink-2">
                  hostel rumours
                  <Strike className="top-[0.4em] left-[-0.04em] h-[0.2em] w-[calc(100%+0.08em)]" />
                </span>
                .
              </span>
            </span>
          </h1>
        </div>

        <div className="col-span-4 md:col-span-6 md:row-start-2 md:self-center">
          <p className="mt-6 max-w-[44ch] text-[18px] md:mt-[clamp(20px,3.5svh,40px)] leading-[1.5] text-pretty text-ink-2 motion-safe:hero-up [--d:0.3s]">
            Pick a company. See its drive, what verified seniors were asked, and what to do next.
          </p>

          <div className="mt-8 max-w-[560px] motion-safe:hero-up [--d:0.45s] md:mt-[clamp(24px,4.5svh,48px)]">
            <Suspense fallback={<CompanySearch companies={guides()} />}>
              <Search drives={drives} />
            </Suspense>
          </div>

          <p className={`mt-5 ${META} normal-case motion-safe:hero-fade [--d:0.6s]`}>
            <Suspense fallback={<span>Verified experiences · {RUMOURS.length} rumours checked · low sample shown, never hidden</span>}>
              <TrustLine evidence={evidence} />
            </Suspense>
          </p>
        </div>

        {/* From tablet up the desk starts beside the headline's second line and fills down to the drive strip. */}
        <div className="relative col-span-4 mt-12 h-[440px] md:col-span-5 md:col-start-8 md:row-start-2 md:-mt-[calc(var(--h1)*1.07)] md:h-[calc(100%+var(--h1)*1.07)]">
          <Suspense fallback={null}>
            <HeroDesk drives={drives} evidence={evidence} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<div aria-hidden="true" className="h-[46px] border-y border-line bg-surface" />}>
        <TicketStrip drives={drives} />
      </Suspense>
    </section>
  );
}

async function DriveCount({ drives }: { drives: Drives }) {
  const n = (await drives).length;
  return (
    <span>
      {n} drive{n === 1 ? "" : "s"} on file
    </span>
  );
}

async function TrustLine({ evidence }: { evidence: Evidence }) {
  const n = (await evidence).experiences.length;
  return (
    <span>
      {n} verified experience{n === 1 ? "" : "s"} · {RUMOURS.length} rumours checked · low sample shown, never hidden
    </span>
  );
}

/** Every company guide, pointing at its guide. Used until the drives load. */
function guides(): SearchCompany[] {
  return companyResearch.map((c) => ({ name: c.name, href: `/companies/${c.slug}`, hint: "Company guide" }));
}

/** Companies with a drive open their prep brief (where the plan starts); the rest open their guide. */
async function Search({ drives }: { drives: Drives }) {
  const list = await drives;
  const companies = guides().map((g) => {
    const d = list.find((x) => x.company.name === g.name);
    return d ? { name: g.name, href: `/?company=${d.company_id}#brief`, hint: d.drive_date ? `Drive ${DAY_MONTH.format(new Date(`${d.drive_date}T00:00:00Z`))}` : "Drive on file" } : g;
  });
  return <CompanySearch companies={companies} />;
}

async function HeroDesk({ drives, evidence }: { drives: Drives; evidence: Evidence }) {
  const [checked, list] = await Promise.all([checkRumours(evidence), drives]);
  const rumours: DeskRumour[] = checked.map((r) => ({
    company: r.company,
    topic: r.topic,
    quote: r.quote,
    verdict: r.result.verdict,
    cites: r.result.cites.length,
    total: r.result.total,
    href: r.href,
  }));
  // Dealt in hands of three.
  const sets = Array.from({ length: Math.ceil(rumours.length / 3) }, (_, i) => rumours.slice(i * 3, i * 3 + 3));

  const next = list[0];
  const [withRounds] = next ? await withRoundCounts([next]) : [];
  const brief: DeskBrief | null = next
    ? {
        company: next.company.name,
        role: next.role.label,
        date: next.drive_date ? formatDriveDate(next.drive_date) : "TBA",
        cgpa: next.eligibility_cgpa != null ? `${formatCgpa(next.eligibility_cgpa)}+` : "None",
        backlogs: next.max_backlogs <= 0 ? "None" : `Up to ${next.max_backlogs}`,
        rounds: withRounds ? String(withRounds.round_count) : "–",
      }
    : null;
  return <Desk sets={sets} brief={brief} />;
}
