"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let pending: gsap.core.Tween | null = null;

/**
 * Re-measures every ScrollTrigger once the page settles. Streamed sections,
 * late fonts and route changes all call this; bursts collapse into a single
 * refresh, scheduled on gsap's ticker so it stays on the one RAF.
 */
export function scheduleRefresh() {
  pending?.kill();
  pending = gsap.delayedCall(0.1, () => {
    pending = null;
    ScrollTrigger.refresh();
  });
}
