import Link from "next/link";
import { Suspense } from "react";
import { DriveCard } from "@/components/drives/DriveCard";
import { DriveFilters } from "@/components/drives/DriveFilters";
import { LoadingState } from "@/components/route-states";
import { filterDrives } from "@/lib/drive-search";
import { listDrives } from "@/lib/data/drives";
import { getMyProfile } from "@/lib/data/profile";
import { branchCodeMap, listBranches, listCompanies } from "@/lib/data/taxonomy";
import { isProfileComplete } from "@/lib/eligibility";
import { driveFiltersSchema } from "@/lib/schemas";

export default function DrivesPage({ searchParams }: PageProps<"/drives">) {
  return (
    <main>
      <h1>Drives</h1>
      <Suspense fallback={<LoadingState label="Loading drives…" />}>
        <DriveResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function DriveResults({ searchParams }: Pick<PageProps<"/drives">, "searchParams">) {
  const filters = driveFiltersSchema.parse(await searchParams);
  const [drives, companies, branches, profile] = await Promise.all([listDrives(), listCompanies(), listBranches(), getMyProfile()]);
  const matches = filterDrives(drives, filters, profile, branchCodeMap(branches));

  return (
    <>
      <DriveFilters companies={companies} filters={filters} signedIn={!!profile} />

      {profile && !isProfileComplete(profile) && (
        <p>
          <Link href="/onboarding?next=/drives?eligibleOnly=1">Complete your profile</Link> to see which drives you&rsquo;re eligible for.
        </p>
      )}
      {!profile && filters.eligibleOnly && (
        <p>
          <Link href="/login?next=/drives?eligibleOnly=1">Sign in</Link> to filter drives by your eligibility.
        </p>
      )}

      {matches.length === 0 ? (
        <p>{drives.length === 0 ? "No drives have been published yet." : "No drives match these filters."}</p>
      ) : (
        <ul>
          {matches.map(({ drive, eligibility }) => (
            <li key={drive.id}>
              <DriveCard drive={drive} eligibility={eligibility} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
