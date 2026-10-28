import "server-only";
import { cache } from "react";
import type { EligibilityProfile } from "@/lib/eligibility";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type MyProfile = EligibilityProfile & { id: string; role: "student" | "alumni" | "admin" };

/** The signed-in user's profile (RLS: own row), or null when signed out. */
export const getMyProfile = cache(async function getMyProfile(): Promise<MyProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, branch_id, cgpa, backlogs, pct_10th, pct_12th, grad_year")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data as MyProfile | null;
});
