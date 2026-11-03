"use client";

import { ThemeToggle } from "@/components/nav/ThemeToggle";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { NavigationProgress } from "./NavigationProgress";
import { BrandMark } from "./BrandMark";

const LINKS = [
  { href: "/drives", label: "Drives" },
  { href: "/companies", label: "Companies" },
  { href: "/experiences", label: "Experiences" },
  { href: "/rumour-check", label: "Rumour check" },
] as const;

/** Fixed top navigation. Two effects with cleanup: scroll shadow and Escape-to-close. */
export function SiteNav({ account }: { account: ReactNode }) {
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
        className="pointer-events-none absolute inset-x-0 top-0 h-[var(--nav-h)] border-b border-line bg-ground/85 opacity-0 backdrop-blur-md transition-opacity group-data-[scrolled=true]/header:opacity-100 md:h-[var(--nav-h-md)]"
      />
      <nav aria-label="Main" className="relative mx-auto h-[var(--nav-h)] max-w-[1200px] px-4 md:h-[var(--nav-h-md)] md:px-6">
        <div className="relative grid h-full grid-cols-[auto_1fr] items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <div data-group="left" className="col-start-1 justify-self-start">
            <Link href="/" aria-label="Beyond the Rumour Mill" className="group flex h-11 items-center gap-2.5 rounded-full">
              <BrandMark />
              <span className="block max-w-[84px] text-[13px] leading-[1.1] font-medium tracking-[-0.01em] text-ink sm:max-w-none sm:text-[15px] sm:leading-normal">
                Beyond the Rumour Mill
              </span>
            </Link>
          </div>

          <ul data-group="links" className="hidden items-center gap-5 md:col-start-2 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link prefetch={true} href={l.href} className="group hit-44 inline-flex text-[15px]">
                  <span className="text-ink-muted group-hover:text-ink group-hover:underline">{l.label}</span>
                  <NavigationProgress />
                </Link>
              </li>
            ))}
          </ul>

          <div data-group="right" className="col-start-2 flex items-center gap-1.5 justify-self-end md:col-start-3 md:gap-2">
            {/* On phones the toggle lives in the menu instead, so the bar fits at 390px. */}
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {account}
            <button
              type="button"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative grid size-11 place-items-center rounded-full md:hidden"
            >
              {open ? <CloseIcon className="size-5 text-ink" /> : <MenuIcon className="size-5 text-ink" />}
            </button>
          </div>
        </div>

        {open && (
            <div
              id="site-menu"
              className="motion-safe:animate-rise absolute inset-x-4 top-[calc(100%+4px)] rounded-[var(--radius-card)] border border-line bg-panel p-2 shadow-pill md:hidden"
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
              <div className="mt-1 flex h-12 items-center justify-between border-t border-line pl-3 text-[16px] text-ink">
                Theme
                <ThemeToggle />
              </div>
            </div>
        )}
      </nav>
    </header>
  );
}
