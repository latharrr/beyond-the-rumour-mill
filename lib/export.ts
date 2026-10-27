// Plan → Markdown for GET /api/plans/[id]/export (§2.3). Pure: the route
// handler loads the plan (ownership-checked) and passes it in.

export type ExportPlan = {
  created_at: string | null;
  drive: { title: string; company: string; role: string; drive_date: string | null };
  items: {
    position: number;
    week: number;
    label: string;
    done: boolean;
    resources: { title: string; url: string; type: string }[];
  }[];
  experiences: { id: string; author: string }[];
};

/** Escapes characters that would change Markdown structure inside inline text. */
export const mdEscape = (s: string) => s.replace(/([\\`*_[\]<>#|])/g, "\\$1").replace(/\s*\n\s*/g, " ");

const mdUrl = (u: string) => u.replace(/[()\s]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);

export function weeksOf<T extends { week: number; position: number }>(items: T[]): [number, T[]][] {
  const by = new Map<number, T[]>();
  for (const i of [...items].sort((a, b) => a.week - b.week || a.position - b.position)) {
    by.set(i.week, [...(by.get(i.week) ?? []), i]);
  }
  return [...by];
}

export function planToMarkdown(plan: ExportPlan, origin: string): string {
  const done = plan.items.filter((i) => i.done).length;
  const lines = [
    `# Prep plan: ${mdEscape(plan.drive.title)}`,
    "",
    `${mdEscape(plan.drive.company)} · ${mdEscape(plan.drive.role)} · Drive date: ${plan.drive.drive_date ?? "not announced"}`,
    "",
    `Generated ${plan.created_at?.slice(0, 10) ?? "—"} · Progress: ${done} of ${plan.items.length} done`,
  ];

  for (const [week, items] of weeksOf(plan.items)) {
    lines.push("", `## Week ${week}`, "");
    for (const i of items) {
      lines.push(`- [${i.done ? "x" : " "}] ${mdEscape(i.label)}`);
      for (const r of i.resources) lines.push(`  - [${mdEscape(r.title)}](${mdUrl(r.url)}) (${r.type})`);
    }
  }

  lines.push("", "## Built from", "");
  if (plan.experiences.length) {
    for (const e of plan.experiences) lines.push(`- ${mdEscape(e.author)}: ${origin}/experiences/${e.id}`);
  } else {
    lines.push("No verified experiences yet for this company; built from the drive's listed round topics.");
  }
  lines.push("", `Exported from Beyond the Rumour Mill (${origin}).`, "");
  return lines.join("\n");
}

/** Safe download filename, e.g. "prep-plan-tcs-nqt-2026.md". */
export const exportFilename = (title: string) =>
  `prep-plan-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "plan"}.md`;
