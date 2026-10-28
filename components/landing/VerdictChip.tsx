import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { StatusDot } from "@/components/ui/status";
import type { Verdict } from "@/lib/rumour";

export type ChipData = { verdict: Verdict; cited: number; total: number; lowSample: boolean };

const DOT: Record<Verdict, string> = {
  "Supported": "bg-verified",
  "Mixed evidence": "bg-mixed",
  "Not supported": "bg-rumour",
  "No verified evidence yet": "bg-ink-dim",
};

/** Compact verdict line under the claim bar: status, share, flags and the way to the evidence. */
export function VerdictChip({ data, href, sample }: { data: ChipData; href: string; sample: boolean }) {
  const hasEvidence = data.total > 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 type-small">
      <span className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-panel px-3 font-medium text-ink">
        <StatusDot className={DOT[data.verdict]} />
        {data.verdict}
      </span>
      {hasEvidence && (
        <span className="text-ink">
          <span className="type-data">
            {data.cited} of {data.total}
          </span>{" "}
          verified
          experience{data.total === 1 ? "" : "s"}
        </span>
      )}
      {data.lowSample && (
        <span className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-panel px-3 text-ink">
          <StatusDot className="bg-mixed" />
          Low sample <span className="type-data text-ink-muted">(n = {data.total})</span>
        </span>
      )}
      {hasEvidence && sample && (
        <span className="inline-flex h-6 items-center rounded-full border border-line bg-ground/60 px-2.5 type-label text-ink-muted">
          Sample data
        </span>
      )}
      {hasEvidence && (
        <Link href={href} className="group hit-44 inline-flex items-center gap-1.5 font-medium text-ink underline-offset-4 hover:underline">
          {data.cited > 0 ? "See the cited experiences" : "Open the full check"}
          <ArrowRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
