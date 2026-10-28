import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Vertical rhythm between landing sections: 80px on phones, 128px from tablet up. */
export const SECTION_SPACE = "pt-20 md:pt-32";

/** Every section opens on its heading: inside a Reveal it is the first thing to rise. */
export function SectionHeading({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} data-rise className={cn("type-section text-ink", className)}>
      {children}
    </h2>
  );
}

export { ArrowLink, PillLink, pillPrimary, pillSecondary } from "@/components/ui/pill";
export { SampleTag, StatusPill } from "@/components/ui/status";

/**
 * The feature-panel frame: the ember and rust glow is its ground, edge to
 * edge, with paper UI cards on top. `glow` positions the ember core (CSS percentages).
 */
export function GlowFrame({ children, glow, className }: { children: ReactNode; glow: { x: string; y: string }; className?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-[var(--radius-card)]", className)}>
      <div
        data-frame
        aria-hidden="true"
        className="glow-panel pointer-events-none absolute inset-0 -z-10"
        style={{ "--glow-x": glow.x, "--glow-y": glow.y } as CSSProperties}
      />
      {children}
    </div>
  );
}

/** A white UI card inside a glow frame. */
export function PaperCard({ children, className, ...rest }: { children?: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-surface="paper" className={cn("rounded-[var(--radius-card)] bg-paper text-paper-ink", className)} {...rest}>
      {children}
    </div>
  );
}
