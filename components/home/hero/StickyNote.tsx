import Link from "next/link";
import { Stamp } from "@/components/home/hero/Stamp";
import { cn } from "@/lib/cn";
import type { Verdict } from "@/lib/experiences/rumour";

export type DeskRumour = {
  company: string;
  topic: string;
  quote: string;
  verdict: Verdict;
  cites: number;
  total: number;
  href: string;
};

const PAPER = { sticky: "bg-sticky", kraft: "bg-kraft", white: "bg-object-paper" } as const;
export type Paper = keyof typeof PAPER;

/**
 * One rumour on a real sheet of paper: fibre texture, a strip of masking tape,
 * a contact shadow. Links to /rumour-check for that claim. The stamp starts
 * hidden under motion; the desk slams it down.
 */
export function StickyNote({ rumour, paper, className }: { rumour: DeskRumour; paper: Paper; className?: string }) {
  return (
    <Link
      href={rumour.href}
      data-note
      className={cn(
        "group/note relative block w-[224px] rounded-[2px] p-4 pt-5 text-object-ink paper-fibre shadow-[var(--shadow-object)] outline-offset-4 md:w-[248px]",
        PAPER[paper],
        className,
      )}
    >
      <span aria-hidden="true" className="absolute -top-3 left-1/2 h-[24px] w-[92px] -translate-x-1/2 -rotate-2 bg-[url(/marks/tape.svg)] bg-size-[100%_100%]" />
      <span className="block truncate type-label text-object-ink-2">
        {rumour.company} · {rumour.topic}
      </span>
      <span className="mt-3 block font-serif text-[19px] leading-[1.15] tracking-[-0.01em] italic">&ldquo;{rumour.quote}&rdquo;</span>
      <span className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-2.5">
        <span className="font-mono text-[12px] text-object-ink-2">
          {rumour.total > 0 ? `${rumour.cites} of ${rumour.total} mention it` : "No verified evidence"}
        </span>
        <span className="sr-only">Verdict: {rumour.verdict}.</span>
        <Stamp verdict={rumour.verdict} className="ml-auto origin-center motion-safe:opacity-0" />
      </span>
    </Link>
  );
}
