import { cn } from "@/lib/cn";

/** Existing Deepanshu Labs mark, reused from the owner's Labs site. */
export function BrandMark({ className }: { className?: string }) {
  return <span data-mark aria-hidden="true" className={cn("block size-8 shrink-0", className)}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/deepanshu-labs.svg" alt="" width={32} height={32} />
  </span>;
}
