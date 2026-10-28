"use client";

import { useActionState, useState } from "react";
import { z } from "zod";
import { requestPasswordReset, type AuthState } from "@/app/_actions/auth";
import { FieldError, FormMessage, input, label } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import { cn } from "@/lib/cn";
import { credentialsSchema } from "@/lib/schemas";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {} as AuthState);
  const [clientError, setClientError] = useState<string>();

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = credentialsSchema.shape.email.safeParse(data.get("email"));
    if (!parsed.success) {
      event.preventDefault();
      setClientError(z.flattenError(parsed.error).formErrors[0] ?? "Enter a valid email address");
    } else {
      setClientError(undefined);
    }
  }

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-5">
      <div>
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          required
          aria-invalid={!!clientError || !!state.fieldErrors?.email}
          aria-describedby="email-error"
          className={cn(input, "mt-2")}
        />
        <FieldError id="email-error">{clientError ?? state.fieldErrors?.email?.[0]}</FieldError>
      </div>

      {state.error && <FormMessage ok={false}>{state.error}</FormMessage>}
      {state.message && <FormMessage ok>{state.message}</FormMessage>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
