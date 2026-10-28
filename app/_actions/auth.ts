"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { credentialsSchema, safeNextPath } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string[]>>;
  message?: string;
  email?: string;
};

function parse(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email: String(formData.get("email") ?? "") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // One message for unknown email and wrong password: no account enumeration.
    return { error: "Incorrect email or password.", email: parsed.data.email };
  }

  redirect(safeNextPath(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email: String(formData.get("email") ?? "") };
  }

  // Profile row (role = student) is created by the handle_new_user trigger.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message, email: parsed.data.email };

  // With email confirmation enabled (production), there is no session yet.
  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in.", email: parsed.data.email };
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const emailOnlySchema = z.object({ email: credentialsSchema.shape.email });
const newPasswordSchema = z.object({
  password: credentialsSchema.shape.password,
  confirm: z.string(),
});

// Always the same message either way: no account enumeration.
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email: String(formData.get("email") ?? "") };
  }

  const supabase = await createClient();
  // The email link is fixed by the project template to /auth/confirm
  // (token_hash flow), which forwards recovery sessions to /reset-password.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error) {
    if (error.status === 429 || error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { error: "Too many reset requests right now. Please wait a few minutes and try again.", email: parsed.data.email };
    }
    return { error: "We could not send a reset link right now. Please try again later.", email: parsed.data.email };
  }
  return { message: "If an account exists for that email, we've sent a reset link.", email: parsed.data.email };
}

// Completes the recovery flow. Requires the session created by /auth/confirm
// for type=recovery; without it the link is stale or already used.
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (parsed.data.password !== parsed.data.confirm) {
    return { fieldErrors: { password: ["Passwords do not match."] } };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { error: "That reset link is invalid or has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update your password. Request a new reset link and try again." };

  redirect("/dashboard");
}
