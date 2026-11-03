import { describe, expect, it } from "vitest";
import { knowledgeFiles, projectKnowledge } from "@/lib/ask/knowledge";

describe("/ask knowledge pack", () => {
  const files = knowledgeFiles();

  it("includes the syllabus map and the app source", () => {
    expect(files).toContain("SYLLABUS.md");
    expect(files).toContain("lib/experiences/rumour.ts");
    expect(files).toContain("proxy.ts");
  });

  it("never includes env files or generated types", () => {
    expect(files.some((f) => f.includes(".env"))).toBe(false);
    expect(files.some((f) => f.endsWith("database.types.ts"))).toBe(false);
  });

  it("is stable between calls, so the prompt cache can hit", () => {
    expect(projectKnowledge()).toBe(projectKnowledge());
    expect([...files].sort()).toEqual(files);
  });
});
