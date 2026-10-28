import "server-only";
import { cache } from "react";
import { buildPlan, type PlanScope } from "@/lib/plan-engine";
import type { TopicFrequency } from "@/lib/topic-frequency";
import { type DriveSummary, type DriveWithRounds, getDrive, listDrives, withRoundCounts } from "./drives";
import { type CommunityTip, type ExperienceView, listCommunityTips, listVerifiedExperiences } from "./experiences";
import { loadEngineInput } from "./plans";
import { listResources } from "./taxonomy";

// Read-only views of existing data for the landing page. Nothing here writes.

const isOpen = (d: DriveSummary) => d.status === "upcoming" || d.status === "ongoing";

export type LandingDrive = DriveWithRounds;

/** The next open drives (ongoing first, then soonest), each with its round count. */
export async function listUpcomingDrives(limit = 3): Promise<{ drives: LandingDrive[]; now: Date }> {
  const drives = (await listDrives()).filter(isOpen).slice(0, limit);
  return { drives: await withRoundCounts(drives), now: new Date() };
}

export type ExperienceSnapshot = {
  total: number;
  topTopics: TopicFrequency[];
  featured: ExperienceView | null;
  tip: CommunityTip | null;
};

/** What gets asked across all verified experiences, one strong example, and one quarantined tip. */
export async function getExperienceSnapshot(topN = 5): Promise<ExperienceSnapshot> {
  const [{ experiences, frequency }, tips] = await Promise.all([listVerifiedExperiences(), listCommunityTips()]);
  const featured =
    [...experiences].sort(
      (a, b) =>
        Number(b.topics.length >= 2) - Number(a.topics.length >= 2) ||
        b.trust.score - a.trust.score ||
        b.created_at.localeCompare(a.created_at),
    )[0] ?? null;
  return {
    total: experiences.length,
    topTopics: frequency.slice(0, topN),
    featured,
    tip: tips.find((t) => t.rounds_summary?.trim()) ?? null,
  };
}

export type PreviewResource = { id: string; title: string; url: string; type: string };
export type PreviewItem = { topicId: string; topic: string; why: string; resources: PreviewResource[] };

export type PlanPreview = {
  drive: {
    id: string;
    title: string;
    company: string;
    role: string;
    drive_date: string | null;
    rounds: number;
    cgpa: number | null;
    max_backlogs: number;
  };
  scope: PlanScope;
  /** Verified experiences the plan is built from. */
  experiences: number;
  /** Distinct resources attached across the plan's items. */
  resources: number;
  /** Weeks that actually hold items, in order. */
  weeks: { week: number; items: PreviewItem[] }[];
  total: number;
};

/**
 * The plan the engine would build right now for the next open drive,
 * computed in memory with the same loader and engine as generatePlan.
 * Never saved. Null when there is no open drive to plan against.
 */
export const getPlanPreview = cache(async (): Promise<PlanPreview | null> => {
  const next = (await listDrives()).find((d) => isOpen(d) && d.source_kind !== "public_hiring");
  if (!next) return null;
  const drive = await getDrive(next.id);
  if (!drive) return null;

  const [input, allResources] = await Promise.all([loadEngineInput(drive, new Date()), listResources()]);
  const plan = buildPlan(input);
  const labels = new Map(input.topics.map((t) => [t.id, t.label]));
  const resourceById = new Map(allResources.map((r) => [r.id, { id: r.id, title: r.title, url: r.url, type: r.type }]));

  const byWeek = new Map<number, PreviewItem[]>();
  for (const item of plan.items) {
    const topic = labels.get(item.topic_id) ?? "Topic";
    // The engine's label is "<topic> — <why>"; the preview shows the two apart.
    const cut = item.label.indexOf(" — ");
    const why = cut >= 0 ? item.label.slice(cut + 3) : "";
    byWeek.set(item.week, [...(byWeek.get(item.week) ?? []), {
        topicId: item.topic_id,
        topic,
        why,
        // The engine's own order and ids; only titles, links and types are looked up.
        resources: item.resource_ids.flatMap((id) => resourceById.get(id) ?? []),
      }]);
  }

  return {
    drive: {
      id: drive.id,
      title: drive.title,
      company: drive.company.name,
      role: drive.role.label,
      drive_date: drive.drive_date,
      rounds: drive.rounds.length,
      cgpa: drive.eligibility_cgpa,
      max_backlogs: drive.max_backlogs,
    },
    scope: plan.scope,
    experiences: plan.experience_ids.length,
    resources: new Set(plan.items.flatMap((i) => i.resource_ids)).size,
    weeks: [...byWeek].sort(([a], [b]) => a - b).map(([week, items]) => ({ week, items })),
    total: plan.items.length,
  };
});
