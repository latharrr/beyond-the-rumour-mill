import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Session check only (§2.1). Role checks live in (admin)/layout.tsx and in
// every admin Server Action.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Runs on every app route so the session cookie stays fresh on public pages
  // too; the redirect itself applies only to the §2.1 paths (isProtectedPath).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
