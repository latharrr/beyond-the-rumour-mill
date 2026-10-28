"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, type ActionState, fail, invalid, NOT_AUTHORISED, NOT_SIGNED_IN, ok } from "@/lib/action-result";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { evidenceObjectPath, fileMatchesType } from "@/lib/evidence";
import { evidenceFileSchema, type EvidenceType, experienceSchema, rejectSchema, reviewIdSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60; // §1.6

/**
 * §2.2 submitExperience: validate → upload evidence to {uid}/{uuid}.ext →
 * submit_experience RPC. If the RPC fails, the uploaded object is deleted
 * with the service role (students cannot delete objects themselves).
 */
export async function submitExperience(_prev: ActionState<{ id: string }>, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return fail(NOT_SIGNED_IN);

  const parsed = experienceSchema.safeParse({
    ...Object.fromEntries(formData),
    topic_ids: formData.getAll("topic_ids"),
    resource_ids: formData.getAll("resource_ids"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const evidence = formData.get("evidence");
  const hasFile = evidence instanceof File && evidence.size > 0;
  let path: string | null = null;

  if (hasFile) {
    const file = evidenceFileSchema.safeParse(evidence);
    if (!file.success) return fail("Please fix the highlighted fields.", { evidence: file.error.issues.map((i) => i.message) });
    if (!(await fileMatchesType(evidence))) {
      return fail("Please fix the highlighted fields.", { evidence: ["That file's contents don't match its type. Upload a real JPEG, PNG or PDF."] });
    }
    path = evidenceObjectPath(user.id, evidence.type as EvidenceType);
  }

  const supabase = await createClient();

  if (path && evidence instanceof File) {
    const { error } = await supabase.storage.from("evidence").upload(path, evidence, { contentType: evidence.type, upsert: false });
    if (error) return fail("Could not upload your evidence. Please try again.");
  }

  const d = parsed.data;
  const { data, error } = await supabase.rpc("submit_experience", {
    p_company_id: d.company_id,
    p_role_id: d.role_id,
    p_drive_id: d.drive_id as string,
    p_rounds_summary: d.rounds_summary,
    p_timeline: d.preparation_timeline as string,
    p_evidence_path: path as string,
    p_topic_ids: d.topic_ids,
    p_resource_ids: d.resource_ids,
  });

  if (error) {
    if (path) await createAdminClient().storage.from("evidence").remove([path]);
    if (error.code === "P0001") return fail("You already have 5 experiences awaiting verification. Wait for a project admin to review them.");
    if (error.message.includes("does not match")) {
      return fail("Please fix the highlighted fields.", { drive_id: ["That drive is for a different company or role."] });
    }
    if (error.code === "23503") return fail("A selected company, role, topic or resource no longer exists. Reload and try again.");
    return fail("Could not submit your experience. Please try again.");
  }

  revalidatePath("/experiences");
  revalidatePath("/admin");
  return ok({ id: data }, "Thanks! Your experience is in the verification queue.");
}

/** Admin: mark a pending experience verified (§2.2). */
export async function verifyExperience(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return fail(NOT_AUTHORISED);
  const user = await getSessionUser();
  const parsed = reviewIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success || !user) return fail("Missing experience id.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiences")
    .update({ status: "verified", verified_by: user.id, verified_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .select("id");
  if (error) return fail("Could not verify this experience. Please try again.");
  if (!data.length) return fail("This experience was already reviewed.");

  revalidatePath("/admin");
  revalidatePath("/experiences");
  return ok(null, "Verified. It now appears in the public list.");
}

/** Admin: reject a pending experience with a reason the student can see. */
export async function rejectExperience(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return fail(NOT_AUTHORISED);
  const user = await getSessionUser();
  const parsed = rejectSchema.safeParse({ id: formData.get("id"), reason: formData.get("reason") });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiences")
    .update({ status: "rejected", rejection_reason: parsed.data.reason, verified_by: user!.id, verified_at: null })
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .select("id");
  if (error) return fail("Could not reject this experience. Please try again.");
  if (!data.length) return fail("This experience was already reviewed.");

  revalidatePath("/admin");
  revalidatePath("/experiences");
  return ok(null, "Rejected. It has left the community-tips lane.");
}

/**
 * Admin: 60 s signed URL for an experience's evidence. Takes the experience
 * id, never a path; the path is looked up server-side after a fresh
 * is_admin() check and never sent to the client.
 */
export async function getEvidenceUrl(experienceId: string): Promise<ActionResult<{ url: string }>> {
  if (!(await isAdmin())) return fail(NOT_AUTHORISED);
  const parsed = reviewIdSchema.safeParse({ id: experienceId });
  if (!parsed.success) return fail("Missing experience id.");

  const supabase = await createClient();
  const { data: row, error } = await supabase.from("experiences").select("evidence_path").eq("id", parsed.data.id).maybeSingle();
  if (error || !row) return fail("Experience not found.");
  if (!row.evidence_path) return fail("This experience has no evidence attached.");

  const { data, error: signError } = await supabase.storage.from("evidence").createSignedUrl(row.evidence_path, SIGNED_URL_SECONDS);
  if (signError || !data) return fail("Could not open the evidence file.");
  return ok({ url: data.signedUrl });
}
