import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { Countdown, KIND_LABEL, STATUS_LABEL } from "@/components/drives/DriveCard";
import { DriveRequirements } from "@/components/drives/DriveRequirements";
import { EligibilityBadge } from "@/components/drives/EligibilityBadge";
import { IneligibilityExplainer } from "@/components/drives/IneligibilityExplainer";
import { RoundList } from "@/components/drives/RoundList";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import { GeneratePlanButton } from "@/components/plans/GeneratePlanButton";
import { ArrowLink, BackLink, PillLink, textLink } from "@/components/ui/pill";
import { SampleTag } from "@/components/ui/status";
import { card, EmptyState, PageSection, pageMain } from "@/components/ui/surface";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getDrive as fetchDrive } from "@/lib/data/drives";
import { listMatchedExperiences } from "@/lib/data/experiences";
import { getMyPlanIdForDrive } from "@/lib/data/plans";
import { getMyProfile } from "@/lib/data/profile";
import { branchCodeMap, listBranches } from "@/lib/data/taxonomy";
import { evaluateEligibility, explainEligibility } from "@/lib/eligibility";
import { formatCgpa, formatDriveDate } from "@/lib/format";
import { breadcrumbs, jsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";
import { SEED_DRIVES_ARE_SAMPLE, SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";

// One fetch per request, shared by the metadata and the page.
const getDrive = cache(fetchDrive);

export async function generateMetadata({ params }: PageProps<"/drives/[id]">): Promise<Metadata> {
  const { id } = await params;
  const drive = await getDrive(id);
  if (!drive) return { title: "Drive not found", robots: { index: false } };
  const when = drive.drive_date ? ` on ${formatDriveDate(drive.drive_date)}` : "";
  const cgpa = drive.eligibility_cgpa != null ? `minimum CGPA ${formatCgpa(drive.eligibility_cgpa)}` : "no CGPA cut-off";
  return {
    title: `${drive.title}: eligibility and rounds`,
    description: `${drive.company.name} ${drive.role.label} drive${when}: ${cgpa}, ${drive.max_backlogs <= 0 ? "no backlogs allowed" : `up to ${drive.max_backlogs} backlogs`}, ${drive.rounds.length} rounds with topics, plus what verified seniors were asked.`,
    alternates: { canonical: `/drives/${drive.id}` },
    openGraph: { type: "article", title: drive.title, url: `/drives/${drive.id}` },
  };
}

export default function DrivePage({ params }: PageProps<"/drives/[id]">) {
  return (
    <main className={pageMain}>
      <BackLink href="/drives">All drives</BackLink>
      <Suspense fallback={<DriveFallback />}>
        <DriveDetailView params={params} />
      </Suspense>
    </main>
  );
}

function DriveFallback() {
  return (
    <div role="status" aria-label="Loading drive" className="pt-8 md:pt-10">
      <div aria-hidden="true" className="h-3 w-40 rounded-full bg-panel" />
      <div aria-hidden="true" className="mt-5 h-12 w-3/4 max-w-[640px] rounded-lg bg-panel" />
      <div aria-hidden="true" className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-14">
        <div className={cn(card, "h-[420px]")} />
        <div className={cn(card, "h-[420px]")} />
      </div>
    </div>
  );
}

async function DriveDetailView({ params }: Pick<PageProps<"/drives/[id]">, "params">) {
  const { id } = await params;
  const drive = await getDrive(id);
  if (!drive) notFound();

  const user = await getSessionUser();
  const [profile, branches, matched, planId] = await Promise.all([
    getMyProfile(),
    listBranches(),
    listMatchedExperiences(drive.company_id, drive.role_id),
    user ? getMyPlanIdForDrive(user.id, drive.id) : null,
  ]);
  const codes = branchCodeMap(branches);
  const isPublic = drive.source_kind === "public_hiring";
  const eligibility = profile && !isPublic ? evaluateEligibility(profile, drive, codes) : null;
  const signIn = `/login?next=/drives/${drive.id}`;
  const open = drive.status === "upcoming" || drive.status === "ongoing";
  const now = new Date();

  return (
    <div className="pb-16 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbs([
              ["Home", absoluteUrl("/")],
              ["Drives", absoluteUrl("/drives")],
              [drive.title, absoluteUrl(`/drives/${drive.id}`)],
            ]),
          ),
        }}
      />
      <header className="pt-8 pb-10 md:pt-10 md:pb-14">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="type-label text-ink-muted">{drive.company.name}</span>
          <span className="type-label text-ink-dim">{STATUS_LABEL[drive.status]}</span>
          {isPublic ? <span className="type-label text-ink-dim">{KIND_LABEL.public_hiring}</span> : SEED_DRIVES_ARE_SAMPLE && <SampleTag />}
        </div>
        <h1 className="mt-5 max-w-[22ch] type-section text-balance text-ink">{drive.title}</h1>
        <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 type-body text-ink-muted">
          <span className="text-ink">{drive.role.label}</span>
          <span aria-hidden="true">·</span>
          {isPublic ? (
            drive.application_deadline ? (
              <span>
                Apply by{" "}
                <time dateTime={drive.application_deadline} className="type-data text-ink">
                  {formatDriveDate(drive.application_deadline)}
                </time>
              </span>
            ) : (
              <span>No deadline on the official page</span>
            )
          ) : drive.drive_date ? (
            <span>
              <time dateTime={drive.drive_date} className="type-data text-ink">
                {formatDriveDate(drive.drive_date)}
              </time>
              {open && (
                <span className="ml-2 type-small text-ink-dim">
                  <Countdown date={drive.drive_date} now={now} />
                </span>
              )}
            </span>
          ) : (
            <span>Date to be announced</span>
          )}
          {drive.location && (
            <>
              <span aria-hidden="true">·</span>
              <span>{drive.location}</span>
            </>
          )}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
        <aside className="grid gap-4 lg:sticky lg:top-24 lg:order-2">
          {isPublic && (
            <section aria-labelledby="official-source" className={cn(card, "p-5 md:p-6")}>
              <h2 id="official-source" className="type-title text-ink">
                Official source
              </h2>
              <p className="mt-2 type-small text-ink-muted">
                This is a public hiring listing, not a confirmed LPU campus drive. Rules come from the employer&rsquo;s page, read on{" "}
                {drive.verified_on ? <time dateTime={drive.verified_on}>{formatDriveDate(drive.verified_on)}</time> : "an earlier date"}. Pages change: confirm there before you apply.
              </p>
              {drive.eligibility_note && <p className="mt-4 type-small text-ink">{drive.eligibility_note}</p>}
              {drive.deadline_note && <p className="mt-3 type-small text-ink-muted">{drive.deadline_note}</p>}
              <div className="mt-5 grid gap-3">
                {drive.apply_url && (
                  <a href={drive.apply_url} target="_blank" rel="noopener noreferrer" className={textLink}>
                    Open the employer listing
                  </a>
                )}
                {drive.source_url && drive.source_url !== drive.apply_url && (
                  <a href={drive.source_url} target="_blank" rel="noopener noreferrer" className={textLink}>
                    Source page
                  </a>
                )}
              </div>
            </section>
          )}
          {!isPublic && (
          <section aria-labelledby="requirements" className={cn(card, "p-5 md:p-6")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="requirements" className="type-title text-ink">
                Requirements
              </h2>
              <EligibilityBadge eligibility={eligibility} />
            </div>
            <div className="mt-5">
              <DriveRequirements drive={drive} branchCodes={codes} eligibility={eligibility} />
            </div>
            <div className="mt-5 border-t border-line pt-5">
              {eligibility ? (
                eligibility.eligible ? (
                  <p className="type-small text-ink-muted">Your profile meets every requirement for this drive.</p>
                ) : (
                  <IneligibilityExplainer explanations={explainEligibility(eligibility)} headingLevel="h3" />
                )
              ) : (
                <p className="type-small text-ink-muted">
                  <Link href={signIn} className={textLink}>
                    Sign in
                  </Link>{" "}
                  to check your eligibility.
                </p>
              )}
            </div>
          </section>
          )}

          <section aria-labelledby="prep-plan" className={cn(card, "p-5 md:p-6")}>
            <h2 id="prep-plan" className="type-title text-ink">
              Prep plan
            </h2>
            <p className="mt-2 type-small text-ink-muted">
              A week-by-week checklist up to the drive date, weighted by what verified seniors were asked.
            </p>
            <div className="mt-5">
              {user ? (
                <div className="grid gap-4">
                  {planId && <ArrowLink href={`/dashboard/plans/${planId}`}>Open your prep plan</ArrowLink>}
                  <GeneratePlanButton driveId={drive.id} existing={!!planId} />
                </div>
              ) : (
                <p className="type-small text-ink-muted">
                  <Link href={signIn} className={textLink}>
                    Sign in
                  </Link>{" "}
                  to generate a prep plan for this drive.
                </p>
              )}
            </div>
          </section>
        </aside>

        <div className="min-w-0 lg:order-1">
          <PageSection id="rounds" title="Rounds" className="border-t-0 pt-0 md:pt-0">
            <RoundList rounds={drive.rounds} />
          </PageSection>

          <PageSection
            id="experiences"
            title="Verified experiences"
            aside={matched.experiences.length > 0 && SEED_EXPERIENCES_ARE_SAMPLE ? <SampleTag /> : null}
            className="pb-0 md:pb-0"
          >
            {matched.experiences.length === 0 ? (
              <EmptyState
                title={`No verified experiences for ${drive.company.name} yet.`}
                action={<PillLink href="/experiences/new">Share yours</PillLink>}
              >
                Placed at {drive.company.name}? Your write-up counts once a project admin verifies it.
              </EmptyState>
            ) : (
              <>
                {matched.scope === "company" && (
                  <p className="mb-4 type-small text-ink-muted">None for this role yet; showing other {drive.company.name} roles.</p>
                )}
                <ul className="grid gap-4 md:grid-cols-2">
                  {matched.experiences.map((e) => (
                    <li key={e.id}>
                      <ExperienceCard experience={e} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </PageSection>
        </div>
      </div>
    </div>
  );
}
