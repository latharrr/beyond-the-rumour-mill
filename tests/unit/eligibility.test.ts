import { describe, expect, it } from "vitest";
import {
  check10th,
  check12th,
  checkBacklogs,
  checkBranch,
  checkCgpa,
  checkGradYear,
  COMPLETE_PROFILE,
  type EligibilityDrive,
  type EligibilityProfile,
  evaluateEligibility,
  explainEligibility,
  isProfileComplete,
} from "@/lib/eligibility";

const CSE = "b-cse";
const IT = "b-it";
const ME = "b-me";
const labels = { [CSE]: "CSE", [IT]: "IT", [ME]: "ME" };

const profile = (over: Partial<EligibilityProfile> = {}): EligibilityProfile => ({
  branch_id: CSE, cgpa: 8, backlogs: 0, pct_10th: 85, pct_12th: 80, grad_year: 2026, ...over,
});
const drive = (over: Partial<EligibilityDrive> = {}): EligibilityDrive => ({
  eligibility_cgpa: 7, max_backlogs: 0, min_10th_pct: 60, min_12th_pct: 60, grad_years: [2026], branch_ids: [CSE, IT], ...over,
});

describe("checkCgpa", () => {
  it("passes at exactly the threshold", () => {
    expect(checkCgpa(profile({ cgpa: 7.5 }), drive({ eligibility_cgpa: 7.5 })).pass).toBe(true);
  });
  it("fails one hundredth below the threshold", () => {
    const r = checkCgpa(profile({ cgpa: 7.49 }), drive({ eligibility_cgpa: 7.5 }));
    expect(r).toMatchObject({ pass: false, reason: "Your CGPA 7.49 is below the 7.50 minimum" });
  });
  it("passes 10.00 against a 10.00 cutoff", () => {
    expect(checkCgpa(profile({ cgpa: 10 }), drive({ eligibility_cgpa: 10 })).pass).toBe(true);
  });
  it("is immune to float noise at the boundary", () => {
    expect(checkCgpa(profile({ cgpa: 0.1 + 0.2 }), drive({ eligibility_cgpa: 0.3 })).pass).toBe(true);
  });
  it("passes when the drive sets no cutoff, even with no CGPA on file", () => {
    expect(checkCgpa(profile({ cgpa: null }), drive({ eligibility_cgpa: null })).pass).toBe(true);
  });
  it("is incomplete when the drive needs a CGPA the profile lacks", () => {
    expect(checkCgpa(profile({ cgpa: null }), drive())).toEqual({ key: "cgpa", pass: false, reason: COMPLETE_PROFILE, incomplete: true });
  });
});

describe("checkBranch", () => {
  it("passes every branch when drive_branches is empty", () => {
    expect(checkBranch(profile({ branch_id: ME }), drive({ branch_ids: [] }), labels).pass).toBe(true);
    expect(checkBranch(profile({ branch_id: null }), drive({ branch_ids: [] })).pass).toBe(true);
  });
  it("passes a listed branch and fails an unlisted one with the allowed list", () => {
    expect(checkBranch(profile({ branch_id: IT }), drive(), labels).pass).toBe(true);
    expect(checkBranch(profile({ branch_id: ME }), drive(), labels)).toMatchObject({
      pass: false,
      reason: "Open to CSE, IT only; your branch (ME) is not eligible",
    });
  });
  it("is incomplete without a branch when the drive restricts branches", () => {
    expect(checkBranch(profile({ branch_id: null }), drive()).incomplete).toBe(true);
  });
});

describe("checkBacklogs", () => {
  it("passes at exactly the maximum and fails above it", () => {
    expect(checkBacklogs(profile({ backlogs: 1 }), drive({ max_backlogs: 1 })).pass).toBe(true);
    expect(checkBacklogs(profile({ backlogs: 2 }), drive({ max_backlogs: 1 }))).toMatchObject({
      pass: false,
      reason: "You have 2 active backlogs; the maximum allowed is 1",
    });
  });
  it("zero backlogs passes a zero-backlog drive", () => {
    expect(checkBacklogs(profile({ backlogs: 0 }), drive({ max_backlogs: 0 })).pass).toBe(true);
  });
  it("is incomplete when unknown", () => {
    expect(checkBacklogs(profile({ backlogs: null }), drive()).incomplete).toBe(true);
  });
});

describe("check10th / check12th", () => {
  it("pass at exactly the minimum, fail just below", () => {
    expect(check10th(profile({ pct_10th: 60 }), drive({ min_10th_pct: 60 })).pass).toBe(true);
    expect(check10th(profile({ pct_10th: 59.99 }), drive({ min_10th_pct: 60 })).pass).toBe(false);
    expect(check12th(profile({ pct_12th: 60 }), drive({ min_12th_pct: 60 })).pass).toBe(true);
    expect(check12th(profile({ pct_12th: 59.99 }), drive({ min_12th_pct: 60 })).reason).toBe(
      "Your 12th percentage 59.99% is below the 60.00% minimum",
    );
  });
  it("100% passes a 100% minimum", () => {
    expect(check10th(profile({ pct_10th: 100 }), drive({ min_10th_pct: 100 })).pass).toBe(true);
  });
  it("no minimum always passes; missing value is incomplete only when required", () => {
    expect(check10th(profile({ pct_10th: null }), drive({ min_10th_pct: null })).pass).toBe(true);
    expect(check12th(profile({ pct_12th: null }), drive()).incomplete).toBe(true);
  });
});

describe("checkGradYear", () => {
  it("empty grad_years means all batches", () => {
    expect(checkGradYear(profile({ grad_year: 2030 }), drive({ grad_years: [] })).pass).toBe(true);
    expect(checkGradYear(profile({ grad_year: null }), drive({ grad_years: [] })).pass).toBe(true);
  });
  it("passes a listed batch, fails others with the sorted list", () => {
    expect(checkGradYear(profile({ grad_year: 2027 }), drive({ grad_years: [2027, 2026] })).pass).toBe(true);
    expect(checkGradYear(profile({ grad_year: 2025 }), drive({ grad_years: [2027, 2026] })).reason).toBe(
      "Open to batches 2026, 2027 only; you graduate in 2025",
    );
  });
  it("is incomplete when required and missing", () => {
    expect(checkGradYear(profile({ grad_year: null }), drive()).incomplete).toBe(true);
  });
});

describe("evaluateEligibility + explainEligibility", () => {
  it("eligible profile has no failures and nothing to explain", () => {
    const r = evaluateEligibility(profile(), drive(), labels);
    expect(r).toMatchObject({ eligible: true, incomplete: false, failed: [] });
    expect(r.predicates).toHaveLength(6);
    expect(explainEligibility(r)).toEqual([]);
  });

  it("reports every failed predicate independently", () => {
    const r = evaluateEligibility(profile({ cgpa: 6, backlogs: 2, branch_id: ME }), drive(), labels);
    expect(r.eligible).toBe(false);
    expect(r.failed.map((f) => f.key)).toEqual(["cgpa", "branch", "backlogs"]);
    expect(explainEligibility(r).map((e) => e.sentence)).toEqual([
      "Your CGPA 6.00 is below the 7.00 minimum.",
      "Open to CSE, IT only; your branch (ME) is not eligible.",
      "You have 2 active backlogs; the maximum allowed is 0.",
    ]);
  });

  it("missing fields link to onboarding", () => {
    const r = evaluateEligibility(profile({ cgpa: null }), drive(), labels);
    expect(r.incomplete).toBe(true);
    expect(explainEligibility(r)).toEqual([
      { key: "cgpa", sentence: "Complete your profile: add your CGPA.", href: "/onboarding" },
    ]);
  });

  it("no profile at all (signed out) is incomplete, not ineligible", () => {
    const r = evaluateEligibility(null, drive());
    expect(r.eligible).toBe(false);
    expect(r.failed.every((f) => f.incomplete)).toBe(true);
  });

  it("a drive with no requirements accepts even an empty profile", () => {
    const open = drive({ eligibility_cgpa: null, min_10th_pct: null, min_12th_pct: null, grad_years: [], branch_ids: [], max_backlogs: 5 });
    expect(evaluateEligibility(profile({ cgpa: null, branch_id: null, pct_10th: null, pct_12th: null, grad_year: null }), open).eligible).toBe(true);
  });
});

describe("isProfileComplete", () => {
  it("requires every eligibility field", () => {
    expect(isProfileComplete(profile())).toBe(true);
    expect(isProfileComplete(profile({ pct_12th: null }))).toBe(false);
    expect(isProfileComplete(null)).toBe(false);
  });
});
