"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult, type ActionState, fail, invalid, NOT_SIGNED_IN, ok } from "@/lib/action-result";
import { getSessionUser } from "@/lib/auth";
import { getDrive } from "@/lib/data/drives";
import { loadEngineInput } from "@/lib/data/plans";
import { buildPlan } from "@/lib/plan-engine";
import { generatePlanSchema, toggleItemSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

/**
 * §2.4: pure engine over verified data, then one atomic save_plan call.
 * Regenerating replaces the caller's plan for this drive (progress resets).
 */
export async function generatePlan(_prev: ActionState<{ id: string }>, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const parsed = generatePlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const user = await getSessionUser();
  if (!user) return fail(NOT_SIGNED_IN);

  const drive = await getDrive(parsed.data.drive_id);
  if (!drive) return fail("That drive doesn't exist any more.");

  const plan = buildPlan(await loadEngineInput(drive, new Date()));
  if (!plan.items.length) return fail("There isn't enough data for this drive yet: no verified experiences and no round topics.");

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_plan", {
    p_drive_id: drive.id,
    p_items: plan.items,
    p_experience_ids: plan.experience_ids,
  });
  if (error || !id) return fail("Could not save your plan. Please try again.");

  revalidatePath("/dashboard");
  revalidatePath(`/drives/${drive.id}`);
  redirect(`/dashboard/plans/${id}`);
}

/**
 * Single-row update of done/done_at (§2.2), called from a useOptimistic
 * transition. RLS limits it to the caller's own plan items; the column grant
 * limits it to these two columns.
 */
export async function toggleChecklistItem(input: { id: string; done: boolean }): Promise<ActionResult<{ id: string; done: boolean }>> {
  const parsed = toggleItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const user = await getSessionUser();
  if (!user) return fail(NOT_SIGNED_IN);

  const { id, done } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plan_items")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id, plan_id");
  if (error) return fail("Could not update the checklist. Please try again.");
  if (!data.length) return fail("That checklist item doesn't exist.");

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/plans/${data[0].plan_id}`);
  return ok({ id, done });
}
