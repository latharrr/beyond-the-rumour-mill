"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { VERDICT_TONE } from "@/components/rumour/VerdictCard";
import { StatusPill, TONE_DOT } from "@/components/ui/status";
import { card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { checkClaimVerdict } from "@/lib/experiences/rumour";

const MAX = 12;

/**
 * Home-page sandbox for the rumour-check rule: the same pure checkClaimVerdict()
 * the real /rumour-check uses, fed from two sliders instead of the database.
 */
export function RuleLab() {
  const [total, setTotal] = useState(8);
  const [mentions, setMentions] = useState(5);
  const k = Math.min(mentions, total); // derived, so lowering the total never leaves k > total

  const ids = Array.from({ length: total }, (_, i) => String(i));
  const result = checkClaimVerdict(ids, ids.slice(0, k));
  const tone = VERDICT_TONE[result.verdict];

  return (
    <section aria-labelledby="rule-lab" className={cn(card, "p-5 md:p-7")}>
      <h3 id="rule-lab" className="sr-only">
        Try the rule
      </h3>
      {/* One dot per verified senior experience; filled ones mention the topic. */}
      <ul aria-hidden="true" className="flex min-h-5 flex-wrap gap-2">
        {ids.map((id, i) => (
          <li key={id} className={cn("size-5 rounded-full border transition-colors", i < k ? cn(TONE_DOT[tone], "border-transparent") : "border-line")} />
        ))}
      </ul>

      <div className="mt-6 grid gap-4">
        <Slider label="Verified experiences for the company" value={total} min={0} max={MAX} onChange={setTotal} />
        <Slider label="Of those, how many mention the topic" value={k} min={0} max={total} onChange={setMentions} />
      </div>

      <div aria-live="polite" className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <StatusPill tone={tone}>{result.verdict}</StatusPill>
        {result.total > 0 && (
          <span className="type-small text-ink-muted">
            <span className="type-data text-ink">
              {k} of {total}
            </span>{" "}
            = <span className="type-data">{Math.round(result.frac * 100)}%</span>
          </span>
        )}
        {result.lowSample && <StatusPill tone="mixed">Low sample</StatusPill>}
      </div>

      <Link href="/rumour-check" className="group mt-6 inline-flex items-center gap-2 text-[15px] font-medium text-ink">
        Check a real rumour against the data
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="grid gap-2">
      <span className="flex justify-between gap-3 type-small text-ink-muted">
        {label}
        <span className="type-data text-ink">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={max === 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber"
      />
    </label>
  );
}
