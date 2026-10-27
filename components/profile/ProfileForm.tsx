"use client";

import { useActionState, useState } from "react";
import { z } from "zod";
import { saveProfile } from "@/app/_actions/profile";
import type { ActionState, FieldErrors } from "@/lib/action-result";
import type { MyProfile } from "@/lib/data/profile";
import type { Branch } from "@/lib/data/taxonomy";
import { profileSchema } from "@/lib/schemas";

type Props = { profile: MyProfile; branches: Branch[]; next?: string };

const FIELDS = [
  { name: "cgpa", label: "CGPA (out of 10)", step: "0.01", min: 0, max: 10 },
  { name: "backlogs", label: "Active backlogs", step: "1", min: 0 },
  { name: "pct_10th", label: "10th percentage", step: "0.01", min: 0, max: 100 },
  { name: "pct_12th", label: "12th percentage", step: "0.01", min: 0, max: 100 },
  { name: "grad_year", label: "Graduation year", step: "1", min: 2000, max: 2100 },
] as const;

export function ProfileForm({ profile, branches, next }: Props) {
  const [state, action, pending] = useActionState(saveProfile, null as ActionState);
  const [clientErrors, setClientErrors] = useState<FieldErrors>();
  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const parsed = profileSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors);
    } else setClientErrors(undefined);
  }

  const err = (name: string) =>
    errors?.[name]?.[0] && <p id={`${name}-error`} role="alert">{errors[name]![0]}</p>;

  return (
    <form action={action} onSubmit={validate} noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <label htmlFor="branch_id">Branch</label>
      <select id="branch_id" name="branch_id" defaultValue={profile.branch_id ?? ""} aria-invalid={!!errors?.branch_id} aria-describedby="branch_id-error">
        <option value="">Choose your branch</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.code} — {b.label}</option>
        ))}
      </select>
      {err("branch_id")}

      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          <input
            id={f.name}
            name={f.name}
            type="number"
            inputMode="decimal"
            step={f.step}
            min={f.min}
            max={"max" in f ? f.max : undefined}
            defaultValue={profile[f.name] ?? ""}
            aria-invalid={!!errors?.[f.name]}
            aria-describedby={`${f.name}-error`}
          />
          {err(f.name)}
        </div>
      ))}

      {state && !state.ok && !state.fieldErrors && <p role="alert">{state.message}</p>}
      {state?.ok && <p role="status">{state.message}</p>}
      <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
