// Presentation helpers shared by pages (no data access).

const ROLE_LABEL: Record<string, string> = {
  alumni: "Placed senior",
  student: "Student",
  admin: "Placement cell",
};

/** "Placed senior · Batch of 2025". Anonymised (deleted) authors → "Former student". */
export function authorLabel(authorRole: string | null, gradYear: number | null): string {
  if (!authorRole) return "Former student";
  const who = ROLE_LABEL[authorRole] ?? "Student";
  return gradYear ? `${who} · Batch of ${gradYear}` : who;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "17 Nov 2026" for a YYYY-MM-DD drive date. */
export function formatDriveDate(date: string): string {
  return DATE_FMT.format(new Date(`${date}T00:00:00Z`));
}

/** Whole days from today (UTC) to a YYYY-MM-DD date; negative once it has passed. */
export function daysUntil(date: string, now: Date): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((Date.parse(`${date}T00:00:00Z`) - today) / 86_400_000);
}

/** "6.0", "6.5", "7.25": a CGPA cut-off with one decimal unless it needs two. */
export function formatCgpa(cgpa: number): string {
  return Number.isInteger(Math.round(cgpa * 100) / 10) ? cgpa.toFixed(1) : cgpa.toFixed(2);
}

/** "None allowed" / "Up to 2": a drive's backlog rule. */
export function backlogRule(maxBacklogs: number): string {
  return maxBacklogs <= 0 ? "None allowed" : `Up to ${maxBacklogs}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
