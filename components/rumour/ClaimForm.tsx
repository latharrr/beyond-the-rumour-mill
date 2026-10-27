"use client";

import { useActionState } from "react";
import { checkClaim, type ClaimCheck } from "@/app/_actions/rumour";
import { TopicPicker } from "@/components/experiences/TopicPicker";
import { FieldError, FormMessage, label, select } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import { card } from "@/components/ui/surface";
import type { SearchableTopic } from "@/hooks/useTopicSearch";
import type { ActionState } from "@/lib/action-result";
import { cn } from "@/lib/cn";
import type { Company } from "@/lib/data/taxonomy";
import { VerdictCard } from "./VerdictCard";

/** Constrained claim input: company dropdown + topic picker, one claim type. */
export function ClaimForm({
  companies,
  topics,
  initial = null,
  defaultCompanyId = "",
  defaultTopicId,
}: {
  companies: Company[];
  topics: SearchableTopic[];
  /** A claim already checked on the server (e.g. linked from the landing page). */
  initial?: ActionState<ClaimCheck>;
  defaultCompanyId?: string;
  defaultTopicId?: string;
}) {
  const [state, action, pending] = useActionState(checkClaim, initial);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10">
      <form action={action} className={cn(card, "grid gap-6 p-5 md:p-6")}>
        <p className="type-small text-ink-muted">
          Check the claim: <span className="text-ink">&ldquo;[company] heavily asks [topic]&rdquo;</span>
        </p>
        <div>
          <label htmlFor="company_id" className={label}>
            Company
          </label>
          <select
            id="company_id"
            name="company_id"
            defaultValue={defaultCompanyId}
            aria-describedby="company_id-error"
            aria-invalid={errors?.company_id ? true : undefined}
            className={cn(select, "mt-2")}
          >
            <option value="">Choose a company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError id="company_id-error">{errors?.company_id?.[0]}</FieldError>
        </div>
        <TopicPicker
          topics={topics}
          name="topic_id"
          label="Topic"
          defaultSelected={defaultTopicId ? [defaultTopicId] : []}
          error={errors?.topic_id?.[0]}
        />
        {state && !state.ok && !state.fieldErrors && <FormMessage ok={false}>{state.message}</FormMessage>}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:justify-self-start">
          {pending ? "Checking…" : "Check claim"}
        </Button>
      </form>
      <div aria-live="polite">
        {state?.ok ? (
          <VerdictCard result={state.data} />
        ) : (
          <div className={cn(card, "hidden p-6 md:p-8 lg:block")}>
            <p className="type-title text-ink">The verdict appears here.</p>
            <p className="mt-2 max-w-[52ch] type-body text-ink-muted">
              Pick a company and a topic. The check counts how many verified experiences for that company mention the
              topic, and cites every one of them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
