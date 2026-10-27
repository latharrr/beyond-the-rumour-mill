import Link from "next/link";
import type { ClaimCheck } from "@/app/_actions/rumour";
import { ArrowRightIcon } from "@/components/icons";
import { type Tone, StatusDot, StatusPill, TONE_DOT } from "@/components/ui/status";
import { card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { formatDriveDate } from "@/lib/format";
import type { Verdict } from "@/lib/rumour";

const TONE: Record<Verdict, Tone> = {
  "Supported": "verified",
  "Mixed evidence": "mixed",
  "Not supported": "rumour",
  "No verified evidence yet": "neutral",
};

/** Deterministic verdict with the experiences it cites (§2.5). */
export function VerdictCard({ result }: { result: ClaimCheck }) {
  const tone = TONE[result.verdict];
  const pct = Math.round(result.frac * 100);
  return (
    <section aria-labelledby="verdict" data-verdict={result.verdict} className={cn(card, "p-5 md:p-8")}>
      <h2 id="verdict" className="flex items-center gap-3 type-section text-ink">
        <StatusDot className={cn("size-3", TONE_DOT[tone])} />
        <span className="sr-only">Verdict: </span>
        {result.verdict}
      </h2>
      <p className="mt-4 type-body text-ink-muted">
        Claim: &ldquo;{result.company} heavily asks {result.topic}&rdquo;.{" "}
        {result.total === 0 ? (
          `No verified ${result.company} experiences exist yet.`
        ) : (
          <>
            <span className="type-data text-ink">
              {result.cites.length} of {result.total}
            </span>{" "}
            verified {result.company} experience{result.total === 1 ? "" : "s"} (<span className="type-data">{pct}%</span>) mention{" "}
            {result.topic}.
          </>
        )}
      </p>

      {result.total > 0 && (
        <div className="mt-6" aria-hidden="true">
          <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(1, pct)}%` }} />
          </div>
          {/* The rule's two thresholds, so the verdict can be read off the bar. */}
          <div className="relative mt-2 h-4 type-data text-[12px] text-ink-dim">
            <span className="absolute left-[15%] -translate-x-1/2">15%</span>
            <span className="absolute left-1/2 -translate-x-1/2">50%</span>
          </div>
        </div>
      )}

      {result.lowSample && (
        <div className="mt-5">
          <StatusPill tone="mixed">
            Low sample <span className="type-data font-normal text-ink-muted">(n = {result.total})</span>
          </StatusPill>
        </div>
      )}

      {result.cited.length > 0 && (
        <div className="mt-8 border-t border-line pt-6">
          <h3 className="type-label text-ink-dim">Cited experiences</h3>
          <ul className="mt-3 grid gap-1">
            {result.cited.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/experiences/${e.id}`}
                  className="group -mx-3 flex items-start gap-4 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-panel-2"
                >
                  <span className="min-w-0 flex-1 line-clamp-2 type-small text-ink">{e.rounds_summary?.slice(0, 160) ?? "Verified experience"}</span>
                  {e.created_at && (
                    <time dateTime={e.created_at} className="shrink-0 type-data text-[13px] text-ink-dim">
                      {formatDriveDate(e.created_at.slice(0, 10))}
                    </time>
                  )}
                  <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-ink-dim transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 border-t border-line pt-5 type-small text-ink-dim">
        Rule: Supported at <span className="type-data">50%</span> or more, Not supported at <span className="type-data">15%</span> or
        less, otherwise Mixed. Fewer than <span className="type-data">3</span> experiences is flagged as a low sample.
      </p>
    </section>
  );
}
