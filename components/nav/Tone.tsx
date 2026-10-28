import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Two stacked copies of a nav label: one coloured for the transparent bar,
 * one for the paper pill. Their opacity follows the nav's `--pill` progress
 * (see globals.css), so the colour change stays an opacity crossfade and
 * streamed-in content picks up the current state without inline styles. The
 * pill copy is hidden from assistive tech, so accessible names are unchanged.
 */
export function Tone({ children, bar, pill, className }: { children: ReactNode; bar?: string; pill?: string; className?: string }) {
  return (
    <span className={cn("inline-grid", className)}>
      <span data-tone="bar" className={cn("[grid-area:1/1]", bar)}>
        {children}
      </span>
      <span data-tone="pill" aria-hidden="true" className={cn("[grid-area:1/1]", pill)}>
        {children}
      </span>
    </span>
  );
}

/** Background layers for a control whose fill changes between bar and pill. */
export function ToneFill({ bar, pill }: { bar: string; pill: string }) {
  return (
    <>
      <span data-tone="bar" aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", bar)} />
      <span data-tone="pill" aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", pill)} />
    </>
  );
}
