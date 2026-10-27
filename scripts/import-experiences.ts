// Bulk-import senior experiences from CSV (§4 cold start).
//
//   node scripts/import-experiences.ts path/to/file.csv            # dry run: validate + print RPC args
//   node scripts/import-experiences.ts path/to/file.csv --apply    # insert as PENDING rows
//
// Columns: email, company, role, drive, rounds_summary, preparation_timeline,
// topics, resources. topics/resources are ";"-separated labels, aliases,
// titles or URLs. See scripts/experiences.sample.csv.
//
// --apply uses the secret key, so it runs only from a trusted machine against
// the project in .env.local (or the env). Each row's email must belong to an
// existing account (the senior signs up first). Rows are inserted with status
// 'pending' and go through the normal admin verification queue; the same
// checks as submit_experience apply (drive match here, 5-pending cap below).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { mapRows, type ImportRow, type Taxonomy } from "../lib/import.ts";

config({ path: ".env.local", quiet: true });

const PENDING_CAP = 5;
const [file, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
if (!file) {
  console.error("Usage: node scripts/import-experiences.ts <file.csv> [--apply]");
  process.exit(2);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = apply ? process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error(`Missing NEXT_PUBLIC_SUPABASE_URL or ${apply ? "SUPABASE_SECRET_KEY" : "a Supabase key"} (set them in .env.local).`);
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function loadTaxonomy(): Promise<Taxonomy> {
  const [companies, roles, topics, resources, drives] = await Promise.all([
    db.from("companies").select("id, name"),
    db.from("roles").select("id, label, aliases"),
    db.from("topics").select("id, label, aliases"),
    db.from("resources").select("id, title, url"),
    db.from("drives").select("id, title, company_id, role_id"),
  ]);
  for (const r of [companies, roles, topics, resources, drives]) if (r.error) throw r.error;
  return { companies: companies.data!, roles: roles.data!, topics: topics.data!, resources: resources.data!, drives: drives.data! };
}

async function userIdsByEmail(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) ids.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) return ids;
  }
}

/** One row: experience then its links; on any failure the experience is deleted (links cascade). */
async function insertRow(userId: string, { args }: ImportRow) {
  const { data, error } = await db
    .from("experiences")
    .insert({
      user_id: userId,
      company_id: args.p_company_id,
      role_id: args.p_role_id,
      drive_id: args.p_drive_id,
      rounds_summary: args.p_rounds_summary,
      preparation_timeline: args.p_timeline,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  const links = await Promise.all([
    db.from("experience_topics").insert(args.p_topic_ids.map((topic_id) => ({ experience_id: data.id, topic_id }))),
    args.p_resource_ids.length
      ? db.from("experience_resources").insert(args.p_resource_ids.map((resource_id) => ({ experience_id: data.id, resource_id })))
      : { error: null },
  ]);
  const failed = links.find((l) => l.error)?.error;
  if (failed) {
    await db.from("experiences").delete().eq("id", data.id);
    throw failed;
  }
  return data.id as string;
}

const { rows, errors } = mapRows(readFileSync(file, "utf8"), await loadTaxonomy());
for (const e of errors) console.error(`line ${e.line}: ${e.errors.join("; ")}`);
console.error(`${rows.length} valid row(s), ${errors.length} invalid.`);

if (!apply) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(errors.length ? 1 : 0);
}
if (errors.length) {
  console.error("Fix the invalid rows first; nothing was imported.");
  process.exit(1);
}

const users = await userIdsByEmail();
const unknown = [...new Set(rows.map((r) => r.email).filter((e) => !users.has(e)))];
if (unknown.length) {
  console.error(`No account for: ${unknown.join(", ")}. Ask them to sign up first; nothing was imported.`);
  process.exit(1);
}

let imported = 0;
for (const row of rows) {
  const userId = users.get(row.email)!;
  const { count } = await db.from("experiences").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending");
  if ((count ?? 0) >= PENDING_CAP) {
    console.error(`line ${row.line}: ${row.email} already has ${PENDING_CAP} pending experiences; skipped.`);
    continue;
  }
  try {
    console.log(`line ${row.line}: imported ${await insertRow(userId, row)}`);
    imported++;
  } catch (e) {
    console.error(`line ${row.line}: failed (${(e as Error).message}); rolled back.`);
  }
}
console.error(`Imported ${imported} of ${rows.length} as pending. Verify them at /admin.`);
