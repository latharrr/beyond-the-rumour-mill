import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { LoadingState } from "@/components/route-states";
import { getMyProfile } from "@/lib/data/profile";
import { listBranches } from "@/lib/data/taxonomy";
import { isProfileComplete } from "@/lib/eligibility";
import { safeNextPath } from "@/lib/schemas";

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <main>
      <Suspense fallback={<LoadingState label="Loading your profile…" />}>
        <Onboarding searchParams={searchParams} />
      </Suspense>
      <DeleteAccountForm />
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
    <>
      <h1>{complete ? "Your profile" : "Complete your profile"}</h1>
      <p>
        Eligibility for every drive is checked against these details. They are visible only to you and the placement
        cell.
      </p>
      <ProfileForm profile={profile} branches={branches} next={safeNext} />
    </>
  );
}
