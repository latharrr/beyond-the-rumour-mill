import "server-only";
import { createClient } from "@/lib/supabase/server";

// Public experience reads go ONLY through the §1.3 definer views.

export type PublicExperience = {
  id: string;
  company_id: string;
  role_id: string;
  drive_id: string | null;
  rounds_summary: string | null;
  preparation_timeline: string | null;
  verified_at: string | null;
  created_at: string;
  grad_year: number | null;
  author_role: "student" | "alumni" | "admin" | null;
  has_evidence: boolean;
};

export const PUBLIC_EXPERIENCE_COLUMNS =
  "id, company_id, role_id, drive_id, rounds_summary, preparation_timeline, verified_at, created_at, grad_year, author_role, has_evidence";

/** Verified experiences for a drive's company + role; falls back to company-level. */
export async function listMatchedExperiences(companyId: string, roleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_experiences")
    .select(PUBLIC_EXPERIENCE_COLUMNS)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const all = data as PublicExperience[];
  const sameRole = all.filter((e) => e.role_id === roleId);
  return sameRole.length
    ? { scope: "role" as const, experiences: sameRole }
    : { scope: "company" as const, experiences: all };
}
