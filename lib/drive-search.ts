// Pure /drives filtering (§3.1: q, company, eligibleOnly). Kept separate from
// the data layer so it is unit-testable.
import {
  type BranchLabels,
  type EligibilityDrive,
  type EligibilityProfile,
  type EligibilityResult,
  evaluateEligibility,
} from "@/lib/eligibility";

export type SearchableDrive = EligibilityDrive & {
  /** Public hiring listings have no campus rules to check; undefined means campus. */
  source_kind?: "campus" | "public_hiring";
  id: string;
  title: string;
  company: { id: string; name: string };
  role: { label: string; aliases: string[] };
};

export type DriveFilterInput = { q?: string; company?: string; eligibleOnly: boolean };

export type DriveMatch<D> = { drive: D; eligibility: EligibilityResult | null };

const norm = (s: string) => s.toLowerCase().normalize("NFKD");

/** Matches title, company name, role label and role aliases ("SDE"). */
export function matchesQuery(drive: SearchableDrive, q: string | undefined): boolean {
  if (!q) return true;
  const needle = norm(q);
  return [drive.title, drive.company.name, drive.role.label, ...drive.role.aliases].some((h) => norm(h).includes(needle));
}

/**
 * Applies filters and attaches eligibility when a profile is known.
 * eligibleOnly with no profile returns nothing eligible-filtered: the page
 * asks the visitor to sign in instead (eligibility is never guessed).
 */
export function filterDrives<D extends SearchableDrive>(
  drives: D[],
  filters: DriveFilterInput,
  profile: EligibilityProfile | null,
  branchLabels: BranchLabels = {},
): DriveMatch<D>[] {
  return drives
    .filter((d) => matchesQuery(d, filters.q))
    .filter((d) => !filters.company || d.company.id === filters.company)
    .map((d) => ({ drive: d, eligibility: profile && d.source_kind !== "public_hiring" ? evaluateEligibility(profile, d, branchLabels) : null }))
    .filter((m) => !filters.eligibleOnly || (m.eligibility?.eligible ?? false));
}
