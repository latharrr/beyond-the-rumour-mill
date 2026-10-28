"use client";

import Link from "next/link";
import { type ReactNode, useActionState, useState } from "react";
import { z } from "zod";
import { submitExperience } from "@/app/_actions/experiences";
import { CheckIcon } from "@/components/icons";
import { FieldError, FormMessage, hint, label, select, textarea } from "@/components/ui/field";
import { ArrowLink, Button, textLink } from "@/components/ui/pill";
import { card } from "@/components/ui/surface";
import type { SearchableTopic } from "@/hooks/useTopicSearch";
import type { ActionState, FieldErrors } from "@/lib/action-result";
import { cn } from "@/lib/cn";
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

/** One numbered block of the submit form. */
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <legend className="float-left flex items-center gap-3 type-title text-ink">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-line type-data text-[13px] text-ink-muted">
          {n}
        </span>
        {title}
      </legend>
      <div className="clear-both grid gap-5">{children}</div>
    </fieldset>
  );
}

/** Single-page submit form in four numbered steps. */
export function SubmitWizard({ companies, roles, drives, topics, resources }: Props) {
  const [state, action, pending] = useActionState(submitExperience, null as ActionState<{ id: string }>);
  const [clientErrors, setClientErrors] = useState<FieldErrors>();
  const [companyId, setCompanyId] = useState("");
  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);
  const err = (name: string) => errors?.[name]?.[0];

  if (state?.ok) {
    return (
      <section aria-labelledby="thanks" className={cn(card, "p-6 md:p-10")}>
        <span className="grid size-10 place-items-center rounded-full bg-verified/15 text-verified">
          <CheckIcon className="size-5" strokeWidth={2.25} />
        </span>
        <h2 id="thanks" className="mt-5 type-section text-ink">
          Thanks for sharing
        </h2>
        <p className="mt-4 type-body text-ink">{state.message}</p>
        <p className="mt-3 max-w-[60ch] type-body text-pretty text-ink-muted">
          A placement-cell admin will check it against your evidence. Until then it appears in the{" "}
          <Link href="/experiences#community-tips" className={textLink}>
            community-tips lane
          </Link>
          , marked unverified and without your name. Once verified it joins the verified list and starts feeding
          juniors&rsquo; prep plans.
        </p>
        <div className="mt-8">
          <ArrowLink href="/experiences">See all experiences</ArrowLink>
        </div>
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
    <form action={action} onSubmit={validate} noValidate className={cn(card, "grid gap-8 p-5 md:p-8")}>
      <Step n={1} title="The drive">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="company_id" className={label}>
              Company
            </label>
            <select
              id="company_id"
              name="company_id"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              aria-invalid={!!err("company_id")}
              aria-describedby="company_id-error"
              className={cn(select, "mt-2")}
            >
              <option value="">Choose a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError id="company_id-error">{err("company_id")}</FieldError>
          </div>
          <RoleSelect roles={roles} error={err("role_id")} />
        </div>
        <div>
          <label htmlFor="drive_id" className={label}>
            Drive (optional)
          </label>
          <select id="drive_id" name="drive_id" defaultValue="" aria-describedby="drive_id-error" className={cn(select, "mt-2")}>
            <option value="">Not tied to a listed drive</option>
            {drives
              .filter((d) => !companyId || d.company_id === companyId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
          </select>
          <FieldError id="drive_id-error">{err("drive_id")}</FieldError>
        </div>
      </Step>

      <Step n={2} title="What happened">
        <div>
          <label htmlFor="rounds_summary" className={label}>
            What happened in each round?
          </label>
          <textarea
            id="rounds_summary"
            name="rounds_summary"
            rows={6}
            placeholder="Online test: sections, timing, question types. Technical round: what they asked. HR: …"
            aria-invalid={!!err("rounds_summary")}
            aria-describedby="rounds_summary-error"
            className={cn(textarea, "mt-2")}
          />
          <FieldError id="rounds_summary-error">{err("rounds_summary")}</FieldError>
        </div>
        <div>
          <label htmlFor="preparation_timeline" className={label}>
            How did you prepare, and for how long? (optional)
          </label>
          <textarea id="preparation_timeline" name="preparation_timeline" rows={3} className={cn(textarea, "mt-2 min-h-24")} />
        </div>
      </Step>

      <Step n={3} title="Topics and resources">
        <TopicPicker topics={topics} name="topic_ids" multiple label="Topics you were asked" error={err("topic_ids")} />
        <fieldset>
          <legend className={label}>Resources that helped (optional)</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {resources.map((r) => (
              <label
                key={r.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-line px-3 text-[14px] text-ink-muted transition-colors duration-150 hover:bg-panel-2 has-[:checked]:border-white/16 has-[:checked]:bg-panel-2 has-[:checked]:text-ink"
              >
                <input type="checkbox" name="resource_ids" value={r.id} className="size-4 shrink-0 accent-amber" />
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Step>

      <Step n={4} title="Evidence">
        <div>
          <label htmlFor="evidence" className={label}>
            Evidence: offer letter or interview email (optional, JPEG/PNG/PDF, max 4 MB)
          </label>
          <input
            id="evidence"
            name="evidence"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            aria-describedby="evidence-help evidence-error"
            className="mt-2 block w-full rounded-[10px] border border-dashed border-line bg-ground/40 p-3 text-[14px] text-ink-muted file:mr-4 file:h-9 file:rounded-full file:border-0 file:bg-panel-2 file:px-4 file:text-[14px] file:font-medium file:text-ink hover:file:bg-white/10"
          />
          <p id="evidence-help" className={hint}>
            Only placement-cell admins can open it, for 60 seconds at a time. It is never shown publicly.
          </p>
          <FieldError id="evidence-error">{err("evidence")}</FieldError>
        </div>
      </Step>

      {state && !state.ok && !state.fieldErrors && <FormMessage ok={false}>{state.message}</FormMessage>}
      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="type-small text-ink-dim">It goes to the verification queue; nothing is public until it&rsquo;s checked.</p>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Submitting…" : "Submit for verification"}
        </Button>
      </div>
    </form>
  );
}
