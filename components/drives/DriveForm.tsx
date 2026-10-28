"use client";

import { type ReactNode, useActionState, useState } from "react";
import { createDrive, updateDrive } from "@/app/_actions/drives";
import { CloseIcon } from "@/components/icons";
import { FieldError, FormMessage, hint, input, label, select, textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import { card } from "@/components/ui/surface";
import type { ActionState } from "@/lib/action-result";
import { cn } from "@/lib/cn";
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
const multi = "w-full min-w-0 rounded-[10px] border border-line bg-panel p-1.5 text-[14px] text-ink [&>option]:rounded-md [&>option]:px-2 [&>option]:py-1.5 [&>option:checked]:bg-panel-2";

function Field({ id, text, error, children, help }: { id: string; text: string; error?: ReactNode; children: ReactNode; help?: string }) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      <div className="mt-2">{children}</div>
      {help && <p className={hint}>{help}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

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
  const err = (name: string) => errors?.[name]?.[0];
  const update = (i: number, patch: Partial<Round>) => setRounds((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const desc = (name: string) => ({ "aria-describedby": `${name}-error`, "aria-invalid": err(name) ? true : undefined });

  return (
    <form action={action} key={drive?.id ?? "new"} className={cn(card, "grid gap-8 p-5 md:p-8")}>
      <h2 className="type-title text-ink">{drive ? `Edit: ${drive.title}` : "New drive"}</h2>
      {drive && <input type="hidden" name="id" value={drive.id} />}
      <input type="hidden" name="rounds" value={JSON.stringify(rounds)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="title" text="Title" error={err("title")}>
            <input id="title" name="title" defaultValue={drive?.title} required className={input} {...desc("title")} />
          </Field>
        </div>
        <Field id="company_id" text="Company" error={err("company_id")}>
          <select id="company_id" name="company_id" defaultValue={drive?.company_id ?? ""} className={select} {...desc("company_id")}>
            <option value="">Choose…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="role_id" text="Role" error={err("role_id")}>
          <select id="role_id" name="role_id" defaultValue={drive?.role_id ?? ""} className={select} {...desc("role_id")}>
            <option value="">Choose…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="status" text="Status">
          <select id="status" name="status" defaultValue={drive?.status ?? "upcoming"} className={cn(select, "capitalize")}>
            {DRIVE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field id="drive_date" text="Drive date" error={err("drive_date")}>
          <input id="drive_date" name="drive_date" type="date" defaultValue={drive?.drive_date ?? ""} className={cn(input, "type-data")} {...desc("drive_date")} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="location" text="Location">
            <input id="location" name="location" defaultValue={drive?.location ?? ""} className={input} />
          </Field>
        </div>
      </div>

      <fieldset className="grid gap-5 border-t border-line pt-6">
        <legend className="float-left type-title text-ink">Eligibility</legend>
        <div className="clear-both grid gap-5 sm:grid-cols-2">
          <Field id="eligibility_cgpa" text="Minimum CGPA (blank = none)" error={err("eligibility_cgpa")}>
            <input id="eligibility_cgpa" name="eligibility_cgpa" type="number" step="0.01" min="0" max="10" defaultValue={drive?.eligibility_cgpa ?? ""} className={cn(input, "type-data")} {...desc("eligibility_cgpa")} />
          </Field>
          <Field id="max_backlogs" text="Max active backlogs" error={err("max_backlogs")}>
            <input id="max_backlogs" name="max_backlogs" type="number" min="0" defaultValue={drive?.max_backlogs ?? 0} className={cn(input, "type-data")} {...desc("max_backlogs")} />
          </Field>
          <Field id="min_10th_pct" text="Minimum 10th % (blank = none)" error={err("min_10th_pct")}>
            <input id="min_10th_pct" name="min_10th_pct" type="number" step="0.01" min="0" max="100" defaultValue={drive?.min_10th_pct ?? ""} className={cn(input, "type-data")} {...desc("min_10th_pct")} />
          </Field>
          <Field id="min_12th_pct" text="Minimum 12th % (blank = none)" error={err("min_12th_pct")}>
            <input id="min_12th_pct" name="min_12th_pct" type="number" step="0.01" min="0" max="100" defaultValue={drive?.min_12th_pct ?? ""} className={cn(input, "type-data")} {...desc("min_12th_pct")} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="grad_years" text="Batches (comma-separated, blank = all)" error={err("grad_years")}>
              <input id="grad_years" name="grad_years" defaultValue={drive?.grad_years.join(", ") ?? ""} placeholder="2026, 2027" className={cn(input, "type-data")} {...desc("grad_years")} />
            </Field>
          </div>
        </div>
        <fieldset>
          <legend className={label}>Eligible branches (none ticked = all branches)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {branches.map((b) => (
              <label
                key={b.id}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-3.5 text-[14px] text-ink-muted transition-colors duration-150 hover:bg-panel-2 has-[:checked]:border-white/16 has-[:checked]:bg-panel-2 has-[:checked]:text-ink md:min-h-9"
              >
                <input type="checkbox" name="branch_ids" value={b.id} defaultChecked={drive?.branch_ids.includes(b.id)} className="size-4 accent-amber" />
                {b.code}
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      <fieldset className="grid gap-4 border-t border-line pt-6">
        <legend className="float-left type-title text-ink">Rounds</legend>
        <div className="clear-both grid gap-4">
          <FieldError id="rounds-error">{err("rounds")}</FieldError>
          {rounds.map((r, i) => (
            <fieldset key={i} className="relative grid gap-4 rounded-[10px] border border-line bg-ground/40 p-4">
              <legend className="float-left flex h-11 items-center type-label text-ink-dim md:h-9">
                Round&nbsp;<span className="type-data">{i + 1}</span>
              </legend>
              <button
                type="button"
                onClick={() => setRounds((rs) => rs.filter((_, j) => j !== i))}
                className="absolute top-4 right-4 inline-flex h-11 items-center gap-1.5 type-small text-ink-muted hover:text-ink md:h-9"
              >
                <CloseIcon className="size-4" />
                Remove round
              </button>
              <div className="clear-both" />
              <Field id={`round-${i}-name`} text="Name">
                <input id={`round-${i}-name`} value={r.name} onChange={(e) => update(i, { name: e.target.value })} className={input} />
              </Field>
              <Field id={`round-${i}-description`} text="Description">
                <textarea id={`round-${i}-description`} value={r.description} onChange={(e) => update(i, { description: e.target.value })} className={cn(textarea, "min-h-20")} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field id={`round-${i}-topics`} text="Topics" help="Ctrl/⌘-click to pick several.">
                  <select id={`round-${i}-topics`} multiple value={r.topic_ids} onChange={(e) => update(i, { topic_ids: selected(e) })} className={cn(multi, "h-44")}>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.category}: {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id={`round-${i}-resources`} text="Resources" help="Ctrl/⌘-click to pick several.">
                  <select id={`round-${i}-resources`} multiple value={r.resource_ids} onChange={(e) => update(i, { resource_ids: selected(e) })} className={cn(multi, "h-44")}>
                    {resources.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.title}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </fieldset>
          ))}
          <div>
            <Button variant="secondary" onClick={() => setRounds((rs) => [...rs, emptyRound()])}>
              Add round
            </Button>
          </div>
        </div>
      </fieldset>

      {state && !state.ok && <FormMessage ok={false}>{state.message}</FormMessage>}
      {state?.ok && <FormMessage ok>{state.message}</FormMessage>}
      <div className="border-t border-line pt-6">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : drive ? "Save changes" : "Create drive"}
        </Button>
      </div>
    </form>
  );
}
