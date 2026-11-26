import { cn } from "@/lib/cn";
import type { Verdict } from "@/lib/experiences/rumour";

export const STAMP_TEXT: Record<Verdict, string> = {
  "Supported": "Supported",
  "Mixed evidence": "Mixed",
  "Not supported": "Not supported",
  "No verified evidence yet": "Unproven",
};

// Solid ink with paper-coloured letters; the same in dark mode, like the paper it lands on.
const INK: Record<Verdict, string> = {
  "Supported": "bg-stamp-ok",
  "Mixed evidence": "bg-stamp-mixed",
  "Not supported": "bg-stamp-no",
  "No verified evidence yet": "bg-stamp-none",
};

/**
 * A verdict rubber stamp: −6°, ragged ink edges (stamp-ink). 19px bold, so
 * even the amber one passes contrast as large text. Decorative: the verdict
 * is also given as text next to it. `data-stamp` is the hook HomeMotion and
 * the hero desk animate.
 */
export function Stamp({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span
      data-stamp
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 -rotate-[6deg] rounded-[3px] px-3 py-1.5 stamp-ink font-mono text-[19px] leading-none font-bold tracking-[0.06em] text-object-paper uppercase",
        INK[verdict],
        className,
      )}
    >
      {STAMP_TEXT[verdict]}
    </span>
  );
}
