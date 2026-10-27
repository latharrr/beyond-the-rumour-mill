import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@/components/route-states";
import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/auth";

// Server-side role gate (§2.1). The proxy only checks for a session; this
// layout checks is_admin() on every request and redirects non-admins.
// Under Cache Components the session read must sit inside <Suspense>;
// nothing in the group (nav included) renders until the gate resolves.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState label="Checking access…" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <aside>
        <nav aria-label="Admin">
          <Link href="/admin">Verification queue</Link>
          <Link href="/admin/drives">Drives</Link>
          <SignOutButton />
        </nav>
      </aside>
      {children}
    </>
  );
}
