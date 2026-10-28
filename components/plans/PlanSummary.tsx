import Link from "next/link";
import { Countdown } from "@/components/drives/DriveCard";
import { cardInteractive, stretchedLink } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { PlanSummary as PlanSummaryData } from "@/lib/data/plans";
import { formatDriveDate } from "@/lib/format";

/** A native <progress>, styled: a 6px track with an ink fill. */
export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  return (
    <progress
      value={value}
      max={max || 1}
      aria-label={label}
      className={cn(
        "block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-white/[0.06]",
        "[&::-webkit-progress-bar]:bg-white/[0.06] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-ink [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-500 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-ink",
        className,
      )}
    />
  );
}

/** Dashboard card: drive, date, progress derived from plan_items. */
export function PlanSummary({ plan, now }: { plan: PlanSummaryData; now: Date }) {
  const pct = plan.total ? Math.round((plan.done / plan.total) * 100) : 0;
  return (
    <article className={cn(cardInteractive, "flex h-full flex-col p-5 md:p-6")}>
      <span className="type-label text-ink-muted">{plan.drive.company}</span>
      <h3 className="mt-4 type-title text-ink">
        <Link href={`/dashboard/plans/${plan.id}`} className={stretchedLink}>
          {plan.drive.title}
        </Link>
      </h3>
      <p className="mt-2 flex items-baseline gap-2.5 type-small text-ink-muted">
        {plan.drive.drive_date ? (
          <>
            <time dateTime={plan.drive.drive_date} className="type-data text-ink">
              {formatDriveDate(plan.drive.drive_date)}
            </time>
            <span className="text-ink-dim">
              <Countdown date={plan.drive.drive_date} now={now} />
            </span>
          </>
        ) : (
          "Drive date not announced"
        )}
      </p>
      <div className="mt-auto pt-6">
        <div className="flex items-baseline justify-between gap-3 type-small">
          <p className="text-ink-muted">
            <span className="type-data text-ink">
              {plan.done} of {plan.total}
            </span>{" "}
            done
          </p>
          <span className="type-data text-ink-dim">{pct}%</span>
        </div>
        <ProgressBar value={plan.done} max={plan.total} label={`${plan.drive.title} progress`} className="mt-2.5" />
      </div>
    </article>
  );
}

