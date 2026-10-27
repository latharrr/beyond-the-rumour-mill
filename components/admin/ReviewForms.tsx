"use client";

import { useActionState } from "react";
import { rejectExperience, verifyExperience } from "@/app/_actions/experiences";
import type { ActionState } from "@/lib/action-result";

export function ReviewForms({ experienceId }: { experienceId: string }) {
  const [verifyState, verify, verifying] = useActionState(verifyExperience, null as ActionState);
  const [rejectState, reject, rejecting] = useActionState(rejectExperience, null as ActionState);
  const done = verifyState?.ok ? verifyState : rejectState?.ok ? rejectState : null;
  if (done) return <p role="status">{done.message}</p>;

  return (
    <div>
      <form action={verify}>
        <input type="hidden" name="id" value={experienceId} />
        <button type="submit" disabled={verifying || rejecting}>{verifying ? "Verifying…" : "Verify"}</button>
        {verifyState && !verifyState.ok && <p role="alert">{verifyState.message}</p>}
      </form>
      <form action={reject}>
        <input type="hidden" name="id" value={experienceId} />
        <label htmlFor={`reason-${experienceId}`}>Rejection reason (shown to the student)</label>
        <input id={`reason-${experienceId}`} name="reason" />
        {rejectState && !rejectState.ok && <p role="alert">{rejectState.fieldErrors?.reason?.[0] ?? rejectState.message}</p>}
        <button type="submit" disabled={verifying || rejecting}>{rejecting ? "Rejecting…" : "Reject"}</button>
      </form>
    </div>
  );
}
