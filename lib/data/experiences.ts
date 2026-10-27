import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type TopicFrequency, topicFrequency } from "@/lib/topic-frequency";
import { type TrustInput, trustBreakdown, type TrustBreakdown } from "@/lib/trust";

// Public experience reads go ONLY through the §1.3 definer views
// (public_experiences, public_experience_topics, public_experience_resources,
// community_tips). Nothing here can return user_id or evidence_path.

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

type Named = { id: string; name?: string; label?: string };

export type ExperienceView = PublicExperience & {
  company: string;
  role: string;
  topics: { id: string; label: string }[];
  resources: { id: string; title: string; url: string; type: string }[];
  trust: TrustBreakdown;
};

export type CommunityTip = {
  id: string;
  company_id: string;
  role_id: string;
  rounds_summary: string | null;
  created_at: string;
  company: string;
  role: string;
};

async function loadVerified(filter?: { companyId?: string }) {
  const supabase = await createClient();
  let q = supabase.from("public_experiences").select(PUBLIC_EXPERIENCE_COLUMNS).order("created_at", { ascending: false });
  if (filter?.companyId) q = q.eq("company_id", filter.companyId);
  const [exps, links, resLinks, companies, roles, topics, resources] = await Promise.all([
    q,
    supabase.from("public_experience_topics").select("experience_id, topic_id"),
    supabase.from("public_experience_resources").select("experience_id, resource_id"),
    supabase.from("companies").select("id, name"),
    supabase.from("roles").select("id, label"),
    supabase.from("topics").select("id, label, category"),
    supabase.from("resources").select("id, title, url, type"),
  ]);
  for (const r of [exps, links, resLinks, companies, roles, topics, resources]) if (r.error) throw r.error;
  return {
    experiences: exps.data as PublicExperience[],
    links: links.data as { experience_id: string; topic_id: string }[],
    resLinks: resLinks.data as { experience_id: string; resource_id: string }[],
    companies: companies.data as Named[],
    roles: roles.data as Named[],
    topics: topics.data as { id: string; label: string; category: string }[],
    resources: resources.data as ExperienceView["resources"],
  };
}

function group<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>();
  for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
  return m;
}

/** Verified experiences with names, topics, resources and TrustScore (§2.6). */
function assemble(data: Awaited<ReturnType<typeof loadVerified>>, now = new Date()): ExperienceView[] {
  const topicIds = group(data.links, (l) => l.experience_id);
  const resIds = group(data.resLinks, (l) => l.experience_id);
  const name = (rows: Named[], id: string) => rows.find((r) => r.id === id)?.name ?? rows.find((r) => r.id === id)?.label ?? "Unknown";
  const topicById = new Map(data.topics.map((t) => [t.id, t]));
  const resById = new Map(data.resources.map((r) => [r.id, r]));

  const inputs = new Map<string, TrustInput>(
    data.experiences.map((e) => [e.id, {
      id: e.id,
      created_at: e.created_at,
      rounds_summary: e.rounds_summary,
      preparation_timeline: e.preparation_timeline,
      topic_ids: (topicIds.get(e.id) ?? []).map((l) => l.topic_id),
      resource_count: (resIds.get(e.id) ?? []).length,
      has_evidence: e.has_evidence,
    }]),
  );
  const byCompany = group(data.experiences, (e) => e.company_id);

  return data.experiences.map((e) => ({
    ...e,
    company: name(data.companies, e.company_id),
    role: name(data.roles, e.role_id),
    topics: (topicIds.get(e.id) ?? []).flatMap((l) => topicById.get(l.topic_id) ?? []).map(({ id, label }) => ({ id, label })),
    resources: (resIds.get(e.id) ?? []).flatMap((l) => resById.get(l.resource_id) ?? []),
    trust: trustBreakdown(inputs.get(e.id)!, (byCompany.get(e.company_id) ?? []).map((p) => inputs.get(p.id)!), now),
  }));
}

/**
 * Verified experiences + topic frequency for /experiences. TrustScore always
 * uses the full company peer set, even when the list is filtered.
 */
export async function listVerifiedExperiences(filter: { companyId?: string } = {}) {
  const data = await loadVerified();
  const all = assemble(data);
  const experiences = filter.companyId ? all.filter((e) => e.company_id === filter.companyId) : all;
  const frequency: TopicFrequency[] = topicFrequency(experiences.map((e) => e.id), data.links, data.topics);
  return { experiences, frequency };
}

export async function getVerifiedExperience(id: string): Promise<ExperienceView | null> {
  const data = await loadVerified();
  return assemble(data).find((e) => e.id === id) ?? null;
}

/** Pending submissions, no author info at all (community_tips view, §3.2). */
export async function listCommunityTips(filter: { companyId?: string } = {}): Promise<CommunityTip[]> {
  const supabase = await createClient();
  let q = supabase.from("community_tips").select("id, company_id, role_id, rounds_summary, created_at").order("created_at", { ascending: false });
  if (filter.companyId) q = q.eq("company_id", filter.companyId);
  const [tips, companies, roles] = await Promise.all([q, supabase.from("companies").select("id, name"), supabase.from("roles").select("id, label")]);
  for (const r of [tips, companies, roles]) if (r.error) throw r.error;
  return (tips.data as Omit<CommunityTip, "company" | "role">[]).map((t) => ({
    ...t,
    company: (companies.data as Named[]).find((c) => c.id === t.company_id)?.name ?? "Unknown",
    role: (roles.data as Named[]).find((r) => r.id === t.role_id)?.label ?? "Unknown",
  }));
}

/** Verified experiences for a drive's company + role; falls back to company-level. */
export async function listMatchedExperiences(companyId: string, roleId: string) {
  const { experiences } = await listVerifiedExperiences({ companyId });
  const sameRole = experiences.filter((e) => e.role_id === roleId);
  return sameRole.length
    ? { scope: "role" as const, experiences: sameRole }
    : { scope: "company" as const, experiences };
}
