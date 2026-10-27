import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/sign-out-button";

// Sidebar for signed-in student pages (§3.1). The proxy guarantees a session
// on every route in this group; data reads still go through RLS.
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <aside>
        <nav aria-label="Student">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/onboarding">Profile</Link>
          <Link href="/drives">Browse drives</Link>
          <SignOutButton />
        </nav>
      </aside>
      {children}
    </>
  );
}
