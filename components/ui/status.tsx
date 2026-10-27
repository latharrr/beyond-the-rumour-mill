import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "verified" | "mixed" | "rumour" | "neutral";

export const TONE_DOT: Record<Tone, string> = {
  verified: "bg-verified",
  mixed: "bg-mixed",
  rumour: "bg-rumour",
  neutral: "bg-ink-dim",
};

export function StatusDot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", className)} />;
}

/** Dot plus label; status is never colour alone. `onPaper` for use inside paper UI cards. */
export function StatusPill({ tone, children, onPaper = false, className }: { tone: Tone; children: ReactNode; onPaper?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-[13px] font-medium",
        onPaper ? "border-paper-ink/12 text-paper-ink" : "border-line bg-ground/50 text-ink",
        className,
      )}
    >
      <StatusDot className={cn(TONE_DOT[tone], onPaper && tone === "verified" && "ring-1 ring-paper-ink/15")} />
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

/** A topic or tag chip on dark. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-7 items-center rounded-full border border-line px-2.5 text-[13px] text-ink", className)}>{children}</span>;
}
