"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/app/_actions/account";
import { FieldError, FormMessage, input, label } from "@/components/ui/field";
import { card } from "@/components/ui/surface";
import type { ActionState } from "@/lib/action-result";
import { cn } from "@/lib/cn";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, null as ActionState);
  const error = state && !state.ok ? state : null;

  return (
    <section aria-labelledby="delete-account" className={cn(card, "border-rumour/25 p-5 md:p-6")}>
      <form action={action} className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end md:gap-8">
        <div>
          <h2 id="delete-account" className="type-title text-ink">
            Delete account
          </h2>
          <p className="mt-2 type-small text-pretty text-ink-muted">
            Removes your profile, prep plans and uploaded evidence. Experiences you shared stay on the site without your
            name, shown as &ldquo;Former student&rdquo;. This can&rsquo;t be undone.
          </p>
        </div>
        <div className="grid gap-3">
          <div>
            <label htmlFor="confirm" className={label}>
              Type DELETE to confirm
            </label>
            <input id="confirm" name="confirm" autoComplete="off" aria-describedby="confirm-error" className={cn(input, "mt-2")} />
            <FieldError id="confirm-error">{error?.fieldErrors?.confirm?.[0]}</FieldError>
          </div>
          {error && !error.fieldErrors && <FormMessage ok={false}>{error.message}</FormMessage>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-full border border-rumour/40 px-6 text-[15px] font-medium text-ink transition-colors duration-200 hover:bg-rumour/10 disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </form>
    </section>
  );
}
