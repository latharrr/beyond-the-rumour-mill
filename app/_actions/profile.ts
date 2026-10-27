"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult, type ActionState, fail, invalid, NOT_SIGNED_IN, ok } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { profileSchema, safeNextPath } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * Updates the caller's own profile (§2.2). The schema has no `role`; the DB
 * column grant would reject it anyway. RLS limits the update to own row.
 */
export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const user = await getSessionUser();
  if (!user) return fail(NOT_SIGNED_IN);

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id).select("id");
  if (error) {
    if (error.code === "23503") return fail("Please fix the highlighted fields.", { branch_id: ["Choose a branch from the list"] });
    return fail("Could not save your profile. Please try again.");
  }
  if (!data.length) return fail("Could not find your profile. Please sign in again.");

  revalidatePath("/drives");
  revalidatePath("/dashboard");

  const next = formData.get("next");
  if (typeof next === "string" && next) redirect(safeNextPath(next, "/drives?eligibleOnly=1"));
  return ok(null, "Profile saved.");
}
