"use client";

import { useState } from "react";
import { CloseIcon } from "@/components/icons";
import { FieldError, input, label as labelClass } from "@/components/ui/field";
import { type SearchableTopic, useTopicSearch } from "@/hooks/useTopicSearch";
import { cn } from "@/lib/cn";

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
  const errorId = `${name}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
      <legend className={labelClass}>{label}</legend>
      {selected.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <label htmlFor={`${name}-search`} className="sr-only">
        Search topics
      </label>
      <input
        id={`${name}-search`}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search topics, e.g. DP, OS, SQL"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        className={cn(input, "mt-2")}
      />

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="sr-only">Selected:</span>
          {selected.map((id) => (
            <span key={id} className="inline-flex h-8 items-center gap-1 rounded-full border border-white/16 bg-panel-2 pr-1 pl-3 text-[13px] text-ink">
              {byId.get(id)?.label}
              {multiple && (
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="grid size-6 place-items-center rounded-full text-ink-muted hover:bg-white/10 hover:text-ink"
                >
                  <CloseIcon className="size-3.5" />
                  <span className="sr-only">Remove {byId.get(id)?.label}</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {results.length === 0 ? (
        <p className="mt-3 type-small text-ink-muted">No topics match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="mt-3 max-h-60 overflow-y-auto overscroll-contain rounded-[10px] border border-line bg-ground/40 p-1">
          {results.slice(0, 40).map((t) => {
            const on = selected.includes(t.id);
            return (
              <li key={t.id}>
                <label
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-[15px] transition-colors duration-150 md:min-h-10",
                    on ? "bg-panel-2 text-ink" : "text-ink-muted hover:bg-panel hover:text-ink",
                  )}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={`${name}-ui`}
                    checked={on}
                    onChange={() => toggle(t.id)}
                    className="size-4 shrink-0 accent-amber"
                  />
                  <span className="min-w-0 flex-1 truncate">{t.label}</span>
                  <small className="shrink-0 type-label text-ink-dim">{t.category}</small>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}
