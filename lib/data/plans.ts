import "server-only";
import type { ExportPlan } from "@/lib/export";
import { authorLabel } from "@/lib/format";
import type { EngineInput } from "@/lib/plan-engine";
import { createClient } from "@/lib/supabase/server";
import type { DriveDetail } from "./drives";

// Plans are owner-only (RLS). Every read here ALSO filters on the caller's
// id explicitly (§2.3 "RLS + explicit"), so a policy regression can't leak.

/** §2.4 step 2–3 inputs, read only from the public views. */
export async function loadEngineInput(drive: DriveDetail, now: Date): Promise<EngineInput> {
  const supabase = await createClient();
  const [exps, topics, resources] = await Promise.all([
    supabase.from("public_experiences").select("id, company_id, role_id, created_at").eq("company_id", drive.company_id),
    supabase.from("topics").select("id, label"),
    supabase.from("resources").select("id, topic_id"),
  ]);
  for (const r of [exps, topics, resources]) if (r.error) throw r.error;
  const experiences = exps.data!.map((e) => ({ ...e, created_at: e.created_at ?? now.toISOString() })) as EngineInput["experiences"];
  const ids = experiences.map((e) => e.id);
  const links = ids.length
    ? await supabase.from("public_experience_topics").select("experience_id, topic_id").in("experience_id", ids)
    : { data: [], error: null };
  if (links.error) throw links.error;

  return {
    drive: { company_id: drive.company_id, role_id: drive.role_id, drive_date: drive.drive_date },
    rounds: drive.rounds.map((r) => ({
      id: r.id,
      name: r.name,
      position: r.position,
      topic_ids: r.topics.map((t) => t.id),
      resource_ids: r.resources.map((x) => x.id),
    })),
    experiences,
    links: links.data as EngineInput["links"],
    topics: topics.data!,
    resources: resources.data!,
    now,
  };
}

export type PlanItem = {
  id: string;
  topic_id: string | null;
  position: number;
  week: number;
  label: string;
  done: boolean;
  done_at: string | null;
  resources: { id: string; title: string; url: string; type: string }[];
};

export type PlanDetail = ExportPlan & {
  id: string;
  updated_at: string | null;
  drive: ExportPlan["drive"] & { id: string };
  items: PlanItem[];
};

export type PlanSummary = {
  id: string;
  created_at: string | null;
  drive: { id: string; title: string; company: string; drive_date: string | null };
  total: number;
  done: number;
};

type Drive = { id: string; title: string; drive_date: string | null; company: { name: string }; role: { label: string } };
const DRIVE_SELECT = "drive:drives(id, title, drive_date, company:companies(name), role:roles(label))";

/** The caller's plans with progress (dashboard). Progress is derived from plan_items. */
export async function listMyPlans(userId: string): Promise<PlanSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prep_plans")
    .select(`id, created_at, ${DRIVE_SELECT}, plan_items(done)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  type Row = { id: string; created_at: string | null; drive: Drive; plan_items: { done: boolean }[] };
  return (data as unknown as Row[]).map((p) => ({
    id: p.id,
    created_at: p.created_at,
    drive: { id: p.drive.id, title: p.drive.title, company: p.drive.company.name, drive_date: p.drive.drive_date },
    total: p.plan_items.length,
    done: p.plan_items.filter((i) => i.done).length,
  }));
}

/** The caller's plan id for a drive, if any (drive page CTA: generate vs regenerate). */
export async function getMyPlanIdForDrive(userId: string, driveId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("prep_plans").select("id").eq("user_id", userId).eq("drive_id", driveId).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** One plan with items, resources and cited experiences; null if missing or not the caller's. */
export async function getMyPlan(userId: string, planId: string): Promise<PlanDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prep_plans")
    .select(`id, created_at, updated_at, ${DRIVE_SELECT},
      plan_items(id, topic_id, position, week, label, done, done_at,
        plan_item_resources(resource:resources(id, title, url, type))),
      plan_experiences(experience_id)`)
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  type Row = {
    id: string;
    created_at: string | null;
    updated_at: string | null;
    drive: Drive;
    plan_items: (Omit<PlanItem, "resources"> & { plan_item_resources: { resource: PlanItem["resources"][number] }[] })[];
    plan_experiences: { experience_id: string }[];
  };
  const row = data as unknown as Row;
  const ids = row.plan_experiences.map((e) => e.experience_id);
  // Cited experiences via the public view: an experience rejected after the
  // plan was generated silently drops out of the citations.
  const cited = ids.length
    ? await supabase.from("public_experiences").select("id, author_role, grad_year, created_at").in("id", ids).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (cited.error) throw cited.error;

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    drive: { id: row.drive.id, title: row.drive.title, company: row.drive.company.name, role: row.drive.role.label, drive_date: row.drive.drive_date },
    items: row.plan_items
      .map(({ plan_item_resources, ...i }) => ({
        ...i,
        resources: plan_item_resources.map((r) => r.resource).sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => a.position - b.position),
    experiences: (cited.data ?? []).map((e) => ({ id: e.id!, author: authorLabel(e.author_role, e.grad_year) })),
  };
}
