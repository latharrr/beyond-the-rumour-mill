import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";

// Server-side role gate (§2.1). The proxy only checks for a session; this
// layout checks is_admin() on every request and redirects non-admins.
// Under Cache Components the session read must sit inside <Suspense>;
// children render only after the gate resolves.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p>Checking access…</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
