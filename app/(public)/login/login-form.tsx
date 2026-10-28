"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp, type AuthState } from "@/app/_actions/auth";
import { z } from "zod";
import { FieldError, FormMessage, input, label } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import { cn } from "@/lib/cn";
import { credentialsSchema } from "@/lib/schemas";

type Mode = "signin" | "signup";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const linkError = params.get("error") === "confirm" ? "That confirmation link is invalid or has expired. Sign in, or sign up again." : null;
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signInAction, signingIn] = useActionState(signIn, {} as AuthState);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, {} as AuthState);
  const [clientErrors, setClientErrors] = useState<AuthState["fieldErrors"]>();

  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;
  const fieldErrors = clientErrors ?? state.fieldErrors;

  // Client pre-validation with the same schema the server enforces.
  function validate(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = credentialsSchema.safeParse({ email: data.get("email"), password: data.get("password") });
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
    } else {
      setClientErrors(undefined);
    }
  }

  return (
    <form action={mode === "signin" ? signInAction : signUpAction} onSubmit={validate} noValidate className="grid gap-5">
      <div>
        <h2 className="type-title text-ink">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="mt-1 type-small text-ink-muted">
          {mode === "signin" ? "Use the email you signed up with." : "We'll send a confirmation link to your email."}
        </p>
      </div>
      <input type="hidden" name="next" value={next} />

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
          aria-invalid={!!fieldErrors?.email}
          aria-describedby="email-error"
          className={cn(input, "mt-2")}
        />
        <FieldError id="email-error">{fieldErrors?.email?.[0]}</FieldError>
      </div>

      <div>
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          aria-invalid={!!fieldErrors?.password}
          aria-describedby="password-error"
          className={cn(input, "mt-2")}
        />
        <FieldError id="password-error">{fieldErrors?.password?.[0]}</FieldError>
      </div>

      {linkError && !state.error && <FormMessage ok={false}>{linkError}</FormMessage>}
      {state.error && <FormMessage ok={false}>{state.error}</FormMessage>}
      {state.message && <FormMessage ok>{state.message}</FormMessage>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>
      <p className="border-t border-line pt-5 text-center type-small text-ink-muted">
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setClientErrors(undefined);
          }}
          className="hit-44 font-medium text-ink underline decoration-ink-dim underline-offset-4 hover:decoration-ink"
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </p>
    </form>
  );
}
