import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { AreaNav } from "@/components/nav/AreaNav";

// Signed-in student pages (§3.1). The proxy guarantees a session on every
// route in this group; data reads still go through RLS.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Profile" },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <SiteChrome>
      <AreaNav label="Student" items={ITEMS} />
      {children}
    </SiteChrome>
  );
}
