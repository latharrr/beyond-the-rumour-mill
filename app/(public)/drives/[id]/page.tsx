import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DriveRequirements } from "@/components/drives/DriveRequirements";
import { EligibilityBadge } from "@/components/drives/EligibilityBadge";
import { IneligibilityExplainer } from "@/components/drives/IneligibilityExplainer";
import { RoundList } from "@/components/drives/RoundList";
import { GeneratePlanButton } from "@/components/plans/GeneratePlanButton";
import { LoadingState } from "@/components/route-states";
import { getSessionUser } from "@/lib/auth";
import { getDrive } from "@/lib/data/drives";
import { listMatchedExperiences } from "@/lib/data/experiences";
import { getMyPlanIdForDrive } from "@/lib/data/plans";
import { getMyProfile } from "@/lib/data/profile";
import { branchCodeMap, listBranches } from "@/lib/data/taxonomy";
import { evaluateEligibility, explainEligibility } from "@/lib/eligibility";
import { authorLabel } from "@/lib/format";

export default function DrivePage({ params }: PageProps<"/drives/[id]">) {
  return (
    <main>
      <Suspense fallback={<LoadingState label="Loading drive…" />}>
        <DriveDetailView params={params} />
      </Suspense>
    </main>
  );
}

async function DriveDetailView({ params }: Pick<PageProps<"/drives/[id]">, "params">) {
  const { id } = await params;
  const drive = await getDrive(id);
  if (!drive) notFound();

  const user = await getSessionUser();
  const [profile, branches, matched, planId] = await Promise.all([
    getMyProfile(),
    listBranches(),
    listMatchedExperiences(drive.company_id, drive.role_id),
    user ? getMyPlanIdForDrive(user.id, drive.id) : null,
  ]);
  const codes = branchCodeMap(branches);
  const eligibility = profile ? evaluateEligibility(profile, drive, codes) : null;

  return (
    <>
      <h1>{drive.title}</h1>
      <p>
        {drive.company.name} · {drive.role.label} · {drive.status}
        {drive.drive_date && <> · <time dateTime={drive.drive_date}>{drive.drive_date}</time></>}
        {drive.location && <> · {drive.location}</>}
      </p>

      <section aria-labelledby="requirements">
        <h2 id="requirements">Requirements</h2>
        <DriveRequirements drive={drive} branchCodes={codes} />
        {eligibility ? (
          <EligibilityBadge eligibility={eligibility} />
        ) : (
          <p><Link href={`/login?next=/drives/${drive.id}`}>Sign in</Link> to check your eligibility.</p>
        )}
        {eligibility && <IneligibilityExplainer explanations={explainEligibility(eligibility)} />}
      </section>

      <section aria-labelledby="prep-plan">
        <h2 id="prep-plan">Prep plan</h2>
        {user ? (
          <>
            {planId && <p><Link href={`/dashboard/plans/${planId}`}>Open your prep plan</Link></p>}
            <GeneratePlanButton driveId={drive.id} existing={!!planId} />
          </>
        ) : (
          <p><Link href={`/login?next=/drives/${drive.id}`}>Sign in</Link> to generate a prep plan for this drive.</p>
        )}
      </section>

      <section aria-labelledby="rounds">
        <h2 id="rounds">Rounds</h2>
        <RoundList rounds={drive.rounds} />
      </section>

      <section aria-labelledby="experiences">
        <h2 id="experiences">Verified experiences</h2>
        {matched.experiences.length === 0 ? (
          <p>No verified experiences for {drive.company.name} yet.</p>
        ) : (
          <>
            {matched.scope === "company" && <p>None for this role yet; showing other {drive.company.name} roles.</p>}
            <ul>
              {matched.experiences.map((e) => (
                <li key={e.id}>
                  <Link href={`/experiences/${e.id}`}>{authorLabel(e.author_role, e.grad_year)}</Link>
                  {e.rounds_summary && <p>{e.rounds_summary}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
