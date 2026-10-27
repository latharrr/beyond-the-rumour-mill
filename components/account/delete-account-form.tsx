"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/_actions/account";
import type { ActionState } from "@/lib/action-result";

// Bare form; styled in the design pass.
export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, null as ActionState);
  const error = state && !state.ok ? state : null;

  return (
    <form action={action}>
      <h2>Delete account</h2>
      <p>
        Removes your profile, prep plans and uploaded evidence. Experiences you shared stay on the site without your
        name, shown as &ldquo;Former student&rdquo;.
      </p>
      <label htmlFor="confirm">Type DELETE to confirm</label>
      <input id="confirm" name="confirm" autoComplete="off" aria-describedby="confirm-error" />
      {error?.fieldErrors?.confirm && <p id="confirm-error" role="alert">{error.fieldErrors.confirm[0]}</p>}
      {error && !error.fieldErrors && <p role="alert">{error.message}</p>}
      <button type="submit" disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</button>
    </form>
  );
}
