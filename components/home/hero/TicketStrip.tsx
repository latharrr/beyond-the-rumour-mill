import Link from "next/link";
import { connection } from "next/server";
import { cn } from "@/lib/cn";
import { daysUntil } from "@/lib/format";
import type { DriveSummary } from "@/lib/placement/data";

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * The hero's bottom edge: upcoming drives as ticket stubs drifting left,
 * split by perforated tear lines. The run is repeated until it is wider than
 * any screen, then doubled so moving it -50% loops seamlessly. Hover or focus
 * pauses it; under reduced motion it stands still.
 */
export async function TicketStrip({ drives }: { drives: Promise<DriveSummary[]> }) {
  const list = await drives;
  await connection(); // the countdown is per request, never prerendered
  const now = new Date();
  const upcoming = list.filter((d) => (d.status === "upcoming" || d.status === "ongoing") && d.drive_date);
  if (upcoming.length === 0) return <div aria-hidden="true" className="h-11 border-y border-line bg-surface" />;
  const run = Array.from({ length: Math.ceil(8 / upcoming.length) }, () => upcoming).flat();

  return (
    <nav aria-label="Upcoming drives" className="group relative overflow-hidden border-y border-line bg-surface">
      <ul className="flex w-max motion-safe:animate-ticker group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
        {[...run, ...run].map((d, i) => {
          const copy = i >= upcoming.length; // only the first run is read out and tabbable
          const days = daysUntil(d.drive_date!, now);
          return (
            <li key={i} aria-hidden={copy || undefined} className="flex">
              <Link
                href={`/drives/${d.id}`}
                tabIndex={copy ? -1 : undefined}
                className="flex h-11 items-center gap-3 px-6 font-mono text-[12px] tracking-[0.1em] whitespace-nowrap text-ink uppercase hover:text-accent"
              >
                <span>{d.company.name}</span>
                <span className="text-ink-2">·</span>
                <span>{DAY_MONTH.format(new Date(`${d.drive_date}T00:00:00Z`))}</span>
                <span className="text-ink-2">·</span>
                <span className={cn(days <= 21 ? "text-ok" : "text-ink-2")}>{days === 0 ? "Today" : `In ${days} day${days === 1 ? "" : "s"}`}</span>
              </Link>
              {/* Perforation: a dashed tear line with a punched notch top and bottom. */}
              <span
                aria-hidden="true"
                className="relative w-px border-l border-dashed border-ink/25 before:absolute before:-top-1.5 before:-left-[5px] before:size-2.5 before:rounded-full before:bg-bg after:absolute after:-bottom-1.5 after:-left-[5px] after:size-2.5 after:rounded-full after:bg-bg"
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
