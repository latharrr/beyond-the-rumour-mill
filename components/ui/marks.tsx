import { cn } from "@/lib/cn";

/*
 * Hand-made marks, inline SVG in currentColor so they follow the theme.
 * At most two paperclips on a page; the strike is the hero's only pen mark.
 */

/**
 * A hand-drawn oxblood line through the words it sits on (absolutely
 * positioned over a relative parent). Hidden under motion until HomeMotion
 * draws it on scroll (stroke-dashoffset 1.1 → 0 on pathLength 1; the 0.1 extra hides the round cap's dot); under reduced
 * motion it is simply there.
 */
export function Strike({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 16" preserveAspectRatio="none" className={cn("pointer-events-none absolute overflow-visible text-accent", className)}>
      {/* Height is fixed at 0.24em, so the line's thickness (16 units tall → 0.24em) stays the same on any word width. */}
      <path
        data-strike=""
        d="M2 10 C 40 8, 82 9.5, 120 7.5 S 176 6.5, 198 5.5"
        pathLength={1}
        strokeDasharray="1 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        className="motion-safe:[stroke-dashoffset:1.1]"
      />
    </svg>
  );
}

/** A wire paperclip over a card's top edge. */
export function Paperclip({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 22 58" className={cn("pointer-events-none text-object-ink-2", className)}>
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M7 20 V9 a5 5 0 0 1 10 0 V44 a8 8 0 0 1 -16 0 V15" />
    </svg>
  );
}
