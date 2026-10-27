import { describe, expect, it } from "vitest";
import { topicFrequency } from "@/lib/topic-frequency";

const topics = [
  { id: "dp", label: "Dynamic Programming", category: "DSA" },
  { id: "os", label: "Operating Systems", category: "CS" },
  { id: "arr", label: "Arrays", category: "DSA" },
];

describe("topicFrequency", () => {
  it("counts verified experiences per topic, sorted by count then label", () => {
    const links = [
      { experience_id: "e1", topic_id: "dp" },
      { experience_id: "e2", topic_id: "dp" },
      { experience_id: "e2", topic_id: "os" },
      { experience_id: "e3", topic_id: "arr" },
      { experience_id: "other", topic_id: "os" }, // not in scope (e.g. other company)
    ];
    expect(topicFrequency(["e1", "e2", "e3"], links, topics)).toEqual([
      { id: "dp", label: "Dynamic Programming", category: "DSA", count: 2, share: 2 / 3 },
      { id: "arr", label: "Arrays", category: "DSA", count: 1, share: 1 / 3 },
      { id: "os", label: "Operating Systems", category: "CS", count: 1, share: 1 / 3 },
    ]);
  });

  it("empty scope → empty table", () => {
    expect(topicFrequency([], [{ experience_id: "e1", topic_id: "dp" }], topics)).toEqual([]);
  });
});
