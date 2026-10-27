import { describe, expect, it } from "vitest";
import {
  buildPlan,
  chunkIntoWeeks,
  DEFAULT_WEEKS,
  type EngineExperience,
  type EngineInput,
  type EngineRound,
  planWeeks,
  resourcesForTopic,
  selectExperiences,
  TOP_TOPICS,
  topTopics,
  weighRoundTopics,
  weighTopics,
} from "@/lib/plan-engine";

const NOW = new Date("2026-10-27T10:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const exp = (id: string, company_id: string, role_id: string, age = 0): EngineExperience => ({ id, company_id, role_id, created_at: daysAgo(age) });

describe("selectExperiences (fallback chain)", () => {
  const all = [exp("a", "tcs", "se"), exp("b", "tcs", "dse"), exp("c", "amz", "sde")];

  it("prefers company + role", () => {
    expect(selectExperiences(all, "tcs", "se")).toEqual({ scope: "role", experiences: [all[0]] });
  });
  it("falls back to company level", () => {
    expect(selectExperiences(all, "tcs", "qa")).toEqual({ scope: "company", experiences: [all[0], all[1]] });
  });
  it("falls back to round_topics when the company has none", () => {
    expect(selectExperiences(all, "infy", "se")).toEqual({ scope: "rounds", experiences: [] });
  });
});

describe("weighTopics", () => {
  it("weight = count × exp(−age/365) using the newest mention", () => {
    const exps = [exp("a", "c", "r", 365), exp("b", "c", "r", 0), exp("old", "c", "r", 730)];
    const links = [
      { experience_id: "a", topic_id: "dp" },
      { experience_id: "b", topic_id: "dp" },
      { experience_id: "old", topic_id: "os" },
      { experience_id: "not-in-scope", topic_id: "dp" },
    ];
    const w = Object.fromEntries(weighTopics(exps, links, NOW).map((t) => [t.topic_id, t]));
    expect(w.dp).toMatchObject({ count: 2, newest: daysAgo(0) });
    expect(w.dp.weight).toBeCloseTo(2);
    expect(w.os.count).toBe(1);
    expect(w.os.weight).toBeCloseTo(Math.exp(-2));
  });

  it("a recent single mention can outrank an old double", () => {
    const exps = [exp("a", "c", "r", 700), exp("b", "c", "r", 700), exp("n", "c", "r", 1)];
    const links = [
      { experience_id: "a", topic_id: "old" },
      { experience_id: "b", topic_id: "old" },
      { experience_id: "n", topic_id: "new" },
    ];
    const labels = new Map([["old", "Old"], ["new", "New"]]);
    expect(topTopics(weighTopics(exps, links, NOW), labels).map((t) => t.topic_id)).toEqual(["new", "old"]);
  });
});

describe("topTopics", () => {
  it(`keeps the top ${TOP_TOPICS}, ties broken by count then label`, () => {
    const weights = Array.from({ length: 20 }, (_, i) => ({ topic_id: `t${String(i).padStart(2, "0")}`, count: 1, newest: null, weight: i < 5 ? 5 : 1 }));
    const labels = new Map(weights.map((w) => [w.topic_id, w.topic_id]));
    const top = topTopics(weights, labels);
    expect(top).toHaveLength(12);
    expect(top.slice(0, 5).map((t) => t.topic_id)).toEqual(["t00", "t01", "t02", "t03", "t04"]);
    expect(top[5].topic_id).toBe("t05");
  });
});

describe("weighRoundTopics", () => {
  it("counts how many rounds list each topic", () => {
    const rounds: EngineRound[] = [
      { id: "r2", name: "Tech", position: 2, topic_ids: ["oop", "arrays"], resource_ids: [] },
      { id: "r1", name: "Test", position: 1, topic_ids: ["arrays"], resource_ids: [] },
    ];
    expect(weighRoundTopics(rounds)).toEqual([
      { topic_id: "arrays", count: 2, newest: null, weight: 2 },
      { topic_id: "oop", count: 1, newest: null, weight: 1 },
    ]);
  });
});

describe("resourcesForTopic", () => {
  it("is resources(topic_id) ∪ round_resources of rounds covering the topic, deduplicated", () => {
    const resources = [{ id: "r-dp", topic_id: "dp" }, { id: "r-os", topic_id: "os" }, { id: "r-general", topic_id: null }];
    const rounds: EngineRound[] = [
      { id: "1", name: "Coding", position: 1, topic_ids: ["dp"], resource_ids: ["r-general", "r-dp"] },
      { id: "2", name: "HR", position: 2, topic_ids: ["hr"], resource_ids: ["r-hr-only"] },
    ];
    expect(resourcesForTopic("dp", resources, rounds)).toEqual(["r-dp", "r-general"]);
    expect(resourcesForTopic("os", resources, rounds)).toEqual(["r-os"]);
    expect(resourcesForTopic("graphs", resources, rounds)).toEqual([]);
  });
});

describe("planWeeks", () => {
  it("is max(1, ceil(days / 7))", () => {
    expect(planWeeks("2026-10-27", NOW)).toBe(1); // today
    expect(planWeeks("2026-10-28", NOW)).toBe(1);
    expect(planWeeks("2026-11-03", NOW)).toBe(1); // exactly 7 days
    expect(planWeeks("2026-11-04", NOW)).toBe(2);
    expect(planWeeks("2026-12-27", NOW)).toBe(9);
  });
  it(`null or past drive date → ${DEFAULT_WEEKS}`, () => {
    expect(planWeeks(null, NOW)).toBe(4);
    expect(planWeeks("2026-10-26", NOW)).toBe(4);
    expect(planWeeks("2024-01-01", NOW)).toBe(4);
  });
});

describe("chunkIntoWeeks", () => {
  it("fills weeks in contiguous chunks, highest weight first", () => {
    expect(chunkIntoWeeks(12, 4)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
    expect(chunkIntoWeeks(5, 2)).toEqual([1, 1, 1, 2, 2]);
  });
  it("one item per week when there are more weeks than items", () => {
    expect(chunkIntoWeeks(3, 9)).toEqual([1, 2, 3]);
  });
  it("everything in week 1 for a one-week plan", () => {
    expect(chunkIntoWeeks(4, 1)).toEqual([1, 1, 1, 1]);
  });
  it("handles zero items", () => {
    expect(chunkIntoWeeks(0, 4)).toEqual([]);
  });
});

describe("buildPlan", () => {
  const topics = ["arrays", "oop", "dbms", "dp"].map((id) => ({ id, label: id.toUpperCase() }));
  const rounds: EngineRound[] = [{ id: "r1", name: "Test", position: 1, topic_ids: ["arrays", "oop"], resource_ids: ["rr"] }];
  const base: EngineInput = {
    drive: { company_id: "tcs", role_id: "se", drive_date: "2026-11-10" },
    rounds,
    experiences: [exp("e1", "tcs", "se", 10), exp("e2", "tcs", "se", 20), exp("x", "amz", "sde")],
    links: [
      { experience_id: "e1", topic_id: "dp" },
      { experience_id: "e2", topic_id: "dp" },
      { experience_id: "e1", topic_id: "dbms" },
      { experience_id: "x", topic_id: "oop" },
    ],
    topics,
    resources: [{ id: "res-dp", topic_id: "dp" }],
    now: NOW,
  };

  it("builds a role-scoped plan in save_plan's item shape", () => {
    const plan = buildPlan(base);
    expect(plan).toEqual({
      scope: "role",
      weeks: 2,
      experience_ids: ["e1", "e2"],
      items: [
        { topic_id: "dp", position: 1, week: 1, label: "DP — asked in 2 of 2 verified experiences", resource_ids: ["res-dp"] },
        { topic_id: "dbms", position: 2, week: 2, label: "DBMS — asked in 1 of 2 verified experiences", resource_ids: [] },
      ],
    });
  });

  it("falls back to round_topics with no experiences and cites none", () => {
    const plan = buildPlan({ ...base, experiences: [], drive: { ...base.drive, drive_date: null } });
    expect(plan.scope).toBe("rounds");
    expect(plan.weeks).toBe(4);
    expect(plan.experience_ids).toEqual([]);
    expect(plan.items.map((i) => [i.topic_id, i.label, i.resource_ids])).toEqual([
      ["arrays", "ARRAYS — listed in this drive's rounds", ["rr"]],
      ["oop", "OOP — listed in this drive's rounds", ["rr"]],
    ]);
  });

  it("treats experiences with no topics like no experiences", () => {
    const plan = buildPlan({ ...base, links: [] });
    expect(plan.scope).toBe("rounds");
    expect(plan.experience_ids).toEqual([]);
  });

  it("positions are 1..n and unique", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ experience_id: "e1", topic_id: `t${i}` }));
    const plan = buildPlan({ ...base, links: many, topics: many.map((l) => ({ id: l.topic_id, label: l.topic_id })) });
    expect(plan.items.map((i) => i.position)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });
});
