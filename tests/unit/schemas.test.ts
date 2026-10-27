import { describe, expect, it } from "vitest";
import { credentialsSchema, safeNextPath } from "@/lib/schemas";
import { isProtectedPath } from "@/lib/supabase/proxy";

describe("credentialsSchema", () => {
  it("accepts and normalises valid credentials", () => {
    const parsed = credentialsSchema.safeParse({ email: " A@LPU.in ", password: "password123" });
    expect(parsed.success && parsed.data.email).toBe("a@lpu.in");
  });

  it("rejects an invalid email or short password", () => {
    expect(credentialsSchema.safeParse({ email: "nope", password: "password123" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ email: "a@lpu.in", password: "short" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/dashboard/plans/1", "/dashboard/plans/1"],
    ["https://evil.example", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    [undefined, "/dashboard"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("isProtectedPath (§2.1 matcher)", () => {
  it.each([
    ["/admin", true],
    ["/admin/drives", true],
    ["/dashboard", true],
    ["/dashboard/plans/abc", true],
    ["/onboarding", true],
    ["/experiences/new", true],
    ["/api/plans/abc/export", true],
    ["/", false],
    ["/drives", false],
    ["/experiences", false],
    ["/experiences/abc", false],
    ["/administrator", false],
    ["/login", false],
  ])("%s → %s", (path, expected) => {
    expect(isProtectedPath(path)).toBe(expected);
  });
});
