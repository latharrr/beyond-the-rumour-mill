import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RevealVariant = "cards" | "feature" | "plan" | "sequence" | "close" | "wordmark";


/** Static section: content is visible immediately, with no scroll reveal. */
export function Reveal({
  children,
  className,
  id,
  labelledBy,
  as = "section",
}: {
  as?: "section" | "div";
  variant: RevealVariant;
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  const Tag = as as "section";
  return (
    <Tag id={id} aria-labelledby={labelledBy} className={cn(className)}>
      {children}
    </Tag>
  );
}
