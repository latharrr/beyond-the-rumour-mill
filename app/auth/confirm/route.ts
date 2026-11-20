import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { NEXT_COOKIE, safeNextPath } from "@/lib/validation";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/db/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "invite", "magiclink", "recovery", "email_change"];

// Email confirmation link target (token_hash flow). Verifies the one-time
// token server-side, which sets the session cookie, then continues to `next`.
// Absolute redirects are built from SITE_URL, never request.url: behind a
// reverse proxy request.url carries the internal origin (e.g. localhost:3100),
// which would send the user's browser to an address it cannot reach.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const jar = await cookies();
  const saved = safeNextPath(jar.get(NEXT_COOKIE)?.value, "");
  const fallback = type === "recovery" ? "/reset-password" : saved ? `/onboarding?next=${encodeURIComponent(saved)}` : "/onboarding";
  const next = safeNextPath(searchParams.get("next"), fallback);

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      jar.delete(NEXT_COOKIE);
      return NextResponse.redirect(new URL(next, SITE_URL));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", SITE_URL));
}
