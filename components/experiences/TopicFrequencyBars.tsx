import type { TopicFrequency } from "@/lib/topic-frequency";

/** Topic frequency across verified experiences: one bar per topic, count as "n of N". */
export function TopicFrequencyBars({ frequency, total, limit = 10 }: { frequency: TopicFrequency[]; total: number; limit?: number }) {
  if (!frequency.length) return <p className="type-small text-ink-muted">No topic data yet. Counts appear once the first experience is verified.</p>;
  return (
    <ol className="grid gap-4">
      {frequency.slice(0, limit).map((t) => (
        <li key={t.id} data-share={t.share}>
          <div className="flex items-baseline justify-between gap-4 text-[15px]">
            <span className="min-w-0 truncate text-ink">
              {t.label} <span className="type-small text-ink-dim">{t.category}</span>
            </span>
            <span className="shrink-0 type-small text-ink-muted">
              <span className="type-data">
                {t.count} of {total}
              </span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(2, Math.round(t.share * 100))}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
