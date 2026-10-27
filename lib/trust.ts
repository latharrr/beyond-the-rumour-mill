// §2.6 TrustScore: pure, unit-tested.
//
//   raw = 0.4 × exp(-age_days / 365)                     recency
//       + 0.4 × (peers sharing ≥1 topic / total peers)   corroboration (0 if no peers)
//       + 0.2 × (fields filled / 5)                      completeness
//   trustScore = round(100 × raw)                        0–100
//
// Peers = the other verified experiences for the same company.
// Completeness fields: rounds_summary, preparation_timeline, ≥2 topics,
// ≥1 resource, evidence. Evidence is a boolean computed server-side
// (public_experiences.has_evidence); the path never leaves the server.

export const RECENCY_WEIGHT = 0.4;
export const CORROBORATION_WEIGHT = 0.4;
export const COMPLETENESS_WEIGHT = 0.2;
export const RECENCY_DAYS = 365;
export const COMPLETENESS_FIELDS = 5;
const DAY_MS = 86_400_000;

export type TrustInput = {
  id: string;
  created_at: string;
  rounds_summary: string | null;
  preparation_timeline: string | null;
  topic_ids: string[];
  resource_count: number;
  has_evidence: boolean;
};

export type TrustBreakdown = {
  recency: number;
  corroboration: number;
  completeness: number;
  raw: number;
  score: number;
};

const filled = (s: string | null) => !!s && s.trim().length > 0;

export function ageDays(createdAt: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(createdAt).getTime()) / DAY_MS);
}

export function recency(exp: Pick<TrustInput, "created_at">, now: Date): number {
  return Math.exp(-ageDays(exp.created_at, now) / RECENCY_DAYS);
}

export function corroboration(exp: Pick<TrustInput, "id" | "topic_ids">, companyExps: Pick<TrustInput, "id" | "topic_ids">[]): number {
  const peers = companyExps.filter((p) => p.id !== exp.id);
  if (peers.length === 0) return 0;
  const mine = new Set(exp.topic_ids);
  const sharing = peers.filter((p) => p.topic_ids.some((t) => mine.has(t))).length;
  return sharing / peers.length;
}

export function completeness(exp: TrustInput): number {
  const fields = [
    filled(exp.rounds_summary),
    filled(exp.preparation_timeline),
    exp.topic_ids.length >= 2,
    exp.resource_count >= 1,
    exp.has_evidence,
  ];
  return fields.filter(Boolean).length / COMPLETENESS_FIELDS;
}

export function trustBreakdown(exp: TrustInput, companyExps: TrustInput[], now: Date = new Date()): TrustBreakdown {
  const r = recency(exp, now);
  const c = corroboration(exp, companyExps);
  const k = completeness(exp);
  const raw = RECENCY_WEIGHT * r + CORROBORATION_WEIGHT * c + COMPLETENESS_WEIGHT * k;
  return { recency: r, corroboration: c, completeness: k, raw, score: Math.round(100 * raw) };
}

export const trustScore = (exp: TrustInput, companyExps: TrustInput[], now: Date = new Date()) =>
  trustBreakdown(exp, companyExps, now).score;
