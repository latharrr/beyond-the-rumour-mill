"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleChecklistItem } from "@/app/_actions/plans";
import type { PlanItem } from "@/lib/data/plans";
import { ChecklistItem } from "./ChecklistItem";
import { WeeklyBuckets } from "./WeeklyBuckets";

/**
 * Plan checklist grouped by week. Toggles show instantly (useOptimistic) and
 * roll back to the server state if the single-row update fails (§3.4).
 */
export function Checklist({ items }: { items: PlanItem[] }) {
  const [optimistic, setOptimistic] = useOptimistic(items, (state, change: { id: string; done: boolean }) =>
    state.map((i) => (i.id === change.id ? { ...i, done: change.done } : i)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = optimistic.filter((i) => i.done).length;

  function toggle(id: string, value: boolean) {
    setError(null);
    startTransition(async () => {
      setOptimistic({ id, done: value });
      const res = await toggleChecklistItem({ id, done: value });
      if (!res.ok) setError(res.message);
    });
  }

  if (!items.length) return <p>This plan has no items.</p>;

  return (
    <section aria-labelledby="checklist">
      <h2 id="checklist">Checklist</h2>
      <p role="status">
        {done} of {optimistic.length} done
      </p>
      <progress value={done} max={optimistic.length} aria-label="Plan progress" />
      {error && <p role="alert">{error}</p>}
      <WeeklyBuckets
        items={optimistic}
        renderItem={(item) => <ChecklistItem key={item.id} item={item} onToggle={(value) => toggle(item.id, value)} />}
      />
    </section>
  );
}
