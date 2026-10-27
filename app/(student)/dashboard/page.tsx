import Link from "next/link";
import { Suspense } from "react";
import { PlanSummary } from "@/components/plans/PlanSummary";
import { LoadingState } from "@/components/route-states";
import { requireUser } from "@/lib/auth";
import { listMyPlans } from "@/lib/data/plans";
import { getMyProfile } from "@/lib/data/profile";
import { isProfileComplete } from "@/lib/eligibility";

// §3.4: the dashboard streams its two independent reads through <Suspense>.
export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <Suspense fallback={<LoadingState label="Checking your profile…" />}>
        <ProfileNudge />
      </Suspense>
      <section aria-labelledby="plans">
        <h2 id="plans">Your prep plans</h2>
        <Suspense fallback={<LoadingState label="Loading your plans…" />}>
          <Plans />
        </Suspense>
      </section>
    </main>
  );
}

async function ProfileNudge() {
  const profile = await getMyProfile();
  if (profile && isProfileComplete(profile)) return null;
  return (
    <p role="note">
      Your profile is incomplete, so we can&rsquo;t check which drives you&rsquo;re eligible for.{" "}
      <Link href="/onboarding?next=/dashboard">Complete your profile</Link>
    </p>
  );
}

async function Plans() {
  const user = await requireUser("/dashboard");
  const plans = await listMyPlans(user.id);
  if (!plans.length) {
    return (
      <p>
        No plans yet. Open an upcoming drive and choose &ldquo;Generate my prep plan&rdquo;.{" "}
        <Link href="/drives?eligibleOnly=1">Browse drives you&rsquo;re eligible for</Link>
      </p>
    );
  }
  return (
    <ul>
      {plans.map((p) => (
        <li key={p.id}><PlanSummary plan={p} /></li>
      ))}
    </ul>
  );
}
