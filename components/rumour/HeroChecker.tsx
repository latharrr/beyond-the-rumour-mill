"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { checkClaims } from "@/app/_actions/rumour";
import { TopicPicker } from "@/components/experiences/TopicPicker";
import { FieldError, FormMessage, label, select } from "@/components/ui/field";
import { Button } from "@/components/ui/pill";
import { StatusPill } from "@/components/ui/status";
import type { SearchableTopic } from "@/hooks/useTopicSearch";
import { cn } from "@/lib/cn";
import type { Company } from "@/lib/taxonomy";
import { VERDICT_TONE } from "./VerdictCard";

/**
 * Compact claim checker for the home hero. Same server action and rule as /rumour-check
 * (checkClaims: one company, up to 5 topics, one verdict each), no sign-in needed.
 */
export function HeroChecker({ companies, topics }: { companies: Company[]; topics: SearchableTopic[] }) {
  const [state, action, pending] = useActionState(checkClaims, null);
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // The claim that was last submitted, so the "full check" link opens it already checked.
  const [fullCheck, setFullCheck] = useState("/rumour-check");

  return (
    <form
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        params.set("company_id", String(data.get("company_id") ?? ""));
        for (const id of data.getAll("topic_id")) params.append("topic_id", String(id));
        setFullCheck(`/rumour-check?${params}`);
        startTransition(() => action(data));
      }}
      className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-panel p-5 shadow-[var(--shadow-bar)] md:p-6"
      aria-labelledby="hero-check-title"
    >
      <div>
        <p className="type-label text-ink-dim">Try it now, no sign-in</p>
        <h2 id="hero-check-title" className="mt-2 font-serif text-[22px] leading-tight text-ink">
          &ldquo;[Company] heavily asks [topic]&rdquo;
        </h2>
      </div>
      <div>
        <label htmlFor="hero_company_id" className={label}>
          Company
        </label>
        <select
          id="hero_company_id"
          name="company_id"
          defaultValue=""
          aria-describedby="hero_company_id-error"
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
        <FieldError id="hero_company_id-error">{errors?.company_id?.[0]}</FieldError>
      </div>
      <TopicPicker topics={topics} name="topic_id" label="Topics (one or more, up to 5)" multiple error={errors?.topic_ids?.[0]} />
      {state && !state.ok && !state.fieldErrors && <FormMessage ok={false}>{state.message}</FormMessage>}
      <Button type="submit" disabled={pending} className="w-full min-w-0 justify-center px-4">
        {pending ? "Checking…" : "Check claim"}
      </Button>
      <div aria-live="polite">
        {state?.ok && (
          <ul className="grid gap-4 border-t border-line pt-4">
            {state.data.map((r) => (
              <li key={r.topic} className="grid gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="type-small font-medium text-ink">
                    {r.company} · {r.topic}
                  </span>
                  <StatusPill tone={VERDICT_TONE[r.verdict]}>{r.verdict}</StatusPill>
                </div>
                <p className="type-small text-ink-muted">
                  {r.total === 0 ? (
                    `No verified ${r.company} experiences yet.`
                  ) : (
                    <>
                      <span className="type-data text-ink">
                        {r.cites.length} of {r.total}
                      </span>{" "}
                      verified experience{r.total === 1 ? "" : "s"} mention {r.topic}.
                    </>
                  )}
                  {r.lowSample && r.total > 0 && (
                    <span className="ml-2 font-medium text-ink">Low sample (n = {r.total}), read with care.</span>
                  )}
                </p>
              </li>
            ))}
            <li>
              <Link href={fullCheck} className="type-small text-ink underline underline-offset-4">
                See cited experiences on the full check
              </Link>
            </li>
          </ul>
        )}
      </div>
      <p className="type-small text-ink-dim">Fewer than 3 verified experiences is flagged as a low sample. Unverified tips never count.</p>
    </form>
  );
}
