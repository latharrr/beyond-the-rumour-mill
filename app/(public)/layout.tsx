import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";

// Nav + footer for public pages (§3.1). Unstyled until the UI pass.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header>
        <nav aria-label="Main">
          <Link href="/">Beyond the Rumour Mill</Link>
          <Link href="/drives">Drives</Link>
          <Link href="/experiences">Experiences</Link>
          <Link href="/rumour-check">Rumour check</Link>
          <Suspense>
            <AccountNav />
          </Suspense>
        </nav>
      </header>
      {children}
      <footer>
        <p>Group 8 · INT252/257 · Official drive data and verified senior experiences.</p>
      </footer>
    </>
  );
}
