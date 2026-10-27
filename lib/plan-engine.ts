// §2.4 plan engine, steps 2–6: pure compute, no I/O. The loader
// (lib/data/plans.ts) gathers the inputs; generatePlan saves the output via
// save_plan.

export const TOP_TOPICS = 12;
export const DECAY_DAYS = 365;
export const DEFAULT_WEEKS = 4;
const DAY_MS = 86_400_000;

export type EngineExperience = { id: string; company_id: string; role_id: string; created_at: string };
export type EngineTopicLink = { experience_id: string; topic_id: string };
export type EngineTopic = { id: string; label: string };
export type EngineResource = { id: string; topic_id: string | null };
export type EngineRound = { id: string; name: string; position: number; topic_ids: string[]; resource_ids: string[] };

export type PlanScope = "role" | "company" | "rounds";

export type TopicWeight = {
  topic_id: string;
  count: number;
  /** Newest experience mentioning the topic; null for the round_topics fallback. */
  newest: string | null;
  weight: number;
};

export type PlanItemDraft = {
  topic_id: string;
  position: number;
  week: number;
  label: string;
  resource_ids: string[];
};

export type PlanDraft = {
  scope: PlanScope;
  weeks: number;
  items: PlanItemDraft[];
  /** Provenance for plan_experiences: the verified experiences the plan was built from. */
  experience_ids: string[];
};

/** Step 2: role-level experiences, else company-level, else none (→ round_topics). */
export function selectExperiences(
  experiences: EngineExperience[],
  companyId: string,
  roleId: string,
): { scope: PlanScope; experiences: EngineExperience[] } {
  const company = experiences.filter((e) => e.company_id === companyId);
  const role = company.filter((e) => e.role_id === roleId);
  if (role.length) return { scope: "role", experiences: role };
  if (company.length) return { scope: "company", experiences: company };
  return { scope: "rounds", experiences: [] };
}

export const ageDays = (iso: string, now: Date) => Math.max(0, (now.getTime() - new Date(iso).getTime()) / DAY_MS);

/** Step 3: weight = count × exp(−age_days / 365), age of the newest mention. */
export function weighTopics(experiences: EngineExperience[], links: EngineTopicLink[], now: Date): TopicWeight[] {
  const byId = new Map(experiences.map((e) => [e.id, e]));
  const acc = new Map<string, { count: number; newest: string }>();
  for (const l of links) {
    const e = byId.get(l.experience_id);
    if (!e) continue;
    const t = acc.get(l.topic_id);
    if (!t) acc.set(l.topic_id, { count: 1, newest: e.created_at });
    else {
      t.count += 1;
      if (e.created_at > t.newest) t.newest = e.created_at;
    }
  }
  return [...acc].map(([topic_id, { count, newest }]) => ({
    topic_id,
    count,
    newest,
    weight: count * Math.exp(-ageDays(newest, now) / DECAY_DAYS),
  }));
}

/** Step 2 fallback: the drive's round_topics, weighted by how many rounds list them. */
export function weighRoundTopics(rounds: EngineRound[]): TopicWeight[] {
  const acc = new Map<string, number>();
  for (const r of [...rounds].sort((a, b) => a.position - b.position))
    for (const t of r.topic_ids) acc.set(t, (acc.get(t) ?? 0) + 1);
  return [...acc].map(([topic_id, count]) => ({ topic_id, count, newest: null, weight: count }));
}

/** Step 4: top N by weight; ties by count, then label (deterministic). */
export function topTopics(weights: TopicWeight[], labels: Map<string, string>, n = TOP_TOPICS): TopicWeight[] {
  const label = (id: string) => labels.get(id) ?? id;
  return [...weights]
    .sort((a, b) => b.weight - a.weight || b.count - a.count || label(a.topic_id).localeCompare(label(b.topic_id)))
    .slice(0, n);
}

/** Step 5: resources(topic_id) ∪ round_resources of this drive's rounds that cover the topic. */
export function resourcesForTopic(topicId: string, resources: EngineResource[], rounds: EngineRound[]): string[] {
  const ids = new Set(resources.filter((r) => r.topic_id === topicId).map((r) => r.id));
  for (const r of rounds) if (r.topic_ids.includes(topicId)) for (const id of r.resource_ids) ids.add(id);
  return [...ids].sort();
}

/** Step 6: weeks until the drive; null or past drive date → 4. */
export function planWeeks(driveDate: string | null, now: Date): number {
  if (!driveDate) return DEFAULT_WEEKS;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = (Date.parse(`${driveDate}T00:00:00Z`) - today) / DAY_MS;
  if (Number.isNaN(days) || days < 0) return DEFAULT_WEEKS;
  return Math.max(1, Math.ceil(days / 7));
}

/** Step 6: contiguous chunks, highest weight first. Returns the week (1-based) per index. */
export function chunkIntoWeeks(count: number, weeks: number): number[] {
  const size = Math.max(1, Math.ceil(count / Math.max(1, weeks)));
  return Array.from({ length: count }, (_, i) => Math.floor(i / size) + 1);
}

function itemLabel(topic: string, w: TopicWeight, scope: PlanScope, total: number) {
  if (scope === "rounds") return `${topic} — listed in this drive's rounds`;
  return `${topic} — asked in ${w.count} of ${total} verified experience${total === 1 ? "" : "s"}`;
}

export type EngineInput = {
  drive: { company_id: string; role_id: string; drive_date: string | null };
  rounds: EngineRound[];
  experiences: EngineExperience[];
  links: EngineTopicLink[];
  topics: EngineTopic[];
  resources: EngineResource[];
  now: Date;
};

/** Steps 2–6 end to end. */
export function buildPlan(input: EngineInput): PlanDraft {
  const { drive, rounds, links, topics, resources, now } = input;
  let { scope, experiences } = selectExperiences(input.experiences, drive.company_id, drive.role_id);
  const labels = new Map(topics.map((t) => [t.id, t.label]));
  let weights = scope === "rounds" ? [] : weighTopics(experiences, links, now);
  // Experiences with no tagged topics teach nothing: same as having none.
  if (!weights.length) {
    scope = "rounds";
    experiences = [];
    weights = weighRoundTopics(rounds);
  }
  const top = topTopics(weights, labels, TOP_TOPICS);
  const weeks = planWeeks(drive.drive_date, now);
  const weekOf = chunkIntoWeeks(top.length, weeks);

  return {
    scope,
    weeks,
    items: top.map((w, i) => ({
      topic_id: w.topic_id,
      position: i + 1,
      week: weekOf[i],
      label: itemLabel(labels.get(w.topic_id) ?? "Topic", w, scope, experiences.length),
      resource_ids: resourcesForTopic(w.topic_id, resources, rounds),
    })),
    experience_ids: experiences.map((e) => e.id),
  };
}
