import "server-only";
import { checkClaimVerdict, type ClaimResult, type Verdict } from "@/lib/rumour";
import { createClient } from "@/lib/supabase/server";
import type { Company, Topic } from "./taxonomy";

/** A real claim and its real verdict, for the landing page's claim bar. */
export type ClaimExample = {
  companyId: string;
  topicId: string;
  company: string;
  topic: string;
  verdict: Verdict;
  cited: number;
  total: number;
  lowSample: boolean;
};

const toExample = (company: Company, topic: Topic, r: ClaimResult): ClaimExample => ({
  companyId: company.id,
  topicId: topic.id,
  company: company.name,
  topic: topic.label,
  verdict: r.verdict,
  cited: r.cites.length,
  total: r.total,
  lowSample: r.lowSample,
});

/**
 * Picks claims worth checking, each verdict computed exactly as `checkClaim`
 * does (same public views, same rule). Per company: its most-mentioned topic,
 * a topic in the mixed band, and a topic asked widely elsewhere that this one
 * rarely asks (the shape a rumour usually takes). Interleaved so the
 * verdicts vary from one claim to the next. With no verified experiences yet,
 * it falls back to plain claims whose honest verdict is "no evidence yet".
 */
export async function listClaimExamples(companies: Company[], topics: Topic[], limit = 6): Promise<ClaimExample[]> {
  if (companies.length === 0 || topics.length === 0) return [];
  const supabase = await createClient();
  const [exps, links] = await Promise.all([
    supabase.from("public_experiences").select("id, company_id"),
    supabase.from("public_experience_topics").select("experience_id, topic_id"),
  ]);
  if (exps.error) throw exps.error;
  if (links.error) throw links.error;

  const expsByCompany = new Map<string, string[]>();
  for (const e of exps.data) {
    if (!e.id || !e.company_id) continue;
    expsByCompany.set(e.company_id, [...(expsByCompany.get(e.company_id) ?? []), e.id]);
  }
  const linkedByTopic = new Map<string, string[]>();
  for (const l of links.data) {
    if (!l.experience_id || !l.topic_id) continue;
    linkedByTopic.set(l.topic_id, [...(linkedByTopic.get(l.topic_id) ?? []), l.experience_id]);
  }

  const withEvidence = companies
    .filter((c) => (expsByCompany.get(c.id)?.length ?? 0) > 0)
    .sort((a, b) => (expsByCompany.get(b.id)?.length ?? 0) - (expsByCompany.get(a.id)?.length ?? 0));

  if (withEvidence.length === 0) {
    const empty = checkClaimVerdict([], []);
    return companies.slice(0, limit).map((c, i) => toExample(c, topics[i % topics.length], empty));
  }

  // How widely a topic is asked across all companies: mentions × companies that mention it.
  const companyOf = new Map(exps.data.map((e) => [e.id, e.company_id]));
  const reach = new Map(
    topics.map((t) => {
      const linked = linkedByTopic.get(t.id) ?? [];
      return [t.id, linked.length * new Set(linked.map((id) => companyOf.get(id))).size];
    }),
  );
  const kinds = ["Not supported", "Supported", "Mixed evidence"] as const;

  const picks = withEvidence.map((company) => {
    const ids = expsByCompany.get(company.id) ?? [];
    const scored = topics.map((topic) => ({ topic, result: checkClaimVerdict(ids, linkedByTopic.get(topic.id) ?? []) }));
    const best = (kind: Verdict, score: (s: (typeof scored)[number]) => number) =>
      scored.filter((s) => s.result.verdict === kind).sort((a, b) => score(b) - score(a))[0];
    return {
      "Supported": best("Supported", (s) => s.result.frac),
      "Mixed evidence": best("Mixed evidence", (s) => -Math.abs(s.result.frac - 1 / 3)),
      "Not supported": best("Not supported", (s) => reach.get(s.topic.id) ?? 0),
    };
  });

  const out: ClaimExample[] = [];
  for (let round = 0; round < kinds.length; round++) {
    withEvidence.forEach((company, i) => {
      const pick = picks[i][kinds[(round + i) % kinds.length]];
      if (pick) out.push(toExample(company, pick.topic, pick.result));
    });
  }
  return out.slice(0, limit);
}
