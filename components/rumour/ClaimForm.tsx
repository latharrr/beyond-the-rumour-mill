"use client";

import { useActionState } from "react";
import { checkClaim, type ClaimCheck } from "@/app/_actions/rumour";
import { TopicPicker } from "@/components/experiences/TopicPicker";
import type { SearchableTopic } from "@/hooks/useTopicSearch";
import type { ActionState } from "@/lib/action-result";
import type { Company } from "@/lib/data/taxonomy";
import { VerdictCard } from "./VerdictCard";

/** Constrained claim input: company dropdown + topic picker, one claim type. */
export function ClaimForm({ companies, topics }: { companies: Company[]; topics: SearchableTopic[] }) {
  const [state, action, pending] = useActionState(checkClaim, null as ActionState<ClaimCheck>);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <>
      <form action={action}>
        <p>Check the claim: &ldquo;[company] heavily asks [topic]&rdquo;</p>
        <label htmlFor="company_id">Company</label>
        <select id="company_id" name="company_id" defaultValue="" aria-describedby="company_id-error">
          <option value="">Choose a company</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors?.company_id && <p id="company_id-error" role="alert">{errors.company_id[0]}</p>}
        <TopicPicker topics={topics} name="topic_id" label="Topic" error={errors?.topic_id?.[0]} />
        {state && !state.ok && !state.fieldErrors && <p role="alert">{state.message}</p>}
        <button type="submit" disabled={pending}>{pending ? "Checking…" : "Check claim"}</button>
      </form>
      {state?.ok && <VerdictCard result={state.data} />}
    </>
  );
}
