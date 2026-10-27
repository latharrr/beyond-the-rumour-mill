import { cn } from "@/lib/cn";

/** Monogram logo: the brand's initials on an amber disc. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      data-mark
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-amber pt-px text-[15px] text-paper-ink type-display",
        className,
      )}
    >
      BR
    </span>
  );
}
