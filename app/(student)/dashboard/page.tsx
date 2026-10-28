import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlanSummary } from "@/components/plans/PlanSummary";
import { ArrowLink, PillLink, textLink } from "@/components/ui/pill";
import { card, EmptyState, Notice, PageHeader, pageMain } from "@/components/ui/surface";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { listMyPlans } from "@/lib/data/plans";
import { getMyProfile } from "@/lib/data/profile";
import { isProfileComplete } from "@/lib/eligibility";

export const metadata: Metadata = { title: "Dashboard" };

// §3.4: the dashboard streams its two independent reads through <Suspense>.
export default function DashboardPage() {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <PageHeader
        title="Dashboard"
        lede="Your prep plans and how far along each one is. Plans are dated to the drive, so this week's topics are always on top."
        actions={<PillLink href="/drives?eligibleOnly=1">Browse eligible drives</PillLink>}
      />
      <Suspense fallback={null}>
        <ProfileNudge />
      </Suspense>
      <section aria-labelledby="plans" className="mt-2">
        <h2 id="plans" className="type-label text-ink-dim">
          Your prep plans
        </h2>
        <Suspense
          fallback={
            <div role="status" aria-label="Loading your plans" className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden="true" className={cn(card, "h-[200px] animate-pulse")} />
              ))}
            </div>
          }
        >
          <Plans />
        </Suspense>
      </section>
      <section aria-labelledby="contribute" className={cn(card, "mt-10 grid gap-4 p-5 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8")}>
        <div>
          <h2 id="contribute" className="type-title text-ink">
            Placed already?
          </h2>
          <p className="mt-1 max-w-[60ch] type-small text-ink-muted">
            Share what your rounds asked. Once verified it feeds every junior&rsquo;s plan for that company.
          </p>
        </div>
        <ArrowLink href="/experiences/new">Share your experience</ArrowLink>
      </section>
    </main>
  );
}

async function ProfileNudge() {
  const profile = await getMyProfile();
  if (profile && isProfileComplete(profile)) return null;
  return (
    <Notice className="mb-8">
      <span role="note">
        Your profile is incomplete, so we can&rsquo;t check which drives you&rsquo;re eligible for.{" "}
        <Link href="/onboarding?next=/dashboard" className={textLink}>
          Complete your profile
        </Link>
      </span>
    </Notice>
  );
}

async function Plans() {
  const user = await requireUser("/dashboard");
  const plans = await listMyPlans(user.id);
  const now = new Date();
  if (!plans.length) {
    return (
      <div className="mt-4">
        <EmptyState
          title="No plans yet."
          action={<PillLink href="/drives?eligibleOnly=1" variant="primary">Browse drives you&rsquo;re eligible for</PillLink>}
        >
          Open an upcoming drive and choose &ldquo;Generate my prep plan&rdquo;. You get a week-by-week checklist up to the
          drive date.
        </EmptyState>
      </div>
    );
  }
  return (
    <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => (
        <li key={p.id}>
          <PlanSummary plan={p} now={now} />
        </li>
      ))}
    </ul>
  );
}
