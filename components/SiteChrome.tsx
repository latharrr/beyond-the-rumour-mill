import { Suspense, type ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/nav/SiteNav";

/** Nav, footer and the motion runtime: the same frame on every page group. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-paper focus:px-4 focus:py-2 focus:text-paper-ink"
      >
        Skip to content
      </a>
      <SiteNav
        account={
          <Suspense fallback={<span aria-hidden="true" className="block h-11 w-[162px] md:h-9 md:w-[190px]" />}>
            <AccountNav />
          </Suspense>
        }
      />
      {/* Holds the fixed nav's height; the landing hero pulls itself up underneath. */}
      <div aria-hidden="true" className="h-[var(--nav-h)] md:h-[var(--nav-h-md)]" />
      <div id="content" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <SiteFooter />
    </MotionProvider>
  );
}
