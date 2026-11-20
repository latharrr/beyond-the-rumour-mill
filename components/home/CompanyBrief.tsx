import Link from "next/link";
import { GeneratePlanButton } from "@/components/plans/GeneratePlanButton";
import { ArrowLink, PillLink } from "@/components/ui/pill";
import { VERDICT_TONE } from "@/components/rumour/VerdictCard";
import { RUMOURS } from "@/components/rumour/RumourRegister";
import { SampleTag, StatusPill } from "@/components/ui/status";
import { Countdown } from "@/components/drives/DriveCard";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatCgpa, formatDriveDate } from "@/lib/format";
import { checkClaimVerdict } from "@/lib/experiences/rumour";
import { listVerifiedExperiences } from "@/lib/experiences/data";
import { companyResearch } from "@/lib/placement/company-research";
import { withRoundCounts, type DriveSummary } from "@/lib/placement/data";
import { getMyPlanIdForDrive } from "@/lib/preparation/data";
import { SEED_DRIVES_ARE_SAMPLE, SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { listTopics } from "@/lib/taxonomy";

/** The company list: one row per company, each with its best drive (soonest open one, else the latest). */
export function CompanyList({ drives, selectedId }: { drives: DriveSummary[]; selectedId: string }) {
  const now = new Date();
  return (
    <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:gap-0 lg:overflow-visible lg:border-t lg:border-line lg:px-0 lg:pb-0">
      {drives.map((d) => {
        const open = d.status === "upcoming" || d.status === "ongoing";
        const on = d.company_id === selectedId;
        return (
          <li key={d.company_id} className="shrink-0 lg:shrink">
            <Link
              href={`/?company=${d.company_id}`}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={cn(
                "grid min-w-36 gap-1 rounded-xl border px-4 py-3 transition-colors lg:grid-cols-[1fr_auto] lg:items-baseline lg:gap-x-6 lg:rounded-none lg:border-0 lg:border-b lg:border-line lg:px-4 lg:py-4",
                on ? "border-amber bg-amber text-paper-ink" : "border-line text-ink hover:bg-panel",
              )}
            >
              <span className="font-serif text-[22px] leading-tight font-bold">{d.company.name}</span>
              <span className={cn("type-small", on ? "text-paper-ink" : "text-ink-muted")}>
                {d.drive_date ? formatDriveDate(d.drive_date) : "Date to be announced"}
                {open && d.drive_date ? (
                  <span className="block">
                    <Countdown date={d.drive_date} now={now} />
                  </span>
                ) : !open ? (
                  <span className="block">{d.status === "cancelled" ? "cancelled" : "completed"}</span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** The prep brief for one company: its drive, what verified experiences mention, one hostel rumour, one next step. */
export async function CompanyBrief({ drive, moreDrives }: { drive: DriveSummary; moreDrives: number }) {
  const companyId = drive.company_id;
  const open = drive.status === "upcoming" || drive.status === "ongoing";
  const [user, topics, { experiences, frequency }, [withRounds]] = await Promise.all([
    getSessionUser(),
    listTopics(),
    listVerifiedExperiences({ companyId }),
    withRoundCounts([drive]),
  ]);
  const planId = user && open ? await getMyPlanIdForDrive(user.id, drive.id) : null;
  const total = experiences.length;
  const guide = companyResearch.find((c) => c.name === drive.company.name);

  // A hostel rumour we already track for this company, checked by the same rule as /rumour-check.
  const rumour = RUMOURS.find((r) => r.company === drive.company.name);
  const rumourTopic = rumour && topics.find((t) => t.label === rumour.topic);
  const rumourResult =
    rumourTopic &&
    checkClaimVerdict(
      experiences.map((e) => e.id),
      experiences.filter((e) => e.topics.some((t) => t.id === rumourTopic.id)).map((e) => e.id),
    );

  return (
    <article aria-label={`${drive.company.name} prep brief`} className="relative min-w-0 rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-bar)] md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber px-3 py-1 type-label text-paper-ink">Prep brief</span>
        {SEED_DRIVES_ARE_SAMPLE && <SampleTag />}
      </div>
      <p className="mt-5 type-label text-ink-muted">
        {drive.role.label}
        {drive.location ? ` · ${drive.location}` : ""}
      </p>
      <h2 className="mt-2 font-serif text-[40px] leading-none font-bold tracking-[-0.02em] text-ink">{drive.company.name}</h2>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 sm:grid-cols-4">
        <Fact label="Date" value={drive.drive_date ? formatDriveDate(drive.drive_date) : "TBA"} />
        <Fact label="CGPA" value={drive.eligibility_cgpa != null ? `${formatCgpa(drive.eligibility_cgpa)}+` : "No cut-off"} />
        <Fact label="Backlogs" value={drive.max_backlogs <= 0 ? "None" : `Up to ${drive.max_backlogs}`} />
        <Fact label="Rounds" value={withRounds ? String(withRounds.round_count) : "-"} />
      </dl>
      {moreDrives > 0 && (
        <p className="mt-3 type-small text-ink-muted">
          Showing the {open ? "next" : "latest"} drive. {moreDrives} more for {drive.company.name} on{" "}
          <Link href="/drives" className="underline underline-offset-4">
            the drives page
          </Link>
          .
        </p>
      )}

      <section aria-labelledby="evidence-title" className="mt-6">
        <h3 id="evidence-title" className="type-label text-ink-muted">
          What verified experiences mention
        </h3>
        {total === 0 ? (
          <p className="mt-3 type-small text-ink-muted">
            No verified {drive.company.name} experiences yet, so there is nothing to weigh a topic against.{" "}
            <Link href="/experiences/new" className="underline underline-offset-4">
              Share yours
            </Link>
            {guide && (
              <>
                {" "}
                or{" "}
                <Link href={`/companies/${guide.slug}`} className="underline underline-offset-4">
                  read the {drive.company.name} guide
                </Link>
              </>
            )}
            .
          </p>
        ) : (
          <>
            <ul className="mt-3 grid gap-2">
              {frequency.slice(0, 3).map((t) => (
                <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-serif text-[20px] text-ink">{t.label}</span>
                  <span className="type-small text-ink-muted">
                    <span className="type-data text-ink">
                      {t.count} of {total}
                    </span>{" "}
                    verified experience{total === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 type-small text-ink-dim">
              {total < 3 ? `Low sample (n = ${total}), read with care. ` : ""}
              {SEED_EXPERIENCES_ARE_SAMPLE ? "Sample data." : ""}
            </p>
          </>
        )}
      </section>

      {rumour && rumourResult && rumourTopic && (
        <section aria-labelledby="rumour-title" className="mt-6 border-t border-dashed border-line pt-5">
          <h3 id="rumour-title" className="type-label text-ink-muted">
            Heard in the hostel
          </h3>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-[19px] text-ink">&ldquo;{rumour.quote}&rdquo;</p>
            <StatusPill tone={VERDICT_TONE[rumourResult.verdict]}>{rumourResult.verdict}</StatusPill>
          </div>
          <p className="mt-2 type-small text-ink-muted">
            {rumourResult.total === 0
              ? "No verified experiences to check it against."
              : `${rumourResult.cites.length} of ${rumourResult.total} verified experience${rumourResult.total === 1 ? "" : "s"} mention${rumourResult.total === 1 ? "s" : ""} ${rumour.topic}.`}
            {rumourResult.lowSample && rumourResult.total > 0 ? ` Low sample (n = ${rumourResult.total}).` : ""}{" "}
            <Link href={`/rumour-check?company_id=${companyId}&topic_id=${rumourTopic.id}`} className="font-medium text-ink underline underline-offset-4">
              See the experiences
            </Link>
          </p>
        </section>
      )}

      <div className="mt-7 border-t border-line pt-6">
        {!open ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PillLink href={`/experiences?company=${companyId}`} variant="primary">
              See {drive.company.name} experiences
            </PillLink>
            {guide && <ArrowLink href={`/companies/${guide.slug}`}>Company guide</ArrowLink>}
          </div>
        ) : !user ? (
          <div className="grid gap-3">
            <PillLink href={`/login?next=/drives/${drive.id}`} variant="primary">
              Sign in to generate my plan
            </PillLink>
            <p className="type-small text-ink-muted">
              Browsing needs no account. Signing in brings you back to this drive.{" "}
              <Link href={`/drives/${drive.id}`} className="font-medium text-ink underline underline-offset-4">
                See full requirements
              </Link>
            </p>
          </div>
        ) : planId ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PillLink href={`/dashboard/plans/${planId}`} variant="primary">
              Open your plan
            </PillLink>
            <ArrowLink href={`/drives/${drive.id}`}>Check if you qualify</ArrowLink>
          </div>
        ) : (
          <div className="grid gap-3">
            <GeneratePlanButton driveId={drive.id} existing={false} />
            <ArrowLink href={`/drives/${drive.id}`}>Check if you qualify</ArrowLink>
          </div>
        )}
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="type-label text-ink-dim">{label}</dt>
      <dd className="mt-1 font-serif text-[24px] leading-tight font-bold text-ink">{value}</dd>
    </div>
  );
}
