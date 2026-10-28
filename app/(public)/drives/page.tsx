import { CompanyCards } from "@/components/research/CompanyCards";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DRIVE_CARD, DriveCard } from "@/components/drives/DriveCard";
import { DriveFilters } from "@/components/drives/DriveFilters";
import { textLink } from "@/components/ui/pill";
import { SampleTag } from "@/components/ui/status";
import { EmptyState, Notice, PageHeader, pageMain } from "@/components/ui/surface";
import { filterDrives } from "@/lib/drive-search";
import { type DriveWithRounds, listDrives, withRoundCounts } from "@/lib/data/drives";
import { getMyProfile } from "@/lib/data/profile";
import { branchCodeMap, listBranches, listCompanies } from "@/lib/data/taxonomy";
import type { EligibilityResult } from "@/lib/eligibility";
import { isProfileComplete } from "@/lib/eligibility";
import { SEED_DRIVES_ARE_SAMPLE } from "@/lib/sample-data";
import { driveFiltersSchema } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Placement drives: eligibility rules and rounds",
  description:
    "Every campus placement drive with its CGPA cut-off, branches, backlog rule, batches, date and rounds. Sign in to see which drives you are eligible for and why.",
  alternates: { canonical: "/drives" },
};

const GRID = "grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3";

export default function DrivesPage({ searchParams }: PageProps<"/drives">) {
  return (
    <main className={pageMain}>
      <PageHeader
        label="Campus drives & public opportunities"
        title="Drives"
        lede="Browse source-linked public opportunities below. Campus drives are a separate lane; only explicitly published campus rules are checked against your profile."
      />
      <Suspense fallback={<DriveResultsFallback />}>
        <DriveResults searchParams={searchParams} />
      </Suspense>
      <CompanyCards compact />
    </main>
  );
}

function DriveResultsFallback() {
  return (
    <div role="status" aria-label="Loading drives">
      <div aria-hidden="true" className="h-[196px] rounded-[var(--radius-card)] border border-line bg-panel lg:h-[106px]" />
      <ul aria-hidden="true" className={`mt-10 ${GRID}`}>
        {[0, 1, 2].map((i) => (
          <li key={i} className={DRIVE_CARD}>
            <span className="h-3 w-16 rounded-full bg-panel-2" />
            <span className="mt-5 h-5 w-4/5 rounded-full bg-panel-2" />
            <span className="mt-3 h-4 w-1/2 rounded-full bg-panel-2" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type Match = { drive: DriveWithRounds; eligibility: EligibilityResult | null };

async function DriveResults({ searchParams }: Pick<PageProps<"/drives">, "searchParams">) {
  const filters = driveFiltersSchema.parse(await searchParams);
  const [drives, companies, branches, profile] = await Promise.all([
    listDrives().then(withRoundCounts),
    listCompanies(),
    listBranches(),
    getMyProfile(),
  ]);
  const matches = filterDrives(drives, filters, profile, branchCodeMap(branches));
  const now = new Date();
  const isUnconfirmed = (m: Match) => m.drive.source_kind === "public_hiring" && m.drive.application_status === "unconfirmed";
  const open = matches.filter((m) => (m.drive.status === "upcoming" || m.drive.status === "ongoing") && !isUnconfirmed(m));
  const watch = matches.filter((m) => (m.drive.status === "upcoming" || m.drive.status === "ongoing") && isUnconfirmed(m));
  const past = matches.filter((m) => m.drive.status === "completed" || m.drive.status === "cancelled");

  return (
    <>
      <DriveFilters companies={companies} filters={filters} signedIn={!!profile} />

      {profile && !isProfileComplete(profile) && (
        <Notice className="mt-4">
          <span>
            <Link href="/onboarding?next=/drives?eligibleOnly=1" className={textLink}>
              Complete your profile
            </Link>{" "}
            to see which drives you&rsquo;re eligible for.
          </span>
        </Notice>
      )}
      {!profile && filters.eligibleOnly && (
        <Notice className="mt-4">
          <span>
            <Link href="/login?next=/drives?eligibleOnly=1" className={textLink}>
              Sign in
            </Link>{" "}
            to filter drives by your eligibility.
          </span>
        </Notice>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 md:mt-12">
        <p className="type-small text-ink-muted" aria-live="polite">
          <span className="type-data text-ink">
            {matches.length} of {drives.length}
          </span>{" "}
          drives
        </p>
        {SEED_DRIVES_ARE_SAMPLE && drives.some((d) => d.source_kind !== "public_hiring") && <SampleTag />}
      </div>

      {matches.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={drives.length === 0 ? "No drives have been published yet." : "No drives match these filters."}>
            {drives.length === 0
              ? "Drives appear here with their eligibility rules and rounds when a project admin publishes a campus announcement."
              : "Try a shorter search, another company, or clear the filters."}
          </EmptyState>
        </div>
      ) : (
        <>
          <DriveGroup id="open-drives" title="Open" matches={open} now={now} />
          <DriveGroup id="watch-drives" title="Programs to watch (application status unconfirmed)" matches={watch} now={now} />
          <DriveGroup id="past-drives" title="Past" matches={past} now={now} />
        </>
      )}
    </>
  );
}

function DriveGroup({ id, title, matches, now }: { id: string; title: string; matches: Match[]; now: Date }) {
  if (matches.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-6 first-of-type:mt-4">
      <h2 id={id} className="type-label text-ink-dim">
        {title} <span className="type-data">({matches.length})</span>
      </h2>
      <ul className={`mt-3 ${GRID}`}>
        {matches.map(({ drive, eligibility }) => (
          <li key={drive.id}>
            <DriveCard drive={drive} now={now} eligibility={eligibility} />
          </li>
        ))}
      </ul>
    </section>
  );
}
