"use client";

import { useGSAP } from "@gsap/react";
import { LazyMotion, MotionConfig } from "framer-motion";
import gsap from "gsap";
import type { ReactNode } from "react";

// GSAP remains for the hero's load-in and claim demo, never for scrolling.
gsap.registerPlugin(useGSAP);
const loadFeatures = () => import("./features").then((mod) => mod.default);
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Native browser scrolling. Only non-scroll interactions animate. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: EASE_OUT }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
