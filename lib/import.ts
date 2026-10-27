// CSV → submit_experience argument shape, for scripts/import-experiences.ts.
// Pure (no I/O) so it is unit-tested. Applies the same validation as the
// /experiences/new form (experienceSchema) and the RPC's drive-match rule.
// Relative .ts import: this file also runs directly under Node.
import { experienceSchema } from "./schemas.ts";

export const CSV_COLUMNS = ["email", "company", "role", "drive", "rounds_summary", "preparation_timeline", "topics", "resources"] as const;

export type Taxonomy = {
  companies: { id: string; name: string }[];
  roles: { id: string; label: string; aliases: string[] }[];
  topics: { id: string; label: string; aliases: string[] }[];
  resources: { id: string; title: string; url: string }[];
  drives: { id: string; title: string; company_id: string; role_id: string }[];
};

/** Exactly the submit_experience RPC arguments. Evidence is never imported. */
export type SubmitExperienceArgs = {
  p_company_id: string;
  p_role_id: string;
  p_drive_id: string | null;
  p_rounds_summary: string;
  p_timeline: string | null;
  p_evidence_path: null;
  p_topic_ids: string[];
  p_resource_ids: string[];
};

export type ImportRow = { line: number; email: string; args: SubmitExperienceArgs };
export type ImportError = { line: number; errors: string[] };

/** RFC 4180: quoted fields, "" escapes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      endRow();
    } else field += c;
  }
  if (field !== "" || row.length) endRow();
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const norm = (s: string) => s.trim().toLowerCase();
const list = (s: string | undefined) => (s ?? "").split(";").map((x) => x.trim()).filter(Boolean);

function lookup<T extends { id: string }>(items: T[], value: string, keys: (t: T) => string[]): T | undefined {
  const v = norm(value);
  return items.find((t) => keys(t).some((k) => norm(k) === v));
}

/** Header row required; one experience per following row (line numbers are 1-based file lines). */
export function mapRows(csv: string, tax: Taxonomy): { rows: ImportRow[]; errors: ImportError[] } {
  const [header, ...body] = parseCsv(csv);
  const cols = (header ?? []).map(norm);
  const missing = CSV_COLUMNS.filter((c) => !cols.includes(c));
  if (missing.length) return { rows: [], errors: [{ line: 1, errors: [`Missing column(s): ${missing.join(", ")}`] }] };

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];
  body.forEach((cells, i) => {
    const line = i + 2;
    const get = (c: (typeof CSV_COLUMNS)[number]) => (cells[cols.indexOf(c)] ?? "").trim();
    const problems: string[] = [];

    const email = norm(get("email"));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push(`email: "${get("email")}" is not an email address`);
    const company = lookup(tax.companies, get("company"), (c) => [c.name]);
    if (!company) problems.push(`company: unknown "${get("company")}"`);
    const role = lookup(tax.roles, get("role"), (r) => [r.label, ...r.aliases]);
    if (!role) problems.push(`role: unknown "${get("role")}"`);

    let driveId: string | null = null;
    if (get("drive")) {
      const drive = lookup(tax.drives, get("drive"), (d) => [d.title]);
      if (!drive) problems.push(`drive: unknown "${get("drive")}"`);
      else if (company && role && (drive.company_id !== company.id || drive.role_id !== role.id))
        problems.push(`drive: "${drive.title}" is for a different company or role`);
      else driveId = drive.id;
    }

    const topicIds: string[] = [];
    for (const t of list(get("topics"))) {
      const topic = lookup(tax.topics, t, (x) => [x.label, ...x.aliases]);
      if (topic) {
        if (!topicIds.includes(topic.id)) topicIds.push(topic.id);
      }
      else problems.push(`topics: unknown "${t}" (add it with a migration first)`);
    }
    const resourceIds: string[] = [];
    for (const r of list(get("resources"))) {
      const res = lookup(tax.resources, r, (x) => [x.title, x.url]);
      if (res) {
        if (!resourceIds.includes(res.id)) resourceIds.push(res.id);
      }
      else problems.push(`resources: unknown "${r}"`);
    }

    const parsed = experienceSchema.safeParse({
      company_id: company?.id ?? "",
      role_id: role?.id ?? "",
      drive_id: driveId ?? "",
      rounds_summary: get("rounds_summary"),
      preparation_timeline: get("preparation_timeline"),
      topic_ids: topicIds,
      resource_ids: resourceIds,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        // company/role/drive problems are already reported with the raw value.
        if (!["company_id", "role_id", "drive_id"].includes(field)) problems.push(`${field}: ${issue.message}`);
      }
    }

    if (problems.length || !parsed.success) errors.push({ line, errors: problems });
    else {
      const d = parsed.data;
      rows.push({
        line,
        email,
        args: {
          p_company_id: d.company_id,
          p_role_id: d.role_id,
          p_drive_id: d.drive_id,
          p_rounds_summary: d.rounds_summary,
          p_timeline: d.preparation_timeline,
          p_evidence_path: null,
          p_topic_ids: d.topic_ids,
          p_resource_ids: d.resource_ids,
        },
      });
    }
  });
  return { rows, errors };
}
