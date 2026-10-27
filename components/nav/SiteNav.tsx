"use client";

import { useGSAP } from "@gsap/react";
import { AnimatePresence, m } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { BrandMark } from "./BrandMark";
import { Tone } from "./Tone";

const LINKS = [
  { href: "/drives", label: "Drives" },
  { href: "/experiences", label: "Experiences" },
  { href: "/rumour-check", label: "Rumour check" },
] as const;

const PILL_MIN_WIDTH = 560;
const PILL_PAD_LEFT = 10;
const PILL_PAD_RIGHT = 6;
const PILL_EDGE_MOBILE = 8;
const MIN_SCROLL_TO_PILL = 80;

/**
 * Site nav. At the top it is a transparent full-width bar; once the page's
 * first heading reaches it, it morphs into a centred floating paper pill.
 * The morph is one GSAP timeline, played and reversed by a ScrollTrigger, and
 * only moves transforms and opacity: the groups slide on x, the pill surface
 * fades and settles in, and each label crossfades between its two tones via
 * the nav's `--pill` progress. Streamed account content is never styled
 * inline, so it hydrates cleanly whatever the scroll position.
 */
export function SiteNav({ account }: { account: ReactNode }) {
  const navRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const nav = navRef.current;
      if (!nav) return;
      const mm = gsap.matchMedia();

      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
        const reduce = Boolean(ctx.conditions?.reduce);
        const q = gsap.utils.selector(nav);
        let tl: gsap.core.Timeline | null = null;
        let isPill = false;

        const build = () => {
          tl?.kill();
          const surface = q("[data-pill-surface]")[0] as HTMLElement;
          const left = q("[data-group=left]")[0] as HTMLElement;
          const mark = q("[data-mark]")[0] as HTMLElement;
          const links = q("[data-group=links]")[0] as HTMLElement;
          const right = q("[data-group=right]")[0] as HTMLElement;
          gsap.set([left, links, right], { x: 0 });

          const navBox = nav.getBoundingClientRect();
          const markBox = mark.getBoundingClientRect();
          const rightBox = right.getBoundingClientRect();
          const linksBox = links.getBoundingClientRect();
          const hasLinks = linksBox.width > 0;
          const visibleRight = Array.from(right.children).filter(
            (el) => !el.hasAttribute("data-pill-hide") && (el as HTMLElement).offsetWidth > 0,
          );
          const visibleRightLeft = Math.min(...visibleRight.map((el) => el.getBoundingClientRect().left), rightBox.right);
          const visibleRightWidth = rightBox.right - visibleRightLeft;

          const centre = navBox.left + navBox.width / 2;
          const contentWidth = PILL_PAD_LEFT + markBox.width + visibleRightWidth + PILL_PAD_RIGHT + (hasLinks ? linksBox.width + 56 : 0);
          const width = hasLinks
            ? Math.min(Math.max(PILL_MIN_WIDTH, contentWidth), navBox.width)
            : navBox.width - PILL_EDGE_MOBILE * 2;
          const pillLeft = centre - width / 2;
          const pillRight = centre + width / 2;

          const markTo = pillLeft + PILL_PAD_LEFT;
          const rightTo = pillRight - PILL_PAD_RIGHT;
          const linksCentreTo = (markTo + markBox.width + (rightTo - visibleRightWidth)) / 2;

          gsap.set(surface, { left: pillLeft - navBox.left, width });

          tl = gsap.timeline({ paused: true, defaults: { duration: 0.38, ease: "power3.out" } });
          tl.fromTo(surface, { opacity: 0, scale: 1.04, y: -6 }, { opacity: 1, scale: 1, y: 0, immediateRender: false }, 0)
            .fromTo(left, { x: 0 }, { x: markTo - markBox.left, immediateRender: false }, 0)
            .fromTo(right, { x: 0 }, { x: rightTo - rightBox.right, immediateRender: false }, 0)
            .fromTo(nav, { "--pill": 0 }, { "--pill": 1, immediateRender: false }, 0);
          tl.eventCallback("onComplete", () => {
            nav.dataset.settled = "pill";
          });
          if (hasLinks) {
            tl.fromTo(links, { x: 0 }, { x: linksCentreTo - (linksBox.left + linksBox.width / 2), immediateRender: false }, 0);
          }
          return tl;
        };

        const toPill = () => {
          isPill = true;
          const t = build();
          if (reduce) t.progress(1);
          else t.play(0);
        };
        const toBar = () => {
          isPill = false;
          delete nav.dataset.settled;
          if (!tl) return;
          if (reduce) tl.progress(0);
          else tl.reverse();
        };

        // Morph when the page's first heading would slide under the bar, and
        // never before the reader has scrolled a little (pages whose h1 sits
        // right under the nav start as a bar too). The nav outlives client
        // navigation, so the heading is looked up on every refresh.
        const start = () => {
          const heading = document.querySelector("main h1");
          const top = heading ? heading.getBoundingClientRect().top + window.scrollY : 0;
          return Math.max(top - nav.offsetHeight - 8, MIN_SCROLL_TO_PILL);
        };
        const trigger = ScrollTrigger.create({
          start,
          // Short pages that can't scroll that far simply stay a bar.
          end: () => Math.max(ScrollTrigger.maxScroll(window), start() + 1),
          onEnter: toPill,
          onLeaveBack: toBar,
          onRefresh: (self) => {
            // Layout changed (resize, fonts, streamed account area): re-measure in place.
            if (self.scroll() > self.start) {
              isPill = true;
              build().progress(1);
            } else if (isPill) {
              isPill = false;
              delete nav.dataset.settled;
              tl?.progress(0);
            }
          },
        });

        return () => {
          trigger.kill();
          tl?.kill();
        };
      });
    },
    { scope: navRef },
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav ref={navRef} aria-label="Main" className="relative mx-auto h-[var(--nav-h)] max-w-[1200px] px-4 md:h-[var(--nav-h-md)] md:px-6">
        <div
          data-pill-surface
          aria-hidden="true"
          className="pointer-events-none absolute top-1 left-0 h-14 rounded-full bg-paper opacity-0 shadow-pill md:top-3 md:h-12"
        />
        <div className="relative grid h-full grid-cols-[auto_1fr] items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <div data-group="left" className="col-start-1 justify-self-start">
            <Link href="/" aria-label="Beyond the Rumour Mill" className="group flex h-11 items-center gap-2.5 rounded-full">
              <BrandMark />
              <span data-pill-hide className="block max-w-[84px] text-[13px] leading-[1.1] font-medium tracking-[-0.01em] text-ink sm:max-w-none sm:text-[15px] sm:leading-normal">
                Beyond the Rumour Mill
              </span>
            </Link>
          </div>

          <ul data-group="links" className="hidden items-center gap-7 md:col-start-2 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group hit-44 inline-flex text-[15px]">
                  <Tone bar="text-ink-muted group-hover:text-ink group-hover:underline" pill="text-paper-ink/75 group-hover:underline">
                    {l.label}
                  </Tone>
                </Link>
              </li>
            ))}
          </ul>

          <div data-group="right" className="col-start-2 flex items-center gap-1.5 justify-self-end md:col-start-3 md:gap-2">
            {account}
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative grid size-11 place-items-center rounded-full md:hidden"
            >
              <Tone bar="text-ink" pill="text-paper-ink">
                {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
              </Tone>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <m.div
              id="site-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute inset-x-4 top-[calc(100%+4px)] rounded-[var(--radius-card)] border border-line bg-panel p-2 shadow-pill md:hidden"
            >
              <ul>
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex h-12 items-center rounded-lg px-3 text-[16px] text-ink hover:bg-panel-2"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </m.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
