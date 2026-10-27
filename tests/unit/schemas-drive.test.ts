import { describe, expect, it } from "vitest";
import { driveFiltersSchema, driveSchema, profileSchema } from "@/lib/schemas";

const U = "11111111-1111-4111-8111-111111111111";

describe("profileSchema", () => {
  const ok = { branch_id: U, cgpa: "8.25", backlogs: "0", pct_10th: "90", pct_12th: "88.5", grad_year: "2026" };
  it("coerces form strings", () => {
    expect(profileSchema.parse(ok)).toEqual({ branch_id: U, cgpa: 8.25, backlogs: 0, pct_10th: 90, pct_12th: 88.5, grad_year: 2026 });
  });
  it("enforces DB ranges and 2-decimal precision", () => {
    expect(profileSchema.safeParse({ ...ok, cgpa: "10.01" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, cgpa: "10" }).success).toBe(true);
    expect(profileSchema.safeParse({ ...ok, cgpa: "8.123" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, backlogs: "-1" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...ok, pct_10th: "100.5" }).success).toBe(false);
  });
  it("has no role field", () => {
    expect(Object.keys(profileSchema.shape)).not.toContain("role");
    expect(profileSchema.parse({ ...ok, role: "admin" })).not.toHaveProperty("role");
  });
});

describe("driveSchema", () => {
  const base = { company_id: U, role_id: U, title: "TCS NQT", status: "upcoming", max_backlogs: "", eligibility_cgpa: "", min_10th_pct: "", min_12th_pct: "", grad_years: "", drive_date: "", location: "", rounds: "" };
  it("blank optional fields become null / defaults", () => {
    expect(driveSchema.parse(base)).toMatchObject({
      eligibility_cgpa: null, max_backlogs: 0, min_10th_pct: null, grad_years: [], drive_date: null, location: null, rounds: [], branch_ids: [],
    });
  });
  it("parses grad years and rounds JSON", () => {
    const parsed = driveSchema.parse({
      ...base, grad_years: "2027, 2026 2026",
      rounds: JSON.stringify([{ name: "OA", description: "", topic_ids: [U] }]),
    });
    expect(parsed.grad_years).toEqual([2026, 2027]);
    expect(parsed.rounds).toEqual([{ name: "OA", description: null, topic_ids: [U], resource_ids: [] }]);
  });
  it("rejects malformed rounds JSON and bad status", () => {
    expect(driveSchema.safeParse({ ...base, rounds: "{nope" }).success).toBe(false);
    expect(driveSchema.safeParse({ ...base, status: "archived" }).success).toBe(false);
  });
});

describe("driveFiltersSchema", () => {
  it("drops invalid filters instead of failing the page", () => {
    expect(driveFiltersSchema.parse({ q: " tcs ", company: "nope", eligibleOnly: "1" })).toEqual({ q: "tcs", company: undefined, eligibleOnly: true });
    expect(driveFiltersSchema.parse({})).toEqual({ q: undefined, company: undefined, eligibleOnly: false });
  });
});
