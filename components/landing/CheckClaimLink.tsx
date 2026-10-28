"use client";

import type { ReactNode } from "react";
import { CLAIM_ANCHOR } from "./anchors";

/** A native in-page jump with keyboard focus handed to the claim control. */
export function CheckClaimLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a href={`#${CLAIM_ANCHOR}`} className={className} onClick={(event) => {
      const target = document.getElementById(CLAIM_ANCHOR);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "instant", block: "start" });
      document.getElementById("hero-company")?.focus({ preventScroll: true });
    }}>
      {children}
    </a>
  );
}
