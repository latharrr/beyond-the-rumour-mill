import { describe, expect, it } from "vitest";
import { type ExportPlan, exportFilename, mdEscape, planToMarkdown, weeksOf } from "@/lib/export";

const plan: ExportPlan = {
  created_at: "2026-10-27T10:00:00Z",
  drive: { title: "TCS NQT 2026 — Ninja & Digital", company: "TCS", role: "Systems Engineer", drive_date: "2026-11-20" },
  items: [
    { position: 2, week: 1, label: "OOP — asked in 2 of 3 verified experiences", done: false, resources: [] },
    { position: 1, week: 1, label: "Pseudocode — asked in 3 of 3 verified experiences", done: true, resources: [{ title: "TCS NQT pattern", url: "https://example.com/a (b)", type: "article" }] },
    { position: 3, week: 2, label: "DBMS", done: false, resources: [] },
  ],
  experiences: [{ id: "e1", author: "Placed senior · Batch of 2025" }],
};

describe("planToMarkdown", () => {
  const md = planToMarkdown(plan, "https://rumour.example");

  it("has the header and progress", () => {
    expect(md).toContain("# Prep plan: TCS NQT 2026 — Ninja & Digital");
    expect(md).toContain("TCS · Systems Engineer · Drive date: 2026-11-20");
    expect(md).toContain("Generated 2026-10-27 · Progress: 1 of 3 done");
  });

  it("groups by week in position order with task-list checkboxes and resources", () => {
    const w1 = md.indexOf("## Week 1");
    const w2 = md.indexOf("## Week 2");
    expect(w1).toBeGreaterThan(0);
    expect(w2).toBeGreaterThan(w1);
    expect(md.slice(w1, w2)).toBe(
      [
        "## Week 1",
        "",
        "- [x] Pseudocode — asked in 3 of 3 verified experiences",
        "  - [TCS NQT pattern](https://example.com/a%20%28b%29) (article)",
        "- [ ] OOP — asked in 2 of 3 verified experiences",
        "",
        "",
      ].join("\n"),
    );
  });

  it("cites the source experiences by URL, never by user", () => {
    expect(md).toContain("- Placed senior · Batch of 2025: https://rumour.example/experiences/e1");
    expect(md).not.toMatch(/user_id|evidence/);
  });

  it("explains a round-topics plan", () => {
    expect(planToMarkdown({ ...plan, experiences: [] }, "https://x")).toContain("built from the drive's listed round topics");
  });

  it("handles a missing drive date", () => {
    expect(planToMarkdown({ ...plan, drive: { ...plan.drive, drive_date: null } }, "https://x")).toContain("Drive date: not announced");
  });
});

describe("helpers", () => {
  it("mdEscape neutralises structure characters and newlines", () => {
    expect(mdEscape("a [link](x) *b* #c\nnext")).toBe("a \\[link\\](x) \\*b\\* \\#c next");
  });
  it("weeksOf sorts weeks and positions", () => {
    expect(weeksOf(plan.items).map(([w, items]) => [w, items.map((i) => i.position)])).toEqual([[1, [1, 2]], [2, [3]]]);
  });
  it("exportFilename is a safe slug", () => {
    expect(exportFilename("TCS NQT 2026 — Ninja & Digital")).toBe("prep-plan-tcs-nqt-2026-ninja-digital.md");
    expect(exportFilename("!!!")).toBe("prep-plan-plan.md");
  });
});
