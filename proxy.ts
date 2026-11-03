import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/db/proxy";

// Session check only. Role checks live in (admin)/layout.tsx and in
// every admin Server Action.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Runs on every app route so the session cookie stays fresh on public pages
  // too; the redirect itself applies only to protected paths (isProtectedPath).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
