"use client";

import { useLenis } from "lenis/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";
import { CLAIM_ANCHOR } from "./anchors";

/**
 * Takes the reader back up to the hero claim bar through Lenis (so it shares
 * the one scroll loop), then hands focus to the company select. Without JS it
 * is a plain in-page link.
 */
export function CheckClaimLink({ className, children }: { className?: string; children: ReactNode }) {
  const lenis = useLenis();
  const reduced = usePrefersReducedMotion();

  return (
    <a
      href={`#${CLAIM_ANCHOR}`}
      className={className}
      onClick={(e) => {
        const target = document.getElementById(CLAIM_ANCHOR);
        if (!lenis || !target) return;
        e.preventDefault();
        const focusBar = () => document.getElementById("hero-company")?.focus({ preventScroll: true });
        lenis.scrollTo(target, {
          offset: -112,
          immediate: reduced,
          duration: 1.4,
          onComplete: focusBar,
        });
        if (reduced) focusBar();
      }}
    >
      {children}
    </a>
  );
}
