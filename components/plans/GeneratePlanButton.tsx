"use client";

import { useActionState } from "react";
import { generatePlan } from "@/app/_actions/plans";
import type { ActionState } from "@/lib/action-result";

/** Drive-page CTA. On success the action redirects to the new plan. */
export function GeneratePlanButton({ driveId, existing }: { driveId: string; existing: boolean }) {
  const [state, action, pending] = useActionState(generatePlan, null as ActionState<{ id: string }>);
  return (
    <form action={action}>
      <input type="hidden" name="drive_id" value={driveId} />
      {existing && <p>Regenerating replaces your current plan for this drive and resets its progress.</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Building your plan…" : existing ? "Regenerate my prep plan" : "Generate my prep plan"}
      </button>
      {state && !state.ok && <p role="alert">{state.message}</p>}
    </form>
  );
}
