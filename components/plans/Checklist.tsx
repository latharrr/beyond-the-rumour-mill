"use client";

import { useCallback, useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { toggleChecklistItem } from "@/app/_actions/plans";
import { FormMessage } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/surface";
import type { PlanItem } from "@/lib/preparation/data";
import { ChecklistContext } from "./ChecklistContext";
import { ProgressBar } from "./PlanSummary";
import { WeeklyBuckets } from "./WeeklyBuckets";

/**
 * Plan checklist grouped by week. Toggles show instantly (useOptimistic) and
 * roll back to the server state if the single-row update fails. Items read
 * `toggle` from ChecklistContext.
 */
export function Checklist({ items, startedAt, currentWeek }: { items: PlanItem[]; startedAt?: string | null; currentWeek?: number | null }) {
  const [optimistic, setOptimistic] = useOptimistic(items, (state, change: { id: string; done: boolean }) =>
    state.map((i) => (i.id === change.id ? { ...i, done: change.done } : i)),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = optimistic.filter((i) => i.done).length;
  useEffect(() => {
    if (!isPending) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isPending]);

  // useCallback keeps `toggle` the same function between renders, so the
  // memoised context value (and every memo'd ChecklistItem) stays stable.
  const toggle = useCallback(
    (id: string, value: boolean) => {
      setError(null);
      startTransition(async () => {
        setOptimistic({ id, done: value });
        try {
          const res = await toggleChecklistItem({ id, done: value });
          if (!res.ok) setError(res.message);
        } catch {
          setError("Could not save your progress. Check your connection and try again.");
        }
      });
    },
    [setOptimistic],
  );
  const context = useMemo(() => ({ toggle, saving: isPending }), [toggle, isPending]);

  if (!items.length) return <EmptyState title="This plan has no items." />;

  return (
    <section aria-labelledby="checklist" aria-busy={isPending}>
      <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="checklist" className="type-title text-ink">
            Checklist
          </h2>
          <p role="status" className="type-data text-[15px] text-ink">
            {done} of {optimistic.length} done
          </p>
        </div>
        <p role="status" aria-live="polite" className="mt-2 type-small text-ink-muted">{isPending ? "Saving progress..." : error ? "Progress not saved" : "Progress saved"}</p>
        <ProgressBar value={done} max={optimistic.length} label="Plan progress" className="mt-4" />
        {error && (
          <div className="mt-4">
            <FormMessage ok={false}>{error}</FormMessage>
          </div>
        )}
      </div>
      <div className="mt-4">
        <ChecklistContext value={context}>
          <WeeklyBuckets items={optimistic} startedAt={startedAt} currentWeek={currentWeek} />
        </ChecklistContext>
      </div>
    </section>
  );
}
