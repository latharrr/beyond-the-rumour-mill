import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, ExternalIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

// Full pills, 48px tall, no shadow. Primary is oxblood; hover darkens the fill 8% and slides the arrow 4px.
const pill =
  "group/pill inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-60";
export const pillPrimary = cn(pill, "bg-accent text-on-accent hover:bg-accent-hover");
export const pillSecondary = cn(pill, "border border-ink text-ink hover:bg-ink/5");

/** A pill-shaped link with a trailing arrow. Reusable via the `variant` prop. */
export function PillLink({ href, variant = "secondary", children }: { href: string; variant?: "primary" | "secondary"; children: ReactNode }) {
  return (
    <Link href={href} className={variant === "primary" ? pillPrimary : pillSecondary}>
      {children}
      <ArrowRightIcon className="size-4 transition-transform duration-200 ease-[var(--ease-out-3)] group-hover/pill:translate-x-1" />
    </Link>
  );
}

/** A pill <button>. */
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: { variant?: "primary" | "secondary" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn(variant === "primary" ? pillPrimary : pillSecondary, className)} {...rest} />;
}

/** Text link with a trailing arrow; underlined on hover. */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group hit-44 inline-flex items-center gap-1.5 font-medium text-ink", className)}>
      <span className="link-draw">{children}</span>
      <ArrowRightIcon className="size-4" />
    </Link>
  );
}

/** Inline text link inside body copy. */
export const textLink = "text-ink underline decoration-ink-dim underline-offset-4 hover:decoration-ink";

/** "← All drives" above an inner page's header. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group hit-44 inline-flex items-center gap-1.5 type-small text-ink-muted underline-offset-4 hover:text-ink hover:underline">
      <ArrowLeftIcon className="size-4" />
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
