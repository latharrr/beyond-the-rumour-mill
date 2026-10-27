import { Suspense, type ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteNav } from "@/components/nav/SiteNav";

// Nav + footer for public pages (§3.1).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <SiteNav
        account={
          <Suspense fallback={<span aria-hidden="true" className="block h-11 w-[162px] md:h-9 md:w-[190px]" />}>
            <AccountNav />
          </Suspense>
        }
      />
      {/* Holds the fixed nav's height; the landing hero pulls itself up underneath. */}
      <div aria-hidden="true" className="h-[var(--nav-h)] md:h-[var(--nav-h-md)]" />
      {children}
      <SiteFooter />
    </MotionProvider>
  );
}
