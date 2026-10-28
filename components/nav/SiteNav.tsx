"use client";

import { AnimatePresence, m } from "framer-motion";
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

/** Fixed navigation without a scroll-driven morph. */
export function SiteNav({ account }: { account: ReactNode }) {
  const navRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      headerRef.current?.setAttribute("data-scrolled", String(window.scrollY > 4));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header ref={headerRef} className="group/header fixed inset-x-0 top-0 z-50">
      <div
        data-bar-backdrop
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[var(--nav-h)] border-b border-line bg-ground/85 opacity-0 backdrop-blur-md group-data-[scrolled=true]/header:opacity-[calc(1-var(--pill,0))] md:h-[var(--nav-h-md)]"
      />
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
