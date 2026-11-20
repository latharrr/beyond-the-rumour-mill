import { describe, expect, it } from "vitest";
import { claimsSchema, MAX_CLAIM_TOPICS } from "@/lib/validation";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("claimsSchema (multi-topic rumour check)", () => {
  it("accepts one or more topics and drops duplicates", () => {
    const r = claimsSchema.safeParse({ company_id: id(1), topic_ids: [id(2), id(3), id(2)] });
    expect(r.success && r.data.topic_ids).toEqual([id(2), id(3)]);
  });
  it("rejects no topics and too many topics", () => {
    expect(claimsSchema.safeParse({ company_id: id(1), topic_ids: [] }).success).toBe(false);
    const many = Array.from({ length: MAX_CLAIM_TOPICS + 1 }, (_, i) => id(i + 2));
    expect(claimsSchema.safeParse({ company_id: id(1), topic_ids: many }).success).toBe(false);
  });
  it("rejects a bad company or topic id", () => {
    expect(claimsSchema.safeParse({ company_id: "", topic_ids: [id(2)] }).success).toBe(false);
    expect(claimsSchema.safeParse({ company_id: id(1), topic_ids: ["nope"] }).success).toBe(false);
  });
});
