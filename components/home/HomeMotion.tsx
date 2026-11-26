"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { dropAndStamp, gsap, ScrollTrigger, splitLines } from "@/lib/motion";

// Below the hero only four things move: masked line reveals, the rumour notes
// dropping onto the desk, their stamps slamming down, and the ticket hover
// (CSS). The hero runs its own entrance (CSS) and desk loop (hero/Desk.tsx).

// Streamed sections GSAP touches, each closed by a <Hydrated name> inside its Suspense boundary.
const STREAMED = ["board"];
const EVENT = "home:hydrated";
const hydrated = () => ((window as { __homeHydrated?: Set<string> }).__homeHydrated ??= new Set());

/** Rendered last inside a Suspense boundary: its effect runs only once React has hydrated that boundary. */
export function Hydrated({ name }: { name: string }) {
  useEffect(() => {
    hydrated().add(name);
    window.dispatchEvent(new Event(EVENT));
  }, [name]);
  return null;
}

/**
 * Wires GSAP onto the page's `data-*` hooks after hydration and reverts
 * everything on unmount. Under reduced motion nothing runs: no smooth scroll,
 * the notes and stamps are already in place and the strike is already drawn.
 */
export function HomeMotion() {
  useEffect(() => {
    let cleanup = () => {};
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      window.removeEventListener(EVENT, check);
      clearTimeout(giveUp);
      cleanup = setup();
    };
    // GSAP must not touch a streamed section before React hydrates it, so wait for every <Hydrated> (or 4s regardless).
    const check = () => STREAMED.every((name) => hydrated().has(name)) && start();
    window.addEventListener(EVENT, check);
    const giveUp = window.setTimeout(start, 4000);
    check();
    return () => {
      window.removeEventListener(EVENT, check);
      clearTimeout(giveUp);
      cleanup();
    };
  }, []);

  return null;
}

/** Wires every animation; returns the cleanup. */
function setup() {
  const $$ = (sel: string) => gsap.utils.toArray<HTMLElement>(document.querySelectorAll(sel));
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Smooth scroll, driven by GSAP's ticker so ScrollTrigger and Lenis share one frame.
    const lenis = new Lenis({ anchors: { offset: -96 } });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    $$("[data-split]").forEach((el) => splitLines(el));

    // Notes in the same row land one after another.
    const cols = matchMedia("(min-width: 1024px)").matches ? 3 : matchMedia("(min-width: 640px)").matches ? 2 : 1;
    $$("[data-drop]").forEach((card, i) => dropAndStamp(card, { delay: (i % cols) * 0.1 }));

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  });

  // Suspense boundaries stream in after hydration and change the page height; re-measure triggers when they do.
  let timer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  const main = document.querySelector("[data-home]");
  if (main) ro.observe(main);

  return () => {
    ro.disconnect();
    clearTimeout(timer);
    mm.revert();
  };
}
