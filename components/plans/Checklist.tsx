"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toggleChecklistItem } from "@/app/_actions/plans";
import { FormMessage } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/surface";
import type { PlanItem } from "@/lib/data/plans";
import { ChecklistItem } from "./ChecklistItem";
import { ProgressBar } from "./PlanSummary";
import { WeeklyBuckets } from "./WeeklyBuckets";

/**
 * Plan checklist grouped by week. Toggles show instantly (useOptimistic) and
 * roll back to the server state if the single-row update fails (§3.4).
 */
export function Checklist({ items, startedAt, currentWeek }: { items: PlanItem[]; startedAt?: string | null; currentWeek?: number | null }) {
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

  if (!items.length) return <EmptyState title="This plan has no items." />;

  return (
    <section aria-labelledby="checklist">
      <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="checklist" className="type-title text-ink">
            Checklist
          </h2>
          <p role="status" className="type-data text-[15px] text-ink">
            {done} of {optimistic.length} done
          </p>
        </div>
        <ProgressBar value={done} max={optimistic.length} label="Plan progress" className="mt-4" />
        {error && (
          <div className="mt-4">
            <FormMessage ok={false}>{error}</FormMessage>
          </div>
        )}
      </div>
      <div className="mt-4">
        <WeeklyBuckets
          items={optimistic}
          startedAt={startedAt}
          currentWeek={currentWeek}
          renderItem={(item) => <ChecklistItem key={item.id} item={item} onToggle={(value) => toggle(item.id, value)} />}
        />
      </div>
    </section>
  );
}
