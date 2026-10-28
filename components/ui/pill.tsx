import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ExternalIcon } from "@/components/icons";
import { Press } from "@/components/motion/Press";
import { cn } from "@/lib/cn";

const pill = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium whitespace-nowrap";
export const pillPrimary = cn(pill, "bg-amber text-paper-ink disabled:opacity-60");
export const pillSecondary = cn(pill, "border border-line text-ink transition-colors duration-200 hover:bg-panel disabled:opacity-60");

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

/** A pill <button>. No motion wrapper, so it also works outside the public layout's MotionProvider. */
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: { variant?: "primary" | "secondary" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn(variant === "primary" ? pillPrimary : pillSecondary, className)} {...rest} />;
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

/** Inline text link inside body copy. */
export const textLink = "text-ink underline decoration-ink-dim underline-offset-4 hover:decoration-ink";

/** "← All drives" above an inner page's header. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group hit-44 inline-flex items-center gap-1.5 type-small text-ink-muted underline-offset-4 hover:text-ink hover:underline">
      <ArrowLeftIcon className="size-4 transition-transform duration-200 ease-[var(--ease-out-3)] group-hover:-translate-x-0.5" />
      {children}
    </Link>
  );
}

/** A resource link that leaves the site: opens in a new tab and says so. */
export function ResourceLink({ href, title, type }: { href: string; title: string; type: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center gap-2 text-[15px] text-ink underline-offset-4 hover:underline md:min-h-9">
      <span>{title}</span>
      <span className="type-label text-ink-dim">{type}</span>
      <ExternalIcon className="size-3.5 shrink-0 text-ink-dim group-hover:text-ink" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
