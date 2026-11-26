// Animation helpers for the home page. Browser-only (GSAP touches the DOM), so
// import this from client components. Everything animates transform/opacity
// (or an SVG stroke offset) and plays from server-rendered final state, so
// without JavaScript the page still reads correctly.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger };

/** Masked line reveal: each line slides up out of its own mask. Re-splits when the width or fonts change. */
export function splitLines(el: HTMLElement, { stagger = 0.08, start = "top 85%" } = {}) {
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) => {
      // Tight display leading: give each mask room for descenders without moving the lines.
      gsap.set(self.masks, { paddingBottom: "0.14em", marginBottom: "-0.14em" });
      return gsap.from(self.lines, { yPercent: 105, duration: 1.1, ease: "expo.out", stagger, scrollTrigger: { trigger: el, start, once: true } });
    },
  });
}

/** A sheet of paper dropped onto the desk: falls in slightly turned, lands with a small settle. Then its stamp slams down. */
export function dropAndStamp(card: HTMLElement, { delay = 0 } = {}) {
  const stamp = card.querySelector<HTMLElement>("[data-stamp]");
  const tl = gsap.timeline({ delay, scrollTrigger: { trigger: card, start: "top 85%", once: true } });
  tl.from(card, { y: -56, rotation: gsap.utils.random(-5, 5), autoAlpha: 0, duration: 0.6, ease: "back.out(2.2)" });
  if (stamp) tl.from(stamp, { scale: 1.4, autoAlpha: 0, duration: 0.12, ease: "power2.in" }, ">-0.05");
  return tl;
}
