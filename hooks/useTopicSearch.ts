"use client";

import { useMemo, useState } from "react";

export type SearchableTopic = { id: string; label: string; category: string; aliases: string[] };

/**
 * Client-side search over topics.label + aliases (§2.5) — the only fuzzy
 * matching in the system, and it is search, not claim parsing.
 */
export function searchTopics<T extends SearchableTopic>(topics: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return topics;
  return topics.filter((t) => [t.label, ...t.aliases].some((s) => s.toLowerCase().includes(q)));
}

export function useTopicSearch<T extends SearchableTopic>(topics: T[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchTopics(topics, query), [topics, query]);
  return { query, setQuery, results };
}
