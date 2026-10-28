import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { weeksOf } from "@/lib/export";
import { formatDriveDate } from "@/lib/format";

const DAY_MS = 86_400_000;

/**
 * Groups items into "Week n" sections; the caller renders each item. Each
 * week shows its own progress, and its start date when the plan's start is
 * known (weeks are counted from the day the plan was generated).
 */
export function WeeklyBuckets<T extends { id: string; week: number; position: number; done: boolean }>({
  items,
  renderItem,
  startedAt,
  currentWeek,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  startedAt?: string | null;
  currentWeek?: number | null;
}) {
  const start = startedAt ? Date.parse(startedAt) : NaN;
  return (
    <div className="grid gap-4">
      {weeksOf(items).map(([week, inWeek]) => {
        const done = inWeek.filter((i) => i.done).length;
        const from = Number.isNaN(start) ? null : new Date(start + (week - 1) * 7 * DAY_MS).toISOString().slice(0, 10);
        const now = currentWeek === week;
        return (
          <section
            key={week}
            aria-labelledby={`week-${week}`}
            className={cn("rounded-[var(--radius-card)] border bg-panel", now ? "border-white/16" : "border-line")}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-4 md:px-6">
              <div className="flex items-baseline gap-3">
                <h3 id={`week-${week}`} className="type-title text-ink">
                  Week {week}
                </h3>
                {from && (
                  <span className="type-small text-ink-dim">
                    from <time dateTime={from} className="type-data">{formatDriveDate(from)}</time>
                  </span>
                )}
                {now && <span className="rounded-full border border-line px-2 py-0.5 type-label text-ink">This week</span>}
              </div>
              <span className="type-small text-ink-muted">
                <span className="type-data text-ink">
                  {done} of {inWeek.length}
                </span>{" "}
                done
              </span>
            </div>
            <ul className="divide-y divide-line">{inWeek.map(renderItem)}</ul>
          </section>
        );
      })}
    </div>
  );
}
