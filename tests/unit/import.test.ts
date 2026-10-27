import { describe, expect, it } from "vitest";
import { mapRows, parseCsv, type Taxonomy } from "@/lib/import";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tax: Taxonomy = {
  companies: [{ id: id(1), name: "TCS" }, { id: id(2), name: "Amazon" }],
  roles: [{ id: id(10), label: "Systems Engineer", aliases: ["SE", "Ninja"] }, { id: id(11), label: "Software Engineer", aliases: ["SDE"] }],
  topics: [{ id: id(20), label: "Pseudocode", aliases: ["code tracing"] }, { id: id(21), label: "OOP", aliases: ["OOPS"] }],
  resources: [{ id: id(30), title: "TCS NQT pattern overview", url: "https://tcs.example/nqt" }],
  drives: [{ id: id(40), title: "TCS NQT 2026", company_id: id(1), role_id: id(10) }],
};
const HEADER = "email,company,role,drive,rounds_summary,preparation_timeline,topics,resources";
const SUMMARY = "NQT had pseudocode and an easy array problem, then OOP in the interview.";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, embedded commas/newlines, CRLF and BOM", () => {
    expect(parseCsv('﻿a,b\r\n"x, ""y""","line1\nline2"\r\n\r\n')).toEqual([["a", "b"], ['x, "y"', "line1\nline2"]]);
  });
  it("keeps empty trailing fields", () => {
    expect(parseCsv("a,,\n")).toEqual([["a", "", ""]]);
  });
});

describe("mapRows", () => {
  it("maps names and aliases to the submit_experience argument shape", () => {
    const csv = `${HEADER}\nSenior@Example.com,tcs,Ninja,TCS NQT 2026,"${SUMMARY}",Six weeks,code tracing; OOPS; OOP,https://tcs.example/nqt\n`;
    expect(mapRows(csv, tax)).toEqual({
      errors: [],
      rows: [{
        line: 2,
        email: "senior@example.com",
        args: {
          p_company_id: id(1),
          p_role_id: id(10),
          p_drive_id: id(40),
          p_rounds_summary: SUMMARY,
          p_timeline: "Six weeks",
          p_evidence_path: null,
          p_topic_ids: [id(20), id(21)],
          p_resource_ids: [id(30)],
        },
      }],
    });
  });

  it("drive is optional; blank timeline is null", () => {
    const { rows } = mapRows(`${HEADER}\na@b.co,Amazon,SDE,,"${SUMMARY}",,OOP,\n`, tax);
    expect(rows[0].args).toMatchObject({ p_drive_id: null, p_timeline: null, p_resource_ids: [] });
  });

  it("reports every problem per line and returns no row for it", () => {
    const csv = `${HEADER}\nnot-an-email,Wipro,Chef,Nope,short,,Underwater Basket Weaving,Unknown book\n`;
    const { rows, errors } = mapRows(csv, tax);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(2);
    expect(errors[0].errors).toEqual([
      'email: "not-an-email" is not an email address',
      'company: unknown "Wipro"',
      'role: unknown "Chef"',
      'drive: unknown "Nope"',
      'topics: unknown "Underwater Basket Weaving" (add it with a migration first)',
      'resources: unknown "Unknown book"',
      "rounds_summary: Describe the rounds in at least 30 characters",
      "topic_ids: Pick at least one topic",
    ]);
  });

  it("rejects a drive for a different company or role (mirrors the RPC)", () => {
    const { errors } = mapRows(`${HEADER}\na@b.co,Amazon,SDE,TCS NQT 2026,"${SUMMARY}",,OOP,\n`, tax);
    expect(errors[0].errors).toEqual(['drive: "TCS NQT 2026" is for a different company or role']);
  });

  it("requires the header columns", () => {
    expect(mapRows("email,company\n", tax).errors[0].errors[0]).toMatch(/Missing column\(s\): role, drive/);
  });
});
