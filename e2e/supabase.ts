import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Service-role client for e2e setup only (creating users and confirmation
// links, checking DB state). Keys come from the running local stack.
let cached: Record<string, string> | null = null;
function status() {
  cached ??= JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  return cached!;
}

export const serviceClient = () =>
  createClient(status().API_URL, status().SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

export const PASSWORD = "password123";

/** Fresh confirmed user so tests never mutate the shared seed accounts. */
export async function createE2EUser(label: string, role: "student" | "alumni" | "admin" = "student") {
  const svc = serviceClient();
  const email = `${label}-${randomUUID().slice(0, 8)}@e2e.test`;
  const { data, error } = await svc.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw error;
  if (role !== "student") await svc.from("profiles").update({ role }).eq("id", data.user.id);
  return { id: data.user.id, email };
}

export async function deleteE2EUser(id: string) {
  const svc = serviceClient();
  await svc.from("experiences").delete().eq("user_id", id);
  await svc.auth.admin.deleteUser(id);
}

export async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByRole("button", { name: "Use email and password", exact: true }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
