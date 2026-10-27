import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/schemas";

describe("loginSchema", () => {
  it("accepts a valid email", () => {
    expect(loginSchema.safeParse({ email: "a@lpu.in" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
