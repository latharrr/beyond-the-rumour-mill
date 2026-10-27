import { describe, expect, it } from "vitest";
import { searchTopics } from "@/hooks/useTopicSearch";

const topics = [
  { id: "dp", label: "Dynamic Programming", category: "DSA", aliases: ["DP", "memoization"] },
  { id: "os", label: "Operating Systems", category: "CS", aliases: ["OS"] },
];

describe("searchTopics", () => {
  it("matches label and aliases case-insensitively", () => {
    expect(searchTopics(topics, "dp").map((t) => t.id)).toEqual(["dp"]);
    expect(searchTopics(topics, "MEMO").map((t) => t.id)).toEqual(["dp"]);
    expect(searchTopics(topics, "systems").map((t) => t.id)).toEqual(["os"]);
  });
  it("blank query returns everything", () => {
    expect(searchTopics(topics, "  ")).toHaveLength(2);
  });
});
