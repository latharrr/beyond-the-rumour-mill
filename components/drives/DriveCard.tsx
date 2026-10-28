import Link from "next/link";
import type { ReactNode } from "react";
import { cardInteractive, stretchedLink } from "@/components/ui/surface";
import type { DriveStatus, DriveWithRounds } from "@/lib/data/drives";
import type { EligibilityResult } from "@/lib/eligibility";
import { cn } from "@/lib/cn";
import { daysUntil, formatCgpa, formatDriveDate } from "@/lib/format";
import { EligibilityBadge } from "./EligibilityBadge";

/** Card footprint shared by the real cards and their loading placeholders. */
export const DRIVE_CARD = "relative flex min-h-[292px] flex-col rounded-[var(--radius-card)] border border-line bg-panel p-6";

export const STATUS_LABEL: Record<DriveStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const KIND_LABEL = { campus: "LPU campus drive", public_hiring: "Public hiring, not an LPU drive" } as const;

/** "In 12 days" / "Today" / "Date passed" next to a drive date. */
export function Countdown({ date, now }: { date: string; now: Date }) {
  const days = daysUntil(date, now);
  if (days === 0) return <>Today</>;
  if (days < 0) return <>Date passed</>;
  return (
    <>
      In <span className="type-data">{days}</span> day{days === 1 ? "" : "s"}
    </>
  );
}

/**
 * One drive: company and status, title (the card's link), role, date and the
 * three rules that decide most eligibility. `eligibility` adds the student's badge.
 */
export function DriveCard({
  drive: d,
  now,
  eligibility = null,
  headingLevel: H = "h3",
}: {
  drive: DriveWithRounds;
  now: Date;
  eligibility?: EligibilityResult | null;
  headingLevel?: "h2" | "h3";
}) {
  const titleId = `drive-${d.id}`;
  return (
    <article aria-labelledby={titleId} className={cn(DRIVE_CARD, cardInteractive, "group h-full")}>
      <div className="flex items-center justify-between gap-3">
        <span className="type-label text-ink-muted">{d.company.name}</span>
        <span className="type-label text-ink-dim">{STATUS_LABEL[d.status]}</span>
      </div>
      {d.source_kind === "public_hiring" && (
        <p data-kind="public_hiring" className="mt-3 type-label text-ink-dim">
          {KIND_LABEL.public_hiring}
        </p>
      )}

      <H id={titleId} className="mt-5 type-title text-ink">
        {/* The whole card is this link's hit area. */}
        <Link href={`/drives/${d.id}`} className={stretchedLink}>
          {d.title}
        </Link>
      </H>
      <p className="mt-1.5 type-small text-ink-muted">
        {d.role.label}
        {d.location && <> · {d.location}</>}
      </p>

      <p className="mt-5 flex items-baseline gap-2.5">
        {d.source_kind === "public_hiring" ? (
          d.application_deadline ? (
            <>
              <span className="type-small text-ink-muted">Apply by</span>
              <time dateTime={d.application_deadline} className="type-data text-[17px] text-ink">
                {formatDriveDate(d.application_deadline)}
              </time>
            </>
          ) : (
            <span className="type-small text-ink-muted">No deadline on the official page</span>
          )
        ) : d.drive_date ? (
          <>
            <time dateTime={d.drive_date} className="type-data text-[17px] text-ink">
              {formatDriveDate(d.drive_date)}
            </time>
            {d.status !== "completed" && d.status !== "cancelled" && (
              <span className="type-small text-ink-dim">
                <Countdown date={d.drive_date} now={now} />
              </span>
            )}
          </>
        ) : (
          <span className="type-small text-ink-muted">Date to be announced</span>
        )}
      </p>

      {eligibility && d.source_kind !== "public_hiring" && (
        <div className="mt-4">
          <EligibilityBadge eligibility={eligibility} />
        </div>
      )}

      <div className="mt-auto pt-5" />
      {d.source_kind === "public_hiring" ? (
        <p className="border-t border-line pt-4 type-small text-ink-muted">
          {d.eligibility_note ?? "Check the official listing for eligibility."}
        </p>
      ) : (
      <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4">
        <Spec label="CGPA" value={d.eligibility_cgpa === null ? "Any" : `${formatCgpa(d.eligibility_cgpa)}+`} numeric={d.eligibility_cgpa !== null} />
        <Spec
          label="Backlogs"
          value={
            d.max_backlogs <= 0 ? (
              "None"
            ) : (
              <>
                Up to <span className="type-data">{d.max_backlogs}</span>
              </>
            )
          }
        />
        <Spec label="Rounds" value={String(d.round_count)} numeric />
      </dl>
      )}
    </article>
  );
}

function Spec({ label, value, numeric = false }: { label: string; value: ReactNode; numeric?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="type-label text-ink-dim">{label}</dt>
      <dd className={cn("mt-2 text-[15px] text-ink", numeric && "type-data")}>{value}</dd>
    </div>
  );
}
