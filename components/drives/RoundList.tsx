import { ResourceLink } from "@/components/ui/pill";
import { Chip } from "@/components/ui/status";
import type { RoundDetail } from "@/lib/data/drives";

/** The drive's rounds in order: a numbered rail with topics and resources per round. */
export function RoundList({ rounds }: { rounds: RoundDetail[] }) {
  if (!rounds.length) return <p className="type-body text-ink-muted">The placement cell hasn&rsquo;t published the rounds for this drive yet.</p>;
  return (
    <ol className="grid">
      {rounds.map((r, i) => (
        <li key={r.id} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 md:grid-cols-[48px_minmax(0,1fr)]">
          {/* The rail joining one round to the next. */}
          {i < rounds.length - 1 && <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-px bg-line md:left-6" />}
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-line bg-panel type-data text-[14px] text-ink md:size-12">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 pt-2 md:pt-3">
            <h3 className="type-title text-ink">
              <span className="sr-only">Round {i + 1}: </span>
              {r.name}
            </h3>
            {r.description && <p className="mt-2 max-w-[62ch] type-body text-pretty text-ink-muted">{r.description}</p>}
            {r.topics.length > 0 && (
              <ul aria-label={`Topics in ${r.name}`} className="mt-4 flex flex-wrap gap-1.5">
                {r.topics.map((t) => (
                  <li key={t.id}>
                    <Chip>{t.label}</Chip>
                  </li>
                ))}
              </ul>
            )}
            {r.resources.length > 0 && (
              <ul aria-label={`Resources for ${r.name}`} className="mt-3 grid">
                {r.resources.map((res) => (
                  <li key={res.id}>
                    <ResourceLink href={res.url} title={res.title} type={res.type} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
