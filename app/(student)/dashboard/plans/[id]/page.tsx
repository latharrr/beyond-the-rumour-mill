import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Checklist } from "@/components/plans/Checklist";
import { PlanHeader } from "@/components/plans/PlanSummary";
import { LoadingState } from "@/components/route-states";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/data/drives";
import { getMyPlan } from "@/lib/data/plans";

// Owner-only: another user's plan id is a 404, same as a missing one.
export default function PlanPage({ params }: PageProps<"/dashboard/plans/[id]">) {
  return (
    <main>
      <Suspense fallback={<LoadingState label="Loading plan…" />}>
        <Plan params={params} />
      </Suspense>
    </main>
  );
}

async function Plan({ params }: Pick<PageProps<"/dashboard/plans/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/plans/${id}`);
  const plan = isUuid(id) ? await getMyPlan(user.id, id) : null;
  if (!plan) notFound();

  return (
    <>
      <PlanHeader plan={plan} />
      <Checklist items={plan.items} />
      <section aria-labelledby="provenance">
        <h2 id="provenance">Built from</h2>
        {plan.experiences.length ? (
          <ul>
            {plan.experiences.map((e) => (
              <li key={e.id}><Link href={`/experiences/${e.id}`}>{e.author}</Link></li>
            ))}
          </ul>
        ) : (
          <p>No verified experiences for this company yet; this plan uses the drive&rsquo;s listed round topics.</p>
        )}
      </section>
    </>
  );
}
