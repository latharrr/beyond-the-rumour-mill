"use server";

import { revalidatePath, updateTag } from "next/cache";
import { type ActionResult, type ActionState, fail, invalid, NOT_AUTHORISED, ok } from "@/lib/action-result";
import { isAdmin } from "@/lib/auth";
import { type DriveInput, driveSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

type Saved = { id: string };

function parseDrive(formData: FormData) {
  return driveSchema.safeParse({
    ...Object.fromEntries(formData),
    branch_ids: formData.getAll("branch_ids"),
  });
}

/** One transactional write through the save_drive RPC (team decision). */
async function save(id: string | null, input: DriveInput): Promise<ActionResult<Saved>> {
  const supabase = await createClient();
  // Generated RPC arg types are non-nullable; SQL accepts null for the
  // optional ones, hence the casts.
  const { data, error } = await supabase.rpc("save_drive", {
    p_drive_id: id as string,
    p_company_id: input.company_id,
    p_role_id: input.role_id,
    p_title: input.title,
    p_eligibility_cgpa: input.eligibility_cgpa as number,
    p_max_backlogs: input.max_backlogs,
    p_min_10th_pct: input.min_10th_pct as number,
    p_min_12th_pct: input.min_12th_pct as number,
    p_grad_years: input.grad_years,
    p_drive_date: input.drive_date as string,
    p_location: input.location as string,
    p_status: input.status,
    p_branch_ids: input.branch_ids,
    p_rounds: input.rounds.map((r, i) => ({ ...r, position: i + 1 })),
  });

  if (error) {
    if (error.code === "42501") return fail(NOT_AUTHORISED);
    if (error.code === "P0002") return fail("That drive no longer exists.");
    if (error.code === "23503") return fail("A selected company, role, branch, topic or resource no longer exists. Reload and try again.");
    return fail("Could not save the drive. Nothing was changed.");
  }

  updateTag("taxonomy");
  revalidatePath("/drives");
  revalidatePath(`/drives/${data}`);
  revalidatePath("/admin/drives");
  return ok({ id: data }, id ? "Drive updated." : "Drive created.");
}

export async function createDrive(_prev: ActionState<Saved>, formData: FormData): Promise<ActionResult<Saved>> {
  if (!(await isAdmin())) return fail(NOT_AUTHORISED);
  const parsed = parseDrive(formData);
  if (!parsed.success) return invalid(parsed.error);
  return save(null, parsed.data);
}

export async function updateDrive(_prev: ActionState<Saved>, formData: FormData): Promise<ActionResult<Saved>> {
  if (!(await isAdmin())) return fail(NOT_AUTHORISED);
  const parsed = parseDrive(formData);
  if (!parsed.success) return invalid(parsed.error);
  if (!parsed.data.id) return fail("Missing drive id.");
  return save(parsed.data.id, parsed.data);
}
