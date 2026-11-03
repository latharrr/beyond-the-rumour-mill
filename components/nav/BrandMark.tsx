import Image from "next/image";
import { cn } from "@/lib/cn";

/** Deepanshu Labs mark. next/image reserves width/height so the logo never shifts layout. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("block size-8 shrink-0", className)}>
      <Image src="/deepanshu-labs.svg" alt="" width={32} height={32} priority />
    </span>
  );
}
