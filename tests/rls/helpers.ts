import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = () => process.env.SUPABASE_URL!;
const anonKey = () => process.env.SUPABASE_ANON_KEY!;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export const anonClient = () => createClient(url(), anonKey(), noSession);
export const serviceClient = () => createClient(url(), serviceKey(), noSession);

export type TestUser = { id: string; email: string; client: SupabaseClient };

const PASSWORD = "rls-test-password";

/** Creates a confirmed user (profile row comes from the signup trigger) and signs them in. */
export async function createUser(label: string): Promise<TestUser> {
  const email = `${label}-${randomUUID().slice(0, 8)}@rls.test`;
  const { data, error } = await serviceClient().auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;

  const client = createClient(url(), anonKey(), noSession);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw signInError;

  return { id: data.user.id, email, client };
}

/** Admin promotion — the documented service-role-only procedure. */
export async function createAdmin(): Promise<TestUser> {
  const user = await createUser("admin");
  const { error } = await serviceClient().from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (error) throw error;
  return user;
}

export async function deleteUsers(...users: TestUser[]) {
  const svc = serviceClient();
  const ids = users.map((u) => u.id);
  // Delete test users' experiences outright (account deletion would only
  // anonymise them) so they never leak into the seeded public views.
  await svc.from("plan_experiences").delete().in("plan_id",
    ((await svc.from("prep_plans").select("id").in("user_id", ids)).data ?? []).map((p) => p.id));
  await svc.from("experiences").delete().in("user_id", ids);
  for (const id of ids) await svc.auth.admin.deleteUser(id);
}

export async function lookupId(table: "companies" | "roles" | "topics" | "resources", column: string, value: string) {
  const { data, error } = await serviceClient().from(table).select("id").eq(column, value).single();
  if (error) throw error;
  return data.id as string;
}

export async function driveFor(companyName: string) {
  const svc = serviceClient();
  const companyId = await lookupId("companies", "name", companyName);
  const { data, error } = await svc.from("drives").select("id, company_id, role_id").eq("company_id", companyId).single();
  if (error) throw error;
  return data as { id: string; company_id: string; role_id: string };
}

/** Submits an experience through the RPC with sensible defaults. */
export async function submitExperience(
  user: TestUser,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const drive = await driveFor("TCS");
  return user.client.rpc("submit_experience", {
    p_company_id: drive.company_id,
    p_role_id: drive.role_id,
    p_drive_id: drive.id,
    p_rounds_summary: "RLS test summary",
    p_timeline: "2 weeks",
    p_evidence_path: null,
    p_topic_ids: [await lookupId("topics", "label", "Arrays")],
    p_resource_ids: [],
    ...overrides,
  });
}

export const evidencePath = (uid: string, ext = "pdf") => `${uid}/${randomUUID()}.${ext}`;

export const pdfBytes = () => new Blob([new TextEncoder().encode("%PDF-1.4\n%rls-test\n")], { type: "application/pdf" });
