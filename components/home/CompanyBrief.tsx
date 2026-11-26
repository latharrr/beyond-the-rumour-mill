import Link from "next/link";
import { GeneratePlanButton } from "@/components/plans/GeneratePlanButton";
import { ArrowLink, PillLink } from "@/components/ui/pill";
import { VERDICT_TONE } from "@/components/rumour/VerdictCard";
import { Citations, RUMOURS } from "@/components/rumour/RumourRegister";
import { SampleTag, StatusPill } from "@/components/ui/status";
import { Countdown } from "@/components/drives/DriveCard";
import { getSessionUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatCgpa, formatDriveDate } from "@/lib/format";
import { checkClaimVerdict } from "@/lib/experiences/rumour";
import { listVerifiedExperiences } from "@/lib/experiences/data";
import { companyResearch } from "@/lib/placement/company-research";
import { withRoundCounts, type DriveSummary, type DriveWithRounds } from "@/lib/placement/data";
import { getMyPlanIdForDrive } from "@/lib/preparation/data";
import { SEED_DRIVES_ARE_SAMPLE, SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { listTopics } from "@/lib/taxonomy";

/**
 * The company list as white ticket stubs: a perforated left edge and a punched
 * hole (ticket-cut), name and facts, then a dashed tear line before the drive
 * date in mono. Hover lifts the ticket 6px; nothing else moves.
 */
export function CompanyList({ drives, selectedId }: { drives: DriveWithRounds[]; selectedId: string }) {
  const now = new Date();
  return (
    <ul className="grid gap-4">
      {drives.map((d) => {
        const open = d.status === "upcoming" || d.status === "ongoing";
        const on = d.company_id === selectedId;
        return (
          // The mask clips box-shadows, so the ticket's shadow is a drop-shadow on its wrapper.
          <li
            key={d.company_id}
            className="[filter:drop-shadow(0_1px_1px_rgb(0_0_0/0.08))_drop-shadow(0_10px_12px_rgb(0_0_0/0.09))] transition-transform duration-200 ease-[var(--ease-out-3)] hover:-translate-y-1.5 has-[:focus-visible]:-translate-y-1.5"
          >
            <Link
              href={`/?company=${d.company_id}#brief`}
              aria-current={on ? "true" : undefined}
              className={cn("grid grid-cols-[minmax(0,1fr)_auto] bg-surface ticket-cut", on && "ring-1 ring-ink ring-inset")}
            >
              <div className="grid min-w-0 gap-2 py-5 pr-5 pl-14 md:py-6 md:pr-7 md:pl-16">
                <span className="flex items-center gap-3 font-serif text-[28px] leading-none tracking-[-0.03em] text-ink md:text-[40px]">
                  {d.company.name}
                  {on && <span className="type-label text-accent">Selected</span>}
                </span>
                <dl className="flex flex-wrap gap-x-6 gap-y-1 type-small text-ink-2">
                  <Inline label="CGPA" value={d.eligibility_cgpa != null ? `${formatCgpa(d.eligibility_cgpa)}+` : "No cut-off"} />
                  <Inline label="Backlogs" value={d.max_backlogs <= 0 ? "None" : `Up to ${d.max_backlogs}`} />
                  <Inline label="Rounds" value={String(d.round_count)} />
                  <Inline label="Role" value={d.role.label} />
                </dl>
              </div>
              <div className="flex min-w-[124px] flex-col items-end justify-center gap-2 border-l border-dashed border-line px-4 py-5 md:min-w-[176px] md:px-7">
                <span className="font-mono text-[13px] tracking-[0.06em] text-ink uppercase">{d.drive_date ? formatDriveDate(d.drive_date) : "Date TBA"}</span>
                <span className={cn("type-label", open ? "text-ok" : d.status === "cancelled" ? "text-no" : "text-ink-2")}>
                  <span>{open && d.drive_date ? <Countdown date={d.drive_date} now={now} /> : open ? "Open" : d.status === "cancelled" ? "Cancelled" : "Completed"}</span>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Inline({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="type-label text-ink-dim">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

/** The prep brief for one company: its drive, what verified experiences mention, one hostel rumour, one next step. */
export async function CompanyBrief({ drive, moreDrives }: { drive: DriveSummary; moreDrives: number }) {
  const companyId = drive.company_id;
  const open = drive.status === "upcoming" || drive.status === "ongoing";
  const [user, topics, { experiences, frequency }, [withRounds]] = await Promise.all([getSessionUser(), listTopics(), listVerifiedExperiences({ companyId }), withRoundCounts([drive])]);
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
    <article aria-label={`${drive.company.name} prep brief`} className="relative min-w-0 rounded-[2px] border border-line bg-surface shadow-[var(--shadow-object)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-3 md:px-8">
        <span className="type-label text-ink">Prep brief</span>
        {SEED_DRIVES_ARE_SAMPLE && <SampleTag />}
      </div>
      {/* Stamped across the top edge. Only a brief backed by verified experiences gets it. */}
      {total > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-4 right-5 -rotate-[6deg] rounded-[3px] border-[3px] border-current bg-surface px-3 py-1 stamp-ink font-mono text-[18px] leading-none font-bold tracking-[0.1em] text-accent uppercase md:right-8"
        >
          Verified
        </span>
      )}
      <div className="p-6 md:p-8">
        <p className="type-label text-ink-2">
          {drive.role.label}
          {drive.location ? ` · ${drive.location}` : ""}
        </p>
        <h2 className="mt-2 font-serif text-[48px] leading-none tracking-[-0.03em] text-ink">{drive.company.name}</h2>

        <dl className="mt-6 grid grid-cols-2 border-t border-l border-line sm:grid-cols-4">
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
                    <span className="font-serif text-[20px] tracking-[-0.01em] text-ink">{t.label}</span>
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
              Heard in the hostel, checked by mentions
            </h3>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-serif text-[19px] text-ink italic">&ldquo;{rumour.quote}&rdquo;</p>
              <StatusPill tone={VERDICT_TONE[rumourResult.verdict]}>{rumourResult.verdict}</StatusPill>
            </div>
            <p className="mt-2 type-small text-ink-muted">
              {rumourResult.total === 0
                ? "No verified experiences to check it against."
                : `${rumourResult.cites.length} of ${rumourResult.total} verified experience${rumourResult.total === 1 ? "" : "s"} mention${rumourResult.total === 1 ? "s" : ""} ${rumour.topic}.`}
              <Citations ids={rumourResult.cites} />
              {rumourResult.lowSample && rumourResult.total > 0 ? ` Low sample (n = ${rumourResult.total}).` : ""} The check counts mentions: it shows the topic came up, not that it makes up most of
              the interview.{" "}
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
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-b border-line px-3 py-2.5">
      <dt className="type-label text-ink-2">{label}</dt>
      <dd className="mt-1.5 font-serif text-[22px] leading-tight text-ink">{value}</dd>
    </div>
  );
}

/** The brief's frame with grey bars where the data goes, shown while the drive loads. Same size, so nothing shifts. */
export function BriefSkeleton() {
  const bar = "rounded-[2px] bg-bg-alt motion-safe:animate-pulse";
  return (
    <div role="status" aria-label="Loading the prep brief" className="min-h-[600px] rounded-[2px] border border-line bg-surface shadow-[var(--shadow-object)]">
      <div className="border-b border-line px-6 py-3 md:px-8">
        <span className="type-label text-ink">Prep brief</span>
      </div>
      <div className="p-6 md:p-8">
        <div className={cn(bar, "h-3 w-40")} />
        <div className={cn(bar, "mt-3 h-11 w-56")} />
        <div className="mt-6 grid grid-cols-2 border-t border-l border-line sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-2 border-r border-b border-line px-3 py-2.5">
              <div className={cn(bar, "h-3 w-14")} />
              <div className={cn(bar, "h-6 w-20")} />
            </div>
          ))}
        </div>
        <div className={cn(bar, "mt-6 h-3 w-52")} />
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(bar, "mt-3 h-6 w-full")} />
        ))}
        <div className={cn(bar, "mt-8 h-12 w-56 rounded-full")} />
      </div>
    </div>
  );
}
