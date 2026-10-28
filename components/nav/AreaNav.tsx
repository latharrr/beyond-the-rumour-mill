"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; exact?: boolean };

/** Section tabs for the signed-in areas (student, admin). Scrolls sideways on narrow screens. */
export function AreaNav(props: { label: string; items: Item[] }) {
  // usePathname can suspend under cacheComponents; the fallback is the same tabs, none marked.
  return (
    <Suspense fallback={<Tabs {...props} path={null} />}>
      <WithPath {...props} />
    </Suspense>
  );
}

function WithPath(props: { label: string; items: Item[] }) {
  return <Tabs {...props} path={usePathname()} />;
}

function Tabs({ label, items, path }: { label: string; items: Item[]; path: string | null }) {
  return (
    <nav aria-label={label} className="container-page pt-6 md:pt-8">
      <ul className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1 [scrollbar-width:none]">
        {items.map((it) => {
          const active = path !== null && (it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`));
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-11 items-center px-3 text-[15px] whitespace-nowrap transition-colors duration-200",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {it.label}
                {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
