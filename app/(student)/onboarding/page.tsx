import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { LoadingState } from "@/components/route-states";
import { card, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { getMyProfile } from "@/lib/data/profile";
import { listBranches } from "@/lib/data/taxonomy";
import { isProfileComplete } from "@/lib/eligibility";
import { safeNextPath } from "@/lib/schemas";

export const metadata: Metadata = { title: "Your profile" };

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <Suspense fallback={<LoadingState label="Loading your profile…" />}>
        <Onboarding searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Onboarding({ searchParams }: Pick<PageProps<"/onboarding">, "searchParams">) {
  const { next } = await searchParams;
  const [profile, branches] = await Promise.all([getMyProfile(), listBranches()]);
  if (!profile) redirect("/login?next=/onboarding");

  const complete = isProfileComplete(profile);
  const safeNext = typeof next === "string" ? safeNextPath(next, "") || undefined : undefined;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-14">
      <div className="lg:sticky lg:top-24">
        <p className="type-label text-ink-dim">{complete ? "Profile" : "Step 1 of 2"}</p>
        <h1 className="mt-4 max-w-[12ch] type-section text-balance text-ink">{complete ? "Your profile" : "Complete your profile"}</h1>
        <p className="mt-5 max-w-[46ch] type-body text-pretty text-ink-muted">
          Eligibility for every drive is checked against these details. They are visible only to you and the placement
          cell.
        </p>
        {!complete && (
          <p className="mt-4 max-w-[46ch] type-small text-ink-dim">
            Next: open a drive you&rsquo;re eligible for and generate your prep plan.
          </p>
        )}
      </div>
      <div className="grid gap-6">
        <div className={cn(card, "p-5 md:p-8")}>
          <ProfileForm profile={profile} branches={branches} next={safeNext} />
        </div>
        <DeleteAccountForm />
      </div>
    </div>
  );
}
