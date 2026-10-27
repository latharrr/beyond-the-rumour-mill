// generatePlan / toggleChecklistItem / GET /api/plans/[id]/export against real
// local Supabase (Next runtime mocked).
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, deleteUsers, driveFor, serviceClient, type TestUser } from "./helpers";
import { RedirectError } from "./mocks/navigation";
import { session } from "./mocks/server";

vi.mock("@/lib/supabase/server", () => import("./mocks/server"));
vi.mock("next/navigation", () => import("./mocks/navigation"));
vi.mock("next/cache", () => import("./mocks/cache"));

const { generatePlan, toggleChecklistItem } = await import("@/app/_actions/plans");
const { GET } = await import("@/app/api/plans/[id]/export/route");

let alice: TestUser;
let bob: TestUser;
let tcs: { id: string; company_id: string; role_id: string };

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};

/** Runs generatePlan and returns the plan id from its redirect. */
async function generate(driveId: string) {
  try {
    await generatePlan(null, form({ drive_id: driveId }));
  } catch (e) {
    if (e instanceof RedirectError) return e.url.replace("/dashboard/plans/", "");
    throw e;
  }
  throw new Error("generatePlan did not redirect");
}

const exportPlan = (id: string) =>
  GET(new NextRequest(`http://localhost:3000/api/plans/${id}/export`), { params: Promise.resolve({ id }) });

beforeAll(async () => {
  [alice, bob] = await Promise.all([createUser("plan-alice"), createUser("plan-bob")]);
  tcs = await driveFor("TCS");
});

afterAll(async () => {
  await deleteUsers(alice, bob);
});

beforeEach(() => {
  session.client = null;
});

describe("generatePlan", () => {
  it("rejects when signed out", async () => {
    expect(await generatePlan(null, form({ drive_id: tcs.id }))).toEqual({ ok: false, message: "Please sign in first." });
  });

  it("validates the drive id", async () => {
    session.client = alice.client;
    const res = await generatePlan(null, form({ drive_id: "nope" }));
    expect(!res.ok && res.fieldErrors?.drive_id).toBeTruthy();
    expect(await generatePlan(null, form({ drive_id: randomUUID() }))).toEqual({ ok: false, message: "That drive doesn't exist any more." });
  });

  it("builds a plan from verified TCS experiences and redirects to it", async () => {
    session.client = alice.client;
    const id = await generate(tcs.id);
    const svc = serviceClient();
    const plan = await svc.from("prep_plans").select("user_id, drive_id").eq("id", id).single();
    expect(plan.data).toEqual({ user_id: alice.id, drive_id: tcs.id });

    const items = (await svc.from("plan_items").select("position, week, label, done").eq("plan_id", id).order("position")).data!;
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(12);
    expect(items.map((i) => i.position)).toEqual(items.map((_, i) => i + 1));
    expect(items.every((i) => i.week >= 1 && !i.done)).toBe(true);
    expect(items[0].label).toMatch(/asked in \d+ of \d+ verified experience/);

    const cited = (await svc.from("plan_experiences").select("experience_id").eq("plan_id", id)).data!.map((r) => r.experience_id);
    const verified = (await svc.from("experiences").select("id, status").in("id", cited)).data!;
    expect(cited.length).toBeGreaterThan(0);
    expect(verified.every((e) => e.status === "verified")).toBe(true);
  });

  it("regenerating replaces the plan (one plan per user + drive)", async () => {
    session.client = alice.client;
    const first = await generate(tcs.id);
    const second = await generate(tcs.id);
    expect(second).not.toBe(first);
    const { count } = await serviceClient().from("prep_plans").select("id", { count: "exact", head: true }).eq("user_id", alice.id).eq("drive_id", tcs.id);
    expect(count).toBe(1);
  });
});

describe("toggleChecklistItem", () => {
  let itemId: string;
  beforeAll(async () => {
    session.client = alice.client;
    const planId = await generate(tcs.id);
    itemId = (await serviceClient().from("plan_items").select("id").eq("plan_id", planId).eq("position", 1).single()).data!.id;
  });

  it("owner toggles done and done_at on one row", async () => {
    session.client = alice.client;
    expect(await toggleChecklistItem({ id: itemId, done: true })).toEqual({ ok: true, data: { id: itemId, done: true }, message: undefined });
    const row = (await serviceClient().from("plan_items").select("done, done_at").eq("id", itemId).single()).data!;
    expect(row.done).toBe(true);
    expect(row.done_at).not.toBeNull();

    await toggleChecklistItem({ id: itemId, done: false });
    expect((await serviceClient().from("plan_items").select("done, done_at").eq("id", itemId).single()).data).toEqual({ done: false, done_at: null });
  });

  it("another user cannot toggle it", async () => {
    session.client = bob.client;
    expect(await toggleChecklistItem({ id: itemId, done: true })).toEqual({ ok: false, message: "That checklist item doesn't exist." });
    expect((await serviceClient().from("plan_items").select("done").eq("id", itemId).single()).data?.done).toBe(false);
  });

  it("signed out and malformed input are rejected", async () => {
    expect(await toggleChecklistItem({ id: itemId, done: true })).toEqual({ ok: false, message: "Please sign in first." });
    session.client = alice.client;
    expect((await toggleChecklistItem({ id: "x", done: true })).ok).toBe(false);
  });
});

describe("GET /api/plans/[id]/export", () => {
  let planId: string;
  beforeAll(async () => {
    session.client = alice.client;
    planId = await generate(tcs.id);
  });

  it("owner downloads the plan as Markdown", async () => {
    session.client = alice.client;
    const res = await exportPlan(planId);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="prep-plan-tcs-.*\.md"$/);
    const md = await res.text();
    expect(md).toMatch(/^# Prep plan: TCS/);
    expect(md).toContain("## Week 1");
    expect(md).toMatch(/- \[ \] /);
    expect(md).toContain("http://localhost:3000/experiences/");
    expect(md).not.toMatch(/user_id|evidence_path/);
  });

  it("another user gets 404, not the plan", async () => {
    session.client = bob.client;
    expect((await exportPlan(planId)).status).toBe(404);
  });

  it("anon gets 401; garbage ids get 404", async () => {
    expect((await exportPlan(planId)).status).toBe(401);
    session.client = alice.client;
    expect((await exportPlan("not-a-uuid")).status).toBe(404);
  });
});
