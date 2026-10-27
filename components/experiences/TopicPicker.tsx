"use client";

import { useState } from "react";
import { type SearchableTopic, useTopicSearch } from "@/hooks/useTopicSearch";

type Props = {
  topics: SearchableTopic[];
  name: string;
  /** Single = radio-style picker (rumour check); multiple = tag picker (submit). */
  multiple?: boolean;
  defaultSelected?: string[];
  label: string;
  error?: string;
};

/** Search-as-you-type topic picker; submits chosen ids as `name` form fields. */
export function TopicPicker({ topics, name, multiple = false, defaultSelected = [], label, error }: Props) {
  const { query, setQuery, results } = useTopicSearch(topics);
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const toggle = (id: string) =>
    setSelected((s) => (multiple ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));
  const byId = new Map(topics.map((t) => [t.id, t]));

  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend>{label}</legend>
      {selected.map((id) => <input key={id} type="hidden" name={name} value={id} />)}
      <label htmlFor={`${name}-search`}>Search topics</label>
      <input id={`${name}-search`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. DP, OS, SQL" autoComplete="off" />
      {selected.length > 0 && (
        <p>Selected: {selected.map((id) => byId.get(id)?.label).filter(Boolean).join(", ")}</p>
      )}
      {results.length === 0 ? (
        <p>No topics match “{query}”.</p>
      ) : (
        <ul>
          {results.slice(0, 40).map((t) => (
            <li key={t.id}>
              <label>
                <input type={multiple ? "checkbox" : "radio"} name={`${name}-ui`} checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
                {t.label} <small>({t.category})</small>
              </label>
            </li>
          ))}
        </ul>
      )}
      {error && <p id={`${name}-error`} role="alert">{error}</p>}
    </fieldset>
  );
}
