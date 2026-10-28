"use client";

import { useActionState } from "react";
import { rejectExperience, verifyExperience } from "@/app/_actions/experiences";
import { FieldError, FormMessage, input, label } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import type { ActionState } from "@/lib/action-result";
import { cn } from "@/lib/cn";

export function ReviewForms({ experienceId }: { experienceId: string }) {
  const [verifyState, verify, verifying] = useActionState(verifyExperience, null as ActionState);
  const [rejectState, reject, rejecting] = useActionState(rejectExperience, null as ActionState);
  const done = verifyState?.ok ? verifyState : rejectState?.ok ? rejectState : null;
  if (done) return <FormMessage ok>{done.message}</FormMessage>;

  return (
    <div className="grid gap-5">
      <form action={verify} className="grid gap-2">
        <input type="hidden" name="id" value={experienceId} />
        <Button type="submit" disabled={verifying || rejecting} className="w-full">
          {verifying ? "Verifying…" : "Verify"}
        </Button>
        {verifyState && !verifyState.ok && <FormMessage ok={false}>{verifyState.message}</FormMessage>}
      </form>
      <form action={reject} className="grid gap-2 border-t border-line pt-5">
        <input type="hidden" name="id" value={experienceId} />
        <label htmlFor={`reason-${experienceId}`} className={label}>
          Rejection reason (shown to the student)
        </label>
        <input id={`reason-${experienceId}`} name="reason" aria-describedby={`reason-${experienceId}-error`} className={input} />
        <FieldError id={`reason-${experienceId}-error`}>
          {rejectState && !rejectState.ok ? (rejectState.fieldErrors?.reason?.[0] ?? rejectState.message) : undefined}
        </FieldError>
        <button
          type="submit"
          disabled={verifying || rejecting}
          className={cn(
            "inline-flex h-11 w-full items-center justify-center rounded-full border border-rumour/40 px-6 text-[15px] font-medium text-ink transition-colors duration-200 hover:bg-rumour/10 disabled:opacity-60",
          )}
        >
          {rejecting ? "Rejecting…" : "Reject"}
        </button>
      </form>
    </div>
  );
}
