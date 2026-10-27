"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { z } from "zod";
import { submitExperience } from "@/app/_actions/experiences";
import type { SearchableTopic } from "@/hooks/useTopicSearch";
import type { ActionState, FieldErrors } from "@/lib/action-result";
import type { DriveSummary } from "@/lib/data/drives";
import type { Company, Resource, Role } from "@/lib/data/taxonomy";
import { evidenceFileSchema, experienceSchema } from "@/lib/schemas";
import { RoleSelect } from "./RoleSelect";
import { TopicPicker } from "./TopicPicker";

type Props = {
  companies: Company[];
  roles: Role[];
  drives: Pick<DriveSummary, "id" | "title" | "company_id" | "role_id">[];
  topics: SearchableTopic[];
  resources: Resource[];
};

/** Single-page submit form (a multi-step wizard is a design-pass concern). */
export function SubmitWizard({ companies, roles, drives, topics, resources }: Props) {
  const [state, action, pending] = useActionState(submitExperience, null as ActionState<{ id: string }>);
  const [clientErrors, setClientErrors] = useState<FieldErrors>();
  const [companyId, setCompanyId] = useState("");
  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);
  const err = (name: string) => errors?.[name]?.[0];

  if (state?.ok) {
    return (
      <section aria-labelledby="thanks">
        <h2 id="thanks">Thanks for sharing</h2>
        <p>{state.message}</p>
        <p>
          A placement-cell admin will check it against your evidence. Until then it appears in the{" "}
          <Link href="/experiences#community-tips">community-tips lane</Link>, marked unverified and without your name.
          Once verified it joins the verified list and starts feeding juniors&rsquo; prep plans.
        </p>
      </section>
    );
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(event.currentTarget);
    const parsed = experienceSchema.safeParse({ ...Object.fromEntries(fd), topic_ids: fd.getAll("topic_ids"), resource_ids: fd.getAll("resource_ids") });
    const file = fd.get("evidence");
    const fileCheck = file instanceof File && file.size > 0 ? evidenceFileSchema.safeParse(file) : null;
    const fieldErrors: FieldErrors = parsed.success ? {} : (z.flattenError(parsed.error).fieldErrors as FieldErrors);
    if (fileCheck && !fileCheck.success) fieldErrors.evidence = fileCheck.error.issues.map((i) => i.message);
    if (Object.keys(fieldErrors).length) {
      event.preventDefault();
      setClientErrors(fieldErrors);
    } else setClientErrors(undefined);
  }

  return (
    <form action={action} onSubmit={validate} noValidate>
      <label htmlFor="company_id">Company</label>
      <select id="company_id" name="company_id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} aria-invalid={!!err("company_id")} aria-describedby="company_id-error">
        <option value="">Choose a company</option>
        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {err("company_id") && <p id="company_id-error" role="alert">{err("company_id")}</p>}

      <RoleSelect roles={roles} error={err("role_id")} />

      <label htmlFor="drive_id">Drive (optional)</label>
      <select id="drive_id" name="drive_id" defaultValue="" aria-describedby="drive_id-error">
        <option value="">Not tied to a listed drive</option>
        {drives.filter((d) => !companyId || d.company_id === companyId).map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
      </select>
      {err("drive_id") && <p id="drive_id-error" role="alert">{err("drive_id")}</p>}

      <label htmlFor="rounds_summary">What happened in each round?</label>
      <textarea id="rounds_summary" name="rounds_summary" rows={6} aria-invalid={!!err("rounds_summary")} aria-describedby="rounds_summary-error" />
      {err("rounds_summary") && <p id="rounds_summary-error" role="alert">{err("rounds_summary")}</p>}

      <label htmlFor="preparation_timeline">How did you prepare, and for how long? (optional)</label>
      <textarea id="preparation_timeline" name="preparation_timeline" rows={3} />

      <TopicPicker topics={topics} name="topic_ids" multiple label="Topics you were asked" error={err("topic_ids")} />

      <fieldset>
        <legend>Resources that helped (optional)</legend>
        {resources.map((r) => (
          <label key={r.id}><input type="checkbox" name="resource_ids" value={r.id} /> {r.title}</label>
        ))}
      </fieldset>

      <label htmlFor="evidence">Evidence: offer letter or interview email (optional, JPEG/PNG/PDF, max 4 MB)</label>
      <input id="evidence" name="evidence" type="file" accept="image/jpeg,image/png,application/pdf" aria-describedby="evidence-help evidence-error" />
      <p id="evidence-help">Only placement-cell admins can open it, for 60 seconds at a time. It is never shown publicly.</p>
      {err("evidence") && <p id="evidence-error" role="alert">{err("evidence")}</p>}

      {state && !state.ok && !state.fieldErrors && <p role="alert">{state.message}</p>}
      <button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit for verification"}</button>
    </form>
  );
}
