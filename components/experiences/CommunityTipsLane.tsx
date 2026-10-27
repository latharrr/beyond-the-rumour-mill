import { StatusPill } from "@/components/ui/status";
import { rumourCard } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { CommunityTip } from "@/lib/data/experiences";
import { formatDriveDate } from "@/lib/format";

export const UNVERIFIED_BANNER = "Unverified — treat as rumour until a placement-cell admin verifies it.";

/** §3.2: pending submissions, quarantined behind the banner, no author info. */
export function CommunityTipsLane({ tips }: { tips: CommunityTip[] }) {
  return (
    <section aria-labelledby="community-tips" data-lane="unverified" className="border-t border-line pt-8 pb-4 md:pt-10">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-baseline md:gap-10">
        <h2 id="community-tips" className="type-title text-ink">
          Community tips
        </h2>
        <p role="note" className="max-w-[56ch] type-small text-ink-muted md:text-right">
          {UNVERIFIED_BANNER} Tips are left out of every count, verdict and plan.
        </p>
      </div>
      {tips.length === 0 ? (
        <div className={cn(rumourCard, "mt-6 p-6")}>
          <p className="type-small text-ink-muted">No unverified tips right now. New submissions wait here, labelled as rumour, until they are checked.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((t) => (
            <li key={t.id} className={cn(rumourCard, "flex flex-col p-5")}>
              <div className="flex items-center justify-between gap-3">
                <StatusPill tone="rumour">Rumour · unverified</StatusPill>
                <time dateTime={t.created_at} className="type-data text-[13px] text-ink-dim">
                  {formatDriveDate(t.created_at.slice(0, 10))}
                </time>
              </div>
              <p className="mt-4 type-small text-ink-muted">
                {t.company} · {t.role}
              </p>
              {t.rounds_summary && <blockquote className="mt-1.5 line-clamp-4 text-[16px] leading-snug text-ink">&ldquo;{t.rounds_summary.trim()}&rdquo;</blockquote>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
