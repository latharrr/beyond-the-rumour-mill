"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { type ReactNode, useRef } from "react";

/**
 * The hero's stage: the ember field behind it and the one-time load-in.
 * Headline lines rise into place on y, then the supporting line and the
 * claim bar follow. Content is visible without JS; the gate in the root
 * layout only hides it when this entrance is going to run.
 */
export function HeroStage({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const html = document.documentElement;
      const q = gsap.utils.selector(scope);
      const lines = q("[data-reveal=line]");
      const rise = q("[data-reveal=rise]");
      const mm = gsap.matchMedia();

      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
        // If the CSS failsafe already revealed the hero (very slow hydration),
        // the entrance has nothing left to show. The decision reads the page,
        // not a flag this effect writes, so a re-run (StrictMode, client
        // navigation back to /) still plays the entrance.
        const failsafeFired =
          html.dataset.motion === "pending" && lines[0] !== undefined && getComputedStyle(lines[0]).transform === "none";
        if (ctx.conditions?.reduce || failsafeFired) {
          gsap.set([...lines, ...rise], { clearProps: "transform,opacity" });
          html.dataset.motion = "ready";
          return;
        }
        gsap.set(lines, { yPercent: 110 });
        gsap.set(rise, { opacity: 0.01, y: 16 });
        html.dataset.motion = "ready";
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(lines, { yPercent: 0, duration: 0.8, stagger: 0.1 })
          .to(rise, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.4");
      });
    },
    { scope },
  );

  return (
    <section ref={scope} aria-labelledby="hero-title" className="relative isolate -mt-[var(--nav-h)] overflow-hidden md:-mt-[var(--nav-h-md)]">
      <div aria-hidden="true" className="glow-field pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10" />
      <div className="container-page flex flex-col items-center pt-[calc(var(--nav-h)+72px)] pb-24 text-center md:pt-[calc(var(--nav-h-md)+104px)] md:pb-32">
        {children}
      </div>
    </section>
  );
}
