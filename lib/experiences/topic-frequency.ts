// Pure topic-frequency aggregation for /experiences (bars are a design-pass
// concern; this returns the numbers). Counts verified experiences per topic.

export type TopicRef = { id: string; label: string; category: string };
export type TopicFrequency = TopicRef & { count: number; share: number };

export function topicFrequency(
  experienceIds: string[],
  links: { experience_id: string; topic_id: string }[],
  topics: TopicRef[],
): TopicFrequency[] {
  const inScope = new Set(experienceIds);
  const counts = new Map<string, number>();
  for (const l of links) {
    if (inScope.has(l.experience_id)) counts.set(l.topic_id, (counts.get(l.topic_id) ?? 0) + 1);
  }
  const byId = new Map(topics.map((t) => [t.id, t]));
  const total = inScope.size;
  return [...counts.entries()]
    .flatMap(([id, count]) => {
      const t = byId.get(id);
      return t ? [{ ...t, count, share: total ? count / total : 0 }] : [];
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
