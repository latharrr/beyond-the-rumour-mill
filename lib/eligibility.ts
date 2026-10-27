// §2.7 Eligibility engine: independent predicates, each { pass, reason }.
// Pure functions; used server-side (drive pages, /drives?eligibleOnly) and
// client-side via hooks/useEligibility. Requirements a drive does not set
// always pass; a requirement the profile cannot answer yet is "incomplete".

export const COMPLETE_PROFILE = "Complete your profile";
export const ONBOARDING_HREF = "/onboarding";

export type EligibilityProfile = {
  branch_id: string | null;
  cgpa: number | null;
  backlogs: number | null;
  pct_10th: number | null;
  pct_12th: number | null;
  grad_year: number | null;
};

export type EligibilityDrive = {
  eligibility_cgpa: number | null;
  max_backlogs: number;
  min_10th_pct: number | null;
  min_12th_pct: number | null;
  grad_years: number[];
  branch_ids: string[]; // drive_branches; empty = all branches
};

export type PredicateKey = "cgpa" | "branch" | "backlogs" | "pct_10th" | "pct_12th" | "grad_year";

export type PredicateResult = {
  key: PredicateKey;
  pass: boolean;
  reason: string;
  incomplete?: true;
};

export type EligibilityResult = {
  eligible: boolean;
  incomplete: boolean;
  predicates: PredicateResult[];
  failed: PredicateResult[];
};

/** Branch id → display code ("CSE"), for readable reasons. */
export type BranchLabels = Record<string, string>;

const FIELD_NAME: Record<PredicateKey, string> = {
  cgpa: "CGPA",
  branch: "branch",
  backlogs: "backlog count",
  pct_10th: "10th percentage",
  pct_12th: "12th percentage",
  grad_year: "graduation year",
};

const pass = (key: PredicateKey, reason: string): PredicateResult => ({ key, pass: true, reason });
const fail = (key: PredicateKey, reason: string): PredicateResult => ({ key, pass: false, reason });
const incomplete = (key: PredicateKey): PredicateResult => ({ key, pass: false, reason: COMPLETE_PROFILE, incomplete: true });

// numeric(4,2) / numeric(5,2) arrive as JS numbers; compare in hundredths so
// 7.5 vs 7.50 or 0.1 + 0.2 style float noise can never flip a boundary.
const hundredths = (n: number) => Math.round(n * 100);
const two = (n: number) => n.toFixed(2);

function minimum(key: "cgpa" | "pct_10th" | "pct_12th", value: number | null | undefined, min: number | null, unit: string): PredicateResult {
  if (min == null) return pass(key, `No ${FIELD_NAME[key]} requirement`);
  if (value == null) return incomplete(key);
  return hundredths(value) >= hundredths(min)
    ? pass(key, `Your ${FIELD_NAME[key]} ${two(value)}${unit} meets the ${two(min)}${unit} minimum`)
    : fail(key, `Your ${FIELD_NAME[key]} ${two(value)}${unit} is below the ${two(min)}${unit} minimum`);
}

export const checkCgpa = (p: EligibilityProfile | null, d: EligibilityDrive) =>
  minimum("cgpa", p?.cgpa, d.eligibility_cgpa, "");

export const check10th = (p: EligibilityProfile | null, d: EligibilityDrive) =>
  minimum("pct_10th", p?.pct_10th, d.min_10th_pct, "%");

export const check12th = (p: EligibilityProfile | null, d: EligibilityDrive) =>
  minimum("pct_12th", p?.pct_12th, d.min_12th_pct, "%");

export function checkBranch(p: EligibilityProfile | null, d: EligibilityDrive, labels: BranchLabels = {}): PredicateResult {
  if (d.branch_ids.length === 0) return pass("branch", "Open to all branches");
  if (p?.branch_id == null) return incomplete("branch");
  const allowed = d.branch_ids.map((id) => labels[id] ?? "listed branches").join(", ");
  return d.branch_ids.includes(p.branch_id)
    ? pass("branch", `Your branch is eligible (${allowed})`)
    : fail("branch", `Open to ${allowed} only; your branch (${labels[p.branch_id] ?? "unknown"}) is not eligible`);
}

export function checkBacklogs(p: EligibilityProfile | null, d: EligibilityDrive): PredicateResult {
  if (p?.backlogs == null) return incomplete("backlogs");
  return p.backlogs <= d.max_backlogs
    ? pass("backlogs", `${p.backlogs} active backlog${p.backlogs === 1 ? "" : "s"} (maximum ${d.max_backlogs})`)
    : fail("backlogs", `You have ${p.backlogs} active backlogs; the maximum allowed is ${d.max_backlogs}`);
}

export function checkGradYear(p: EligibilityProfile | null, d: EligibilityDrive): PredicateResult {
  if (d.grad_years.length === 0) return pass("grad_year", "Open to all batches");
  if (p?.grad_year == null) return incomplete("grad_year");
  const batches = [...d.grad_years].sort((a, b) => a - b).join(", ");
  return d.grad_years.includes(p.grad_year)
    ? pass("grad_year", `Batch of ${p.grad_year} is eligible`)
    : fail("grad_year", `Open to batches ${batches} only; you graduate in ${p.grad_year}`);
}

export function evaluateEligibility(
  profile: EligibilityProfile | null,
  drive: EligibilityDrive,
  branchLabels: BranchLabels = {},
): EligibilityResult {
  const predicates = [
    checkCgpa(profile, drive),
    checkBranch(profile, drive, branchLabels),
    checkBacklogs(profile, drive),
    check10th(profile, drive),
    check12th(profile, drive),
    checkGradYear(profile, drive),
  ];
  const failed = predicates.filter((p) => !p.pass);
  return {
    eligible: failed.length === 0,
    incomplete: failed.some((p) => p.incomplete),
    predicates,
    failed,
  };
}

export type Explanation = { key: PredicateKey; sentence: string; href?: string };

/** Failed predicates as sentences for the drive page (IneligibilityExplainer). */
export function explainEligibility(result: EligibilityResult): Explanation[] {
  return result.failed.map((p) =>
    p.incomplete
      ? { key: p.key, sentence: `${COMPLETE_PROFILE}: add your ${FIELD_NAME[p.key]}.`, href: ONBOARDING_HREF }
      : { key: p.key, sentence: `${p.reason}.` },
  );
}

/** Every field the eligibility predicates can ask about is filled in. */
export function isProfileComplete(p: EligibilityProfile | null): boolean {
  return !!p && p.branch_id != null && p.cgpa != null && p.backlogs != null &&
    p.pct_10th != null && p.pct_12th != null && p.grad_year != null;
}
