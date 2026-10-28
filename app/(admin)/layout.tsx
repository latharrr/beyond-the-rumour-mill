import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { AreaNav } from "@/components/nav/AreaNav";
import { LoadingState } from "@/components/route-states";
import { requireAdmin } from "@/lib/auth";

// Server-side role gate (§2.1). The proxy only checks for a session; this
// layout checks is_admin() on every request and redirects non-admins.
// Under Cache Components the session read must sit inside <Suspense>;
// nothing admin-specific (the admin tabs included) renders until the gate
// resolves. The public site frame around it reveals nothing.
// The role gate must block on the server: no instant/prefetched admin shell.
export const instant = false;

export const metadata: Metadata = { robots: { index: false, follow: false } };

const ITEMS = [
  { href: "/admin", label: "Verification queue", exact: true },
  { href: "/admin/drives", label: "Drives" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SiteChrome>
      <Suspense fallback={<LoadingState label="Checking access…" />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </SiteChrome>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AreaNav label="Admin" items={ITEMS} />
      {children}
    </>
  );
}
