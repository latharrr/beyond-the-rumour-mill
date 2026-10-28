"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { type ReactNode, useRef } from "react";
import { scheduleRefresh } from "@/components/motion/refresh";
import { cn } from "@/lib/cn";

/**
 * How a block arrives the first time it scrolls into view. Every variant uses
 * the same grammar: power3.out, a 16px rise with a fade, 600-800ms, staggers
 * of 60-80ms, and each element moves once. Variants differ only in what
 * follows the [data-rise] text (heading first, then copy):
 * - `cards`:    [data-card] in a quick left-to-right run.
 * - `feature`:  the [data-frame] glow warming up, [data-card] UI cards lifting
 *               in, [data-bar] topic bars growing from zero.
 * - `plan`:     the [data-frame] glow and [data-card] first (the panel sits on
 *               the left), then the text, then [data-item] rows down the week.
 * - `sequence`: [data-step] steps one after another, each [data-link] drawn between them.
 * - `close`:    the text alone, a touch slower.
 * - `wordmark`: [data-line] lines rising out of their masks, like the hero h1.
 */
export type RevealVariant = "cards" | "feature" | "plan" | "sequence" | "close" | "wordmark";

const RISE = { opacity: 0, y: 16 };
const TEXT = { ...RISE, duration: 0.7, stagger: 0.07 };
const CARDS = { ...RISE, duration: 0.7, stagger: 0.08 };
const WARM = { opacity: 0, duration: 0.8 };
const GROW = { scaleX: 0, transformOrigin: "0% 50%" };

function build(variant: RevealVariant, tl: gsap.core.Timeline, q: (s: string) => Element[]) {
  const rise = q("[data-rise]");
  switch (variant) {
    case "cards":
      tl.from(rise, TEXT);
      tl.from(q("[data-card]"), CARDS, 0.12);
      break;
    case "feature":
      tl.from(rise, TEXT);
      tl.from(q("[data-frame]"), WARM, 0.05);
      tl.from(q("[data-card]"), CARDS, 0.2);
      tl.from(q("[data-bar]"), { ...GROW, duration: 0.8, stagger: 0.06 }, 0.45);
      break;
    case "plan":
      tl.from(q("[data-frame]"), WARM, 0);
      tl.from(q("[data-card]"), CARDS, 0.1);
      tl.from(rise, TEXT, 0.15);
      tl.from(q("[data-item]"), { ...RISE, duration: 0.6, stagger: 0.06 }, 0.3);
      break;
    case "sequence": {
      tl.from(rise, TEXT);
      const steps = q("[data-step]");
      const links = q("[data-link]");
      steps.forEach((step, i) => {
        const at = 0.15 + i * 0.32;
        tl.from(step, { ...RISE, duration: 0.7 }, at);
        if (links[i]) tl.from(links[i], { ...GROW, duration: 0.6 }, at + 0.22);
      });
      break;
    }
    case "close":
      tl.from(rise, { ...TEXT, duration: 0.8 });
      break;
    case "wordmark":
      tl.from(q("[data-line]"), { yPercent: 110, duration: 0.8, stagger: 0.1 });
      break;
  }
}

/**
 * Plays a block's entrance once, on scroll. Without JS, or with reduced
 * motion, nothing is ever hidden: the from-states are set only inside the
 * no-preference branch, at the moment the timeline is built.
 */
export function Reveal({
  variant,
  children,
  className,
  id,
  labelledBy,
  as = "section",
}: {
  as?: "section" | "div";
  variant: RevealVariant;
  children: ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: el, start: "top 78%", once: true },
        });
        build(variant, tl, gsap.utils.selector(el));
      });
      // Streamed sections change the page height; let every trigger re-measure.
      scheduleRefresh();
    },
    { scope: root },
  );

  // Both tags are plain HTMLElements, so one ref type covers either.
  const Tag = as as "section";
  return (
    <Tag ref={root} id={id} aria-labelledby={labelledBy} className={cn(className)}>
      {children}
    </Tag>
  );
}
