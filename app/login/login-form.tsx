"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp, type AuthState } from "@/app/_actions/auth";
import { z } from "zod";
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
    <form action={mode === "signin" ? signInAction : signUpAction} onSubmit={validate} noValidate>
      <input type="hidden" name="next" value={next} />

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required
        aria-invalid={!!fieldErrors?.email} aria-describedby="email-error" />
      {fieldErrors?.email && <p id="email-error" role="alert">{fieldErrors.email[0]}</p>}

      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required
        autoComplete={mode === "signin" ? "current-password" : "new-password"}
        aria-invalid={!!fieldErrors?.password} aria-describedby="password-error" />
      {fieldErrors?.password && <p id="password-error" role="alert">{fieldErrors.password[0]}</p>}

      {linkError && !state.error && <p role="alert">{linkError}</p>}
      {state.error && <p role="alert">{state.error}</p>}
      {state.message && <p role="status">{state.message}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setClientErrors(undefined); }}>
        {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
