"use server";

import { redirect } from "next/navigation";
import { type ActionResult, type ActionState, fail, invalid, NOT_SIGNED_IN } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const EVIDENCE_PAGE = 100;

/**
 * Deletes the signed-in user's account (team decision, README "Retention"):
 *  1. evidence objects under {uid}/ are removed and evidence_path cleared;
 *  2. the auth user is deleted → profile and prep plans cascade, experiences
 *     keep their content with user_id set null (shown as "Former student").
 * Students have no storage delete rights, so steps 1–2 use the service role,
 * scoped strictly to the caller's own id from the verified session.
 */
export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse({ confirm: formData.get("confirm") });
  if (!parsed.success) return invalid(parsed.error);

  const user = await getSessionUser();
  if (!user) return fail(NOT_SIGNED_IN);

  const admin = createAdminClient();
  const bucket = admin.storage.from("evidence");

  // Removing while listing: always read the first page until it is empty.
  for (;;) {
    const { data: objects, error } = await bucket.list(user.id, { limit: EVIDENCE_PAGE });
    if (error) return fail("Could not delete your evidence files. Nothing was deleted; please try again.");
    if (!objects.length) break;
    const { error: removeError } = await bucket.remove(objects.map((o) => `${user.id}/${o.name}`));
    if (removeError) return fail("Could not delete your evidence files. Please try again.");
  }

  const { error: clearError } = await admin.from("experiences").update({ evidence_path: null }).eq("user_id", user.id);
  if (clearError) return fail("Could not update your experiences. Please try again.");

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return fail("Could not delete your account. Please try again.");

  // The user no longer exists server-side; clear the local session cookies.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });

  redirect("/?account=deleted");
}
