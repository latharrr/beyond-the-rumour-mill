import { describe, expect, it } from "vitest";
import { filterDrives, matchesQuery, type SearchableDrive } from "@/lib/drive-search";
import type { EligibilityProfile } from "@/lib/eligibility";

const drive = (id: string, over: Partial<SearchableDrive> = {}): SearchableDrive => ({
  id, title: `Drive ${id}`, company: { id: "c-tcs", name: "TCS" }, role: { label: "Software Engineer", aliases: ["SDE"] },
  eligibility_cgpa: 7, max_backlogs: 0, min_10th_pct: null, min_12th_pct: null, grad_years: [], branch_ids: [], ...over,
});
const profile: EligibilityProfile = { branch_id: "b", cgpa: 7.5, backlogs: 0, pct_10th: 80, pct_12th: 80, grad_year: 2026 };

describe("matchesQuery", () => {
  it("matches title, company, role label and alias, case-insensitively", () => {
    const d = drive("1");
    expect(matchesQuery(d, "drive 1")).toBe(true);
    expect(matchesQuery(d, "tcs")).toBe(true);
    expect(matchesQuery(d, "software")).toBe(true);
    expect(matchesQuery(d, "sde")).toBe(true);
    expect(matchesQuery(d, "amazon")).toBe(false);
    expect(matchesQuery(d, undefined)).toBe(true);
  });
});

describe("filterDrives", () => {
  const drives = [
    drive("1"),
    drive("2", { company: { id: "c-amz", name: "Amazon" }, eligibility_cgpa: 8 }),
  ];

  it("filters by company id", () => {
    expect(filterDrives(drives, { company: "c-amz", eligibleOnly: false }, null).map((m) => m.drive.id)).toEqual(["2"]);
  });
  it("attaches eligibility only when a profile is known", () => {
    expect(filterDrives(drives, { eligibleOnly: false }, null).every((m) => m.eligibility === null)).toBe(true);
    expect(filterDrives(drives, { eligibleOnly: false }, profile).map((m) => m.eligibility?.eligible)).toEqual([true, false]);
  });
  it("eligibleOnly keeps only eligible drives, and none without a profile", () => {
    expect(filterDrives(drives, { eligibleOnly: true }, profile).map((m) => m.drive.id)).toEqual(["1"]);
    expect(filterDrives(drives, { eligibleOnly: true }, null)).toEqual([]);
  });
});
