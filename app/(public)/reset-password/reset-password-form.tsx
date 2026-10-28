"use client";

import { useActionState, useState } from "react";
import { z } from "zod";
import { updatePassword, type AuthState } from "@/app/_actions/auth";
import { FieldError, FormMessage, input, label } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import { cn } from "@/lib/cn";
import { credentialsSchema } from "@/lib/schemas";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, {} as AuthState);
  const [clientErrors, setClientErrors] = useState<AuthState["fieldErrors"]>();

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = credentialsSchema.shape.password.safeParse(data.get("password"));
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors({ password: [z.flattenError(parsed.error).formErrors[0] ?? "Enter a valid password"] });
      return;
    }
    if (data.get("password") !== data.get("confirm")) {
      event.preventDefault();
      setClientErrors({ password: ["Passwords do not match."] });
      return;
    }
    setClientErrors(undefined);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-5">
      <div>
        <label htmlFor="password" className={label}>
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={!!fieldErrors?.password}
          aria-describedby="password-error"
          className={cn(input, "mt-2")}
        />
        <FieldError id="password-error">{fieldErrors?.password?.[0]}</FieldError>
      </div>

      <div>
        <label htmlFor="confirm" className={label}>
          Repeat new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className={cn(input, "mt-2")}
        />
      </div>

      {state.error && <FormMessage ok={false}>{state.error}</FormMessage>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
