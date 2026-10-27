import Link from "next/link";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { Press } from "@/components/motion/Press";
import { cn } from "@/lib/cn";
import { StatusDot } from "./VerdictChip";

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

const pill = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium whitespace-nowrap";
export const pillPrimary = cn(pill, "bg-amber text-paper-ink");
export const pillSecondary = cn(pill, "border border-line text-ink transition-colors duration-200 hover:bg-panel");

/** A pill link with framer-motion hover/press on its wrapper. */
export function PillLink({ href, variant = "secondary", children }: { href: string; variant?: "primary" | "secondary"; children: ReactNode }) {
  return (
    <Press>
      <Link href={href} className={variant === "primary" ? pillPrimary : pillSecondary}>
        {children}
      </Link>
    </Press>
  );
}

/** Text link with a trailing arrow; underline on hover. */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group hit-44 inline-flex items-center gap-1.5 font-medium text-ink underline-offset-4 hover:underline", className)}>
      {children}
      <ArrowRightIcon className="size-4 transition-transform duration-200 ease-[var(--ease-out-3)] group-hover:translate-x-0.5" />
    </Link>
  );
}

type Tone = "verified" | "mixed" | "rumour" | "neutral";
const DOT: Record<Tone, string> = {
  verified: "bg-verified",
  mixed: "bg-mixed",
  rumour: "bg-rumour",
  neutral: "bg-ink-dim",
};

/** Dot plus label; status is never colour alone. `onPaper` for use inside paper UI cards. */
export function StatusPill({ tone, children, onPaper = false }: { tone: Tone; children: ReactNode; onPaper?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-[13px] font-medium",
        onPaper ? "border-paper-ink/12 text-paper-ink" : "border-line bg-ground/50 text-ink",
      )}
    >
      <StatusDot className={cn(DOT[tone], onPaper && tone === "verified" && "ring-1 ring-paper-ink/15")} />
      {children}
    </span>
  );
}

/** The "Sample data" tag, shown wherever seed experiences feed a number. */
export function SampleTag({ onPaper = false }: { onPaper?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 type-label",
        onPaper ? "border-paper-ink/12 text-paper-ink/60" : "border-line bg-ground/60 text-ink-muted",
      )}
    >
      Sample data
    </span>
  );
}

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
