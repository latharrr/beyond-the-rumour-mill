"use client";

import { useGSAP } from "@gsap/react";
import { LazyMotion, MotionConfig } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { type ReactNode, Suspense, useEffect } from "react";
import { scheduleRefresh } from "./refresh";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

// Registered once, here. Every other motion module imports gsap directly.
gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.ticker.lagSmoothing(0);

const loadFeatures = () => import("./features").then((mod) => mod.default);

/** power3.out, the one easing family, for framer-motion. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * One RAF for the whole site: gsap.ticker drives Lenis, and Lenis drives
 * ScrollTrigger. framer-motion handles hover, press and presence only.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.12, smoothWheel: !reduced }}>
      <LenisOnGsapTicker />
      <RefreshWhenSettled />
      {/* usePathname can suspend under cacheComponents; this renders nothing either way. */}
      <Suspense fallback={null}>
        <RefreshOnRoute />
      </Suspense>
      <LazyMotion features={loadFeatures} strict>
        <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: EASE_OUT }}>
          {children}
        </MotionConfig>
      </LazyMotion>
    </ReactLenis>
  );
}

function LenisOnGsapTicker() {
  const lenis = useLenis();

  useGSAP(
    () => {
      if (!lenis) return;
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      lenis.on("scroll", ScrollTrigger.update);
      return () => {
        gsap.ticker.remove(tick);
        lenis.off("scroll", ScrollTrigger.update);
      };
    },
    { dependencies: [lenis] },
  );

  return null;
}

/** Trigger positions move when the display face swaps in, so re-measure after fonts load. */
function RefreshWhenSettled() {
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    let live = true;
    fonts.ready.then(() => live && scheduleRefresh());
    fonts.addEventListener("loadingdone", scheduleRefresh);
    return () => {
      live = false;
      fonts.removeEventListener("loadingdone", scheduleRefresh);
    };
  }, []);
  return null;
}

/** The layout (and its triggers) outlives a client navigation; the new page needs fresh measurements. */
function RefreshOnRoute() {
  const pathname = usePathname();
  useEffect(() => {
    scheduleRefresh();
  }, [pathname]);
  return null;
}
