import { describe, expect, it } from "vitest";
import { completeness, corroboration, recency, type TrustInput, trustBreakdown, trustScore } from "@/lib/trust";

const NOW = new Date("2026-10-28T00:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

const exp = (id: string, over: Partial<TrustInput> = {}): TrustInput => ({
  id, created_at: daysAgo(0), rounds_summary: "summary", preparation_timeline: "6 weeks",
  topic_ids: ["dp", "arrays"], resource_count: 1, has_evidence: true, ...over,
});

describe("recency", () => {
  it("is 1 today, e^-1 after 365 days, and never above 1 for future dates", () => {
    expect(recency(exp("a"), NOW)).toBe(1);
    expect(recency(exp("a", { created_at: daysAgo(365) }), NOW)).toBeCloseTo(Math.exp(-1), 10);
    expect(recency(exp("a", { created_at: daysAgo(-10) }), NOW)).toBe(1);
  });
});

describe("corroboration", () => {
  it("is 0 when there are no peers (zero-peer case)", () => {
    const only = exp("a");
    expect(corroboration(only, [only])).toBe(0);
    expect(corroboration(only, [])).toBe(0);
  });
  it("is the share of other company experiences sharing ≥1 topic", () => {
    const a = exp("a", { topic_ids: ["dp"] });
    const peers = [a, exp("b", { topic_ids: ["dp", "os"] }), exp("c", { topic_ids: ["os"] }), exp("d", { topic_ids: [] })];
    expect(corroboration(a, peers)).toBeCloseTo(1 / 3, 10);
  });
});

describe("completeness", () => {
  it("counts the 5 fields; evidence is a boolean input", () => {
    expect(completeness(exp("a"))).toBe(1);
    expect(completeness(exp("a", { has_evidence: false }))).toBe(0.8);
    expect(completeness(exp("a", { topic_ids: ["dp"] }))).toBe(0.8); // needs ≥2 topics
    expect(completeness(exp("a", { rounds_summary: "   ", preparation_timeline: null, topic_ids: [], resource_count: 0, has_evidence: false }))).toBe(0);
  });
});

describe("trustScore", () => {
  it("is round(100 × raw) and in 0–100", () => {
    const a = exp("a");
    const b = exp("b", { topic_ids: ["dp"] });
    // recency 1, corroboration 1 (b shares dp), completeness 1 → 100
    expect(trustScore(a, [a, b], NOW)).toBe(100);
  });

  it("zero peers caps the score at 60", () => {
    const a = exp("a");
    const b = trustBreakdown(a, [a], NOW);
    expect(b).toMatchObject({ corroboration: 0, score: 60 });
    expect(b.raw).toBeCloseTo(0.6, 10);
  });

  it("rounds half-way values with Math.round (×100 then round)", () => {
    // recency e^-1 ≈ .3679 → .4×.3679 = .14715; completeness .4 → .08; no peers.
    const a = exp("a", { created_at: daysAgo(365), preparation_timeline: null, resource_count: 0, has_evidence: false });
    const b = trustBreakdown(a, [a], NOW);
    expect(b.raw).toBeCloseTo(0.4 * Math.exp(-1) + 0.2 * 0.4, 10);
    expect(b.score).toBe(Math.round(100 * b.raw));
    expect(b.score).toBe(23);
  });
});
