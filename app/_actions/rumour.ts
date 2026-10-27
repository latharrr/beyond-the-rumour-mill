"use server";

import { type ActionResult, type ActionState, invalid, ok, fail } from "@/lib/action-result";
import { type ClaimResult, checkClaimVerdict } from "@/lib/rumour";
import { claimSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type ClaimCheck = ClaimResult & {
  company: string;
  topic: string;
  cited: { id: string; rounds_summary: string | null; created_at: string | null }[];
};

/**
 * §2.5 checkClaim — anyone (no sign-in): "<company> heavily asks <topic>".
 * Deterministic: share of verified experiences for the company that are
 * tagged with the topic. Reads only the public definer views.
 */
export async function checkClaim(_prev: ActionState<ClaimCheck>, formData: FormData): Promise<ActionResult<ClaimCheck>> {
  const parsed = claimSchema.safeParse({ company_id: formData.get("company_id"), topic_id: formData.get("topic_id") });
  if (!parsed.success) return invalid(parsed.error);
  const { company_id, topic_id } = parsed.data;

  const supabase = await createClient();
  const [company, topic, exps] = await Promise.all([
    supabase.from("companies").select("name").eq("id", company_id).maybeSingle(),
    supabase.from("topics").select("label").eq("id", topic_id).maybeSingle(),
    supabase.from("public_experiences").select("id, rounds_summary, created_at").eq("company_id", company_id).order("created_at", { ascending: false }),
  ]);
  if (company.error || topic.error || exps.error) return fail("Could not check that claim. Please try again.");
  if (!company.data || !topic.data) return fail("Choose a company and topic from the lists.");

  const ids = exps.data.map((e) => e.id);
  const links = ids.length
    ? await supabase.from("public_experience_topics").select("experience_id").eq("topic_id", topic_id).in("experience_id", ids)
    : { data: [], error: null };
  if (links.error) return fail("Could not check that claim. Please try again.");

  const result = checkClaimVerdict(ids, links.data.map((l) => l.experience_id));
  const cited = new Set(result.cites);
  return ok({
    ...result,
    company: company.data.name,
    topic: topic.data.label,
    cited: exps.data.filter((e) => cited.has(e.id)),
  });
}
