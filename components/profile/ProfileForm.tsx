"use client";

import { useActionState, useState } from "react";
import { z } from "zod";
import { saveProfile } from "@/app/_actions/profile";
import { FieldError, FormMessage, hint, input, label, select } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import type { ActionState, FieldErrors } from "@/lib/action-result";
import { cn } from "@/lib/cn";
import type { MyProfile } from "@/lib/data/profile";
import type { Branch } from "@/lib/data/taxonomy";
import { profileSchema } from "@/lib/schemas";

type Props = { profile: MyProfile; branches: Branch[]; next?: string };

const FIELDS = [
  { name: "cgpa", label: "CGPA (out of 10)", step: "0.01", min: 0, max: 10, hint: "As on your latest marksheet, e.g. 7.85" },
  { name: "backlogs", label: "Active backlogs", step: "1", min: 0, hint: "Uncleared subjects right now; 0 if none" },
  { name: "pct_10th", label: "10th percentage", step: "0.01", min: 0, max: 100 },
  { name: "pct_12th", label: "12th percentage", step: "0.01", min: 0, max: 100 },
  { name: "grad_year", label: "Graduation year", step: "1", min: 2000, max: 2100, hint: "Your batch, e.g. 2027" },
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

  const err = (name: string) => <FieldError id={`${name}-error`}>{errors?.[name]?.[0]}</FieldError>;

  return (
    <form action={action} onSubmit={validate} noValidate className="grid gap-6">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="branch_id" className={label}>
          Branch
        </label>
        <select
          id="branch_id"
          name="branch_id"
          defaultValue={profile.branch_id ?? ""}
          aria-invalid={!!errors?.branch_id}
          aria-describedby="branch_id-error"
          className={cn(select, "mt-2")}
        >
          <option value="">Choose your branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} — {b.label}
            </option>
          ))}
        </select>
        {err("branch_id")}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label htmlFor={f.name} className={label}>
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type="number"
              inputMode={f.step === "1" ? "numeric" : "decimal"}
              step={f.step}
              min={f.min}
              max={"max" in f ? f.max : undefined}
              defaultValue={profile[f.name] ?? ""}
              aria-invalid={!!errors?.[f.name]}
              aria-describedby={`${f.name}-error${"hint" in f ? ` ${f.name}-hint` : ""}`}
              className={cn(input, "mt-2 type-data")}
            />
            {"hint" in f && (
              <p id={`${f.name}-hint`} className={hint}>
                {f.hint}
              </p>
            )}
            {err(f.name)}
          </div>
        ))}
      </div>

      {state && !state.ok && !state.fieldErrors && <FormMessage ok={false}>{state.message}</FormMessage>}
      {state?.ok && <FormMessage ok>{state.message}</FormMessage>}
      <div className="border-t border-line pt-6">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
