"use client";

import { useActionState, useState } from "react";
import { createDrive, updateDrive } from "@/app/_actions/drives";
import type { ActionState } from "@/lib/action-result";
import type { DriveDetail } from "@/lib/data/drives";
import type { Branch, Company, Resource, Role, Topic } from "@/lib/data/taxonomy";
import { DRIVE_STATUSES } from "@/lib/schemas";

type Round = { name: string; description: string; topic_ids: string[]; resource_ids: string[] };

type Props = {
  drive?: DriveDetail;
  companies: Company[];
  roles: Role[];
  branches: Branch[];
  topics: Topic[];
  resources: Resource[];
};

const emptyRound = (): Round => ({ name: "", description: "", topic_ids: [], resource_ids: [] });
const selected = (e: React.ChangeEvent<HTMLSelectElement>) => Array.from(e.target.selectedOptions, (o) => o.value);

/** Admin create/edit form for a drive and its rounds (one save_drive transaction). */
export function DriveForm({ drive, companies, roles, branches, topics, resources }: Props) {
  const [state, action, pending] = useActionState(drive ? updateDrive : createDrive, null as ActionState<{ id: string }>);
  const [rounds, setRounds] = useState<Round[]>(
    drive?.rounds.map((r) => ({
      name: r.name,
      description: r.description ?? "",
      topic_ids: r.topics.map((t) => t.id),
      resource_ids: r.resources.map((x) => x.id),
    })) ?? [emptyRound()],
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const err = (name: string) => errors?.[name]?.[0] && <p role="alert">{errors[name]![0]}</p>;
  const update = (i: number, patch: Partial<Round>) => setRounds((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <form action={action} key={drive?.id ?? "new"}>
      <h2>{drive ? `Edit: ${drive.title}` : "New drive"}</h2>
      {drive && <input type="hidden" name="id" value={drive.id} />}
      <input type="hidden" name="rounds" value={JSON.stringify(rounds)} />

      <label htmlFor="title">Title</label>
      <input id="title" name="title" defaultValue={drive?.title} required />
      {err("title")}

      <label htmlFor="company_id">Company</label>
      <select id="company_id" name="company_id" defaultValue={drive?.company_id ?? ""}>
        <option value="">Choose…</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {err("company_id")}

      <label htmlFor="role_id">Role</label>
      <select id="role_id" name="role_id" defaultValue={drive?.role_id ?? ""}>
        <option value="">Choose…</option>
        {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      {err("role_id")}

      <label htmlFor="status">Status</label>
      <select id="status" name="status" defaultValue={drive?.status ?? "upcoming"}>
        {DRIVE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label htmlFor="drive_date">Drive date</label>
      <input id="drive_date" name="drive_date" type="date" defaultValue={drive?.drive_date ?? ""} />
      {err("drive_date")}

      <label htmlFor="location">Location</label>
      <input id="location" name="location" defaultValue={drive?.location ?? ""} />

      <fieldset>
        <legend>Eligibility</legend>
        <label htmlFor="eligibility_cgpa">Minimum CGPA (blank = none)</label>
        <input id="eligibility_cgpa" name="eligibility_cgpa" type="number" step="0.01" min="0" max="10" defaultValue={drive?.eligibility_cgpa ?? ""} />
        {err("eligibility_cgpa")}
        <label htmlFor="max_backlogs">Max active backlogs</label>
        <input id="max_backlogs" name="max_backlogs" type="number" min="0" defaultValue={drive?.max_backlogs ?? 0} />
        {err("max_backlogs")}
        <label htmlFor="min_10th_pct">Minimum 10th % (blank = none)</label>
        <input id="min_10th_pct" name="min_10th_pct" type="number" step="0.01" min="0" max="100" defaultValue={drive?.min_10th_pct ?? ""} />
        {err("min_10th_pct")}
        <label htmlFor="min_12th_pct">Minimum 12th % (blank = none)</label>
        <input id="min_12th_pct" name="min_12th_pct" type="number" step="0.01" min="0" max="100" defaultValue={drive?.min_12th_pct ?? ""} />
        {err("min_12th_pct")}
        <label htmlFor="grad_years">Batches (comma-separated, blank = all)</label>
        <input id="grad_years" name="grad_years" defaultValue={drive?.grad_years.join(", ") ?? ""} placeholder="2026, 2027" />
        {err("grad_years")}
        <p>Eligible branches (none ticked = all branches)</p>
        {branches.map((b) => (
          <label key={b.id}>
            <input type="checkbox" name="branch_ids" value={b.id} defaultChecked={drive?.branch_ids.includes(b.id)} /> {b.code}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Rounds</legend>
        {err("rounds")}
        {rounds.map((r, i) => (
          <fieldset key={i}>
            <legend>Round {i + 1}</legend>
            <label htmlFor={`round-${i}-name`}>Name</label>
            <input id={`round-${i}-name`} value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
            <label htmlFor={`round-${i}-description`}>Description</label>
            <textarea id={`round-${i}-description`} value={r.description} onChange={(e) => update(i, { description: e.target.value })} />
            <label htmlFor={`round-${i}-topics`}>Topics</label>
            <select id={`round-${i}-topics`} multiple value={r.topic_ids} onChange={(e) => update(i, { topic_ids: selected(e) })}>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.category}: {t.label}</option>)}
            </select>
            <label htmlFor={`round-${i}-resources`}>Resources</label>
            <select id={`round-${i}-resources`} multiple value={r.resource_ids} onChange={(e) => update(i, { resource_ids: selected(e) })}>
              {resources.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
            <button type="button" onClick={() => setRounds((rs) => rs.filter((_, j) => j !== i))}>Remove round</button>
          </fieldset>
        ))}
        <button type="button" onClick={() => setRounds((rs) => [...rs, emptyRound()])}>Add round</button>
      </fieldset>

      {state && !state.ok && <p role="alert">{state.message}</p>}
      {state?.ok && <p role="status">{state.message}</p>}
      <button type="submit" disabled={pending}>{pending ? "Saving…" : drive ? "Save changes" : "Create drive"}</button>
    </form>
  );
}
