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
