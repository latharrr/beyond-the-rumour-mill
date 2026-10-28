"use client";

import { useActionState } from "react";
import { generatePlan } from "@/app/_actions/plans";
import { FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import type { ActionState } from "@/lib/action-result";

/** Drive-page CTA. On success the action redirects to the new plan. */
export function GeneratePlanButton({ driveId, existing }: { driveId: string; existing: boolean }) {
  const [state, action, pending] = useActionState(generatePlan, null as ActionState<{ id: string }>);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="drive_id" value={driveId} />
      {existing && <p className="type-small text-ink-muted">Regenerating replaces your current plan for this drive and resets its progress.</p>}
      <Button type="submit" variant={existing ? "secondary" : "primary"} disabled={pending} className="w-full">
        {pending ? "Building your plan…" : existing ? "Regenerate my prep plan" : "Generate my prep plan"}
      </Button>
      {state && !state.ok && <FormMessage ok={false}>{state.message}</FormMessage>}
    </form>
  );
}
