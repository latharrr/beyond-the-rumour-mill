import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Card: panel fill, hairline border, 12px radius. */
export const card = "rounded-[var(--radius-card)] border border-line bg-panel";
/** A card whose single link covers it: put `stretchedLink` on that link. */
export const cardInteractive = cn(card, "relative transition-colors duration-200 has-[a:hover]:border-white/16 has-[a:hover]:bg-panel-2");
export const stretchedLink =
  "after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-amber";
/** Quarantined community tips: the only dashed border on the site. */
export const rumourCard = "rounded-[var(--radius-card)] border border-dashed border-line bg-panel";

export function Card({ children, className, ...rest }: { children?: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(card, "p-6", className)} {...rest}>
      {children}
    </div>
  );
}

/** Top of every inner page: label, display heading, optional lede and actions. */
export function PageHeader({
  label,
  title,
  lede,
  actions,
  titleId,
  className,
}: {
  label?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  className?: string;
}) {
  return (
    <header className={cn("grid gap-6 pb-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10 md:pb-14", className)}>
      <div className="min-w-0">
        {label && <p className="type-label text-ink-dim">{label}</p>}
        <h1 id={titleId} className={cn("max-w-[18ch] type-section text-ink text-balance", label && "mt-4")}>
          {title}
        </h1>
        {lede && <div className="mt-5 max-w-[60ch] type-body text-pretty text-ink-muted md:mt-6">{lede}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

/** Inner-page main: container plus the top space under the nav. */
export const pageMain = "container-page pt-10 md:pt-16 motion-safe:animate-rise";

/** A titled block inside an inner page, separated by a hairline. */
export function PageSection({ id, title, aside, children, className }: { id: string; title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("border-t border-line pt-8 pb-12 md:pt-10 md:pb-16", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id={id} className="type-title text-ink">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A dashed-free empty state inside a card. */
export function EmptyState({ title, children, action }: { title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn(card, "p-6 md:p-8")}>
      <p className="type-title text-ink">{title}</p>
      {children && <div className="mt-2 max-w-[60ch] type-body text-ink-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** A one-line notice above content (profile incomplete, sign in to filter). */
export function Notice({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(card, "flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 type-small text-ink-muted", className)}>{children}</div>;
}
