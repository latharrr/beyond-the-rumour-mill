"use client";

import { useLinkStatus } from "next/link";

/** Next's navigation state, not a timer pretending that work is complete. */
export function NavigationProgress() {
  const { pending } = useLinkStatus();
  return <span role="status" aria-live="polite" className={pending ? "fixed inset-x-0 top-0 z-[100] h-1 animate-pulse bg-amber" : "sr-only"}>
    {pending ? <span className="sr-only">Loading page</span> : null}
  </span>;
}
