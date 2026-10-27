import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Data Access Layer for identity and role. Every check reads the verified
// session server-side; nothing here trusts client input.

export type SessionUser = { id: string; email: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
}

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// Fresh is_admin() round-trip on every call: layouts do not protect Server
// Actions, so admin actions must call this themselves (§2.1).
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!(await isAdmin())) redirect("/");
  return user;
}
