// Upserts data/public-opportunities.json into public.drives as source_kind =
// 'public_hiring'. Needs SUPABASE_URL and SUPABASE_SECRET_KEY (service role).
// Idempotent: a row is matched by source_url. Never touches campus drives.
import { readFileSync } from "node:fs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SECRET_KEY");
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const rest = (p, init = {}) => fetch(`${url}/rest/v1/${p}`, { ...init, headers: { ...h, ...(init.headers ?? {}) } });
const json = async (r) => {
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

const { checked, opportunities } = JSON.parse(readFileSync(new URL("../data/public-opportunities.json", import.meta.url)));
const companies = Object.fromEntries((await json(await rest("companies?select=id,name"))).map((c) => [c.name, c.id]));
const roles = Object.fromEntries((await json(await rest("roles?select=id,label"))).map((r) => [r.label, r.id]));

for (const o of opportunities) {
  const row = {
    company_id: companies[o.company],
    role_id: roles[o.role],
    title: o.title,
    max_backlogs: 0,
    grad_years: o.grad_years,
    location: o.location,
    status: "upcoming",
    source_kind: "public_hiring",
    source_url: o.source_url,
    apply_url: o.apply_url,
    application_deadline: o.application_deadline,
    deadline_note: o.deadline_note,
    eligibility_note: o.eligibility_note,
    verified_on: checked,
  };
  if (!row.company_id || !row.role_id) throw new Error(`Missing company or role for ${o.title}`);
  const existing = await json(await rest(`drives?select=id&source_url=eq.${encodeURIComponent(o.source_url)}`));
  if (existing.length) {
    await json(await rest(`drives?id=eq.${existing[0].id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }));
    console.log("updated", o.title);
  } else {
    await json(await rest("drives", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(row) }));
    console.log("inserted", o.title);
  }
}
