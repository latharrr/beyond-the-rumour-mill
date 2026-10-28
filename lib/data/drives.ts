import "server-only";
import { createClient } from "@/lib/supabase/server";

// drives.created_by is not granted to clients: always list columns explicitly.
export const DRIVE_COLUMNS =
  "id, company_id, role_id, title, eligibility_cgpa, max_backlogs, min_10th_pct, min_12th_pct, grad_years, drive_date, location, status, created_at, updated_at, source_kind, source_url, apply_url, application_deadline, deadline_note, eligibility_note, verified_on";

export type DriveStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type DriveSourceKind = "campus" | "public_hiring";

export type DriveSummary = {
  id: string;
  company_id: string;
  role_id: string;
  title: string;
  eligibility_cgpa: number | null;
  max_backlogs: number;
  min_10th_pct: number | null;
  min_12th_pct: number | null;
  grad_years: number[];
  drive_date: string | null;
  location: string | null;
  status: DriveStatus;
  source_kind: DriveSourceKind;
  source_url: string | null;
  apply_url: string | null;
  application_deadline: string | null;
  deadline_note: string | null;
  eligibility_note: string | null;
  verified_on: string | null;
  company: { id: string; name: string; sector: string | null; logo_url: string | null };
  role: { id: string; label: string; aliases: string[] };
  branch_ids: string[];
};

export type RoundDetail = {
  id: string;
  name: string;
  position: number;
  description: string | null;
  topics: { id: string; label: string; category: string }[];
  resources: { id: string; title: string; url: string; type: string }[];
};

export type DriveDetail = DriveSummary & { rounds: RoundDetail[] };

const SUMMARY_SELECT = `${DRIVE_COLUMNS},
  company:companies(id, name, sector, logo_url),
  role:roles(id, label, aliases),
  drive_branches(branch_id)`;

type SummaryRow = Omit<DriveSummary, "branch_ids"> & { drive_branches: { branch_id: string }[] };

const toSummary = ({ drive_branches, ...d }: SummaryRow): DriveSummary => ({
  ...d,
  branch_ids: drive_branches.map((b) => b.branch_id),
});

const STATUS_ORDER: Record<DriveStatus, number> = { ongoing: 0, upcoming: 1, completed: 2, cancelled: 3 };

/** All drives: ongoing/upcoming first, soonest date first. */
export async function listDrives(): Promise<DriveSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("drives").select(SUMMARY_SELECT);
  if (error) throw error;
  return (data as unknown as SummaryRow[])
    .map(toSummary)
    .sort((a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.drive_date ?? "9999").localeCompare(b.drive_date ?? "9999") ||
      a.title.localeCompare(b.title),
    );
}

export type DriveWithRounds = DriveSummary & { round_count: number };

/** Adds each drive's published round count (one query for the whole list). */
export async function withRoundCounts(drives: DriveSummary[]): Promise<DriveWithRounds[]> {
  if (drives.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("rounds").select("drive_id").in("drive_id", drives.map((d) => d.id));
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const r of data) counts.set(r.drive_id, (counts.get(r.drive_id) ?? 0) + 1);
  return drives.map((d) => ({ ...d, round_count: counts.get(d.id) ?? 0 }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);

/** One drive with rounds, round topics and round resources; null if missing. */
export async function getDrive(id: string): Promise<DriveDetail | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drives")
    .select(`${SUMMARY_SELECT},
      rounds(id, name, position, description,
        round_topics(topic:topics(id, label, category)),
        round_resources(resource:resources(id, title, url, type)))`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  type RoundRow = Omit<RoundDetail, "topics" | "resources"> & {
    round_topics: { topic: RoundDetail["topics"][number] }[];
    round_resources: { resource: RoundDetail["resources"][number] }[];
  };
  const row = data as unknown as SummaryRow & { rounds: RoundRow[] };
  const { rounds, ...summary } = row;
  return {
    ...toSummary(summary),
    rounds: rounds
      .map(({ round_topics, round_resources, ...r }) => ({
        ...r,
        topics: round_topics.map((t) => t.topic).sort((a, b) => a.label.localeCompare(b.label)),
        resources: round_resources.map((x) => x.resource),
      }))
      .sort((a, b) => a.position - b.position),
  };
}
