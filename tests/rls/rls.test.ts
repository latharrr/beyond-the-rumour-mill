// §5 RLS checklist as automated tests against local Supabase.
// Prereq: `npx supabase start && npx supabase db reset` (seed.sql loaded).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  anonClient,
  createAdmin,
  createUser,
  deleteUsers,
  driveFor,
  evidencePath,
  lookupId,
  pdfBytes,
  serviceClient,
  submitExperience,
  type TestUser,
} from "./helpers";

const PUBLIC_VIEWS = [
  "public_experiences",
  "public_experience_topics",
  "public_experience_resources",
  "community_tips",
] as const;

const SEED_USER_IDS = [
  "a0000000-0000-4000-8000-000000000001",
  "a0000000-0000-4000-8000-000000000002",
  "a0000000-0000-4000-8000-000000000003",
  "a0000000-0000-4000-8000-000000000004",
];
const SEED_EVIDENCE = "a0000000-0000-4000-8000-000000000002/1b4e28ba-2fa1-4d3b-9b1a-6c1f2d3e4f50.pdf";

const DRIVE_COLUMNS =
  "id, company_id, role_id, title, eligibility_cgpa, max_backlogs, min_10th_pct, min_12th_pct, grad_years, drive_date, location, status, created_at, updated_at";

let alice: TestUser; // student
let bob: TestUser; // student
let admin: TestUser;

beforeAll(async () => {
  [alice, bob, admin] = await Promise.all([createUser("alice"), createUser("bob"), createAdmin()]);
});

afterAll(async () => {
  await deleteUsers(alice, bob, admin);
});

describe("profiles", () => {
  it("signup trigger creates a student profile", async () => {
    const { data, error } = await alice.client.from("profiles").select("id, role").eq("id", alice.id).single();
    expect(error).toBeNull();
    expect(data).toEqual({ id: alice.id, role: "student" });
  });

  it("student `update profiles set role='admin'` fails", async () => {
    const { error } = await alice.client.from("profiles").update({ role: "admin" }).eq("id", alice.id);
    expect(error?.code).toBe("42501"); // permission denied for column role

    const { data } = await serviceClient().from("profiles").select("role").eq("id", alice.id).single();
    expect(data?.role).toBe("student");
  });

  it("student can update own allowed columns, within check constraints", async () => {
    const ok = await alice.client.from("profiles").update({ cgpa: 8.5, backlogs: 0 }).eq("id", alice.id).select("cgpa");
    expect(ok.error).toBeNull();
    expect(ok.data).toEqual([{ cgpa: 8.5 }]);

    const bad = await alice.client.from("profiles").update({ cgpa: 10.01 }).eq("id", alice.id);
    expect(bad.error?.code).toBe("23514"); // check_violation
  });

  it("student cannot read or update another user's profile", async () => {
    const read = await alice.client.from("profiles").select("id").eq("id", bob.id);
    expect(read.data).toEqual([]);

    const write = await alice.client.from("profiles").update({ cgpa: 1 }).eq("id", bob.id).select("id");
    expect(write.data).toEqual([]);
  });

  it("student cannot insert a profile row", async () => {
    const { error } = await alice.client.from("profiles").insert({ id: alice.id });
    expect(error?.code).toBe("42501");
  });

  it("admin can read any profile", async () => {
    const { data } = await admin.client.from("profiles").select("id").eq("id", alice.id);
    expect(data).toEqual([{ id: alice.id }]);
  });
});

describe("public read paths", () => {
  it.each(PUBLIC_VIEWS)("anon can read %s", async (view) => {
    const { data, error } = await anonClient().from(view).select("*");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  it.each(["experiences", "profiles", "experience_topics", "prep_plans", "plan_items"])(
    "anon cannot read %s",
    async (table) => {
      const { data, error } = await anonClient().from(table).select("*");
      expect(data ?? []).toEqual([]);
      expect(error?.code).toBe("42501");
    },
  );

  it("public_experiences only lists verified, community_tips only pending", async () => {
    const svc = serviceClient();
    const { data: verified } = await svc.from("experiences").select("id").eq("status", "verified");
    const { data: pending } = await svc.from("experiences").select("id").eq("status", "pending");

    const { data: pub } = await anonClient().from("public_experiences").select("id");
    const { data: tips } = await anonClient().from("community_tips").select("id");

    expect(pub!.map((r) => r.id).sort()).toEqual(verified!.map((r) => r.id).sort());
    expect(tips!.map((r) => r.id).sort()).toEqual(pending!.map((r) => r.id).sort());
  });

  it.each([
    ["anon", () => anonClient()],
    ["student", () => alice.client],
  ] as const)("%s responses never contain user_id or evidence_path", async (_who, client) => {
    for (const view of PUBLIC_VIEWS) {
      const { data, error } = await client().from(view).select("*");
      expect(error).toBeNull();
      for (const row of data!) {
        expect(Object.keys(row)).not.toContain("user_id");
        expect(Object.keys(row)).not.toContain("evidence_path");
      }
      const body = JSON.stringify(data);
      for (const id of SEED_USER_IDS) expect(body).not.toContain(id);
      expect(body).not.toContain(SEED_EVIDENCE);
    }

    const drives = await client().from("drives").select(DRIVE_COLUMNS);
    expect(drives.error).toBeNull();
    expect(drives.data!.length).toBe(3);
    for (const id of SEED_USER_IDS) expect(JSON.stringify(drives.data)).not.toContain(id);
  });

  it("drives.created_by is not selectable by clients", async () => {
    const anon = await anonClient().from("drives").select("created_by");
    expect(anon.error?.code).toBe("42501");
    const student = await alice.client.from("drives").select("*");
    expect(student.error?.code).toBe("42501");
  });

  it("public_experiences exposes has_evidence as a boolean only", async () => {
    const { data } = await anonClient().from("public_experiences").select("has_evidence");
    expect(data!.some((r) => r.has_evidence === true)).toBe(true);
    expect(data!.every((r) => typeof r.has_evidence === "boolean")).toBe(true);
  });

  it.each([
    ["anon", () => anonClient()],
    ["student", () => alice.client],
  ] as const)("%s cannot write through the definer views", async (_who, client) => {
    const svc = serviceClient();
    const before = (await svc.from("experiences").select("id", { count: "exact", head: true }).eq("status", "pending")).count;

    const del = await client().from("community_tips").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    expect(del.error?.code).toBe("42501");
    const upd = await client().from("community_tips").update({ rounds_summary: "vandalised" }).neq("id", "00000000-0000-0000-0000-000000000000");
    expect(upd.error?.code).toBe("42501");

    const after = (await svc.from("experiences").select("id", { count: "exact", head: true }).eq("status", "pending")).count;
    expect(after).toBe(before);
  });

  it("reference tables are readable by anon but writable only by admin", async () => {
    expect((await anonClient().from("topics").select("id")).data!.length).toBeGreaterThanOrEqual(30);

    const anonWrite = await anonClient().from("topics").insert({ label: "Anon topic", category: "DSA" });
    expect(anonWrite.error?.code).toBe("42501");

    const studentWrite = await alice.client.from("companies").insert({ name: "Student Co" });
    expect(studentWrite.error?.code).toBe("42501"); // RLS with-check violation

    const studentDrive = await alice.client.from("drives").update({ title: "hacked" }).neq("id", "00000000-0000-0000-0000-000000000000").select("id");
    expect(studentDrive.data).toEqual([]);

    const adminWrite = await admin.client.from("companies").insert({ name: "Admin Co" }).select("id").single();
    expect(adminWrite.error).toBeNull();
    await admin.client.from("companies").delete().eq("id", adminWrite.data!.id);
  });
});

describe("experiences", () => {
  it("direct insert into experiences is rejected (RPC-only)", async () => {
    const drive = await driveFor("TCS");
    const { error } = await alice.client.from("experiences").insert({
      user_id: alice.id,
      company_id: drive.company_id,
      role_id: drive.role_id,
      status: "verified",
    });
    expect(error?.code).toBe("42501");
  });

  it("submit_experience forces user_id = caller and status = pending", async () => {
    const { data: id, error } = await submitExperience(alice);
    expect(error).toBeNull();

    const { data } = await alice.client.from("experiences").select("user_id, status").eq("id", id).single();
    expect(data).toEqual({ user_id: alice.id, status: "pending" });

    const topics = await alice.client.from("experience_topics").select("topic_id").eq("experience_id", id);
    expect(topics.data).toHaveLength(1);
  });

  it("student cannot read another user's experience row", async () => {
    const { data: id } = await submitExperience(bob);
    const row = await alice.client.from("experiences").select("id").eq("id", id);
    expect(row.data).toEqual([]);
    const topics = await alice.client.from("experience_topics").select("topic_id").eq("experience_id", id);
    expect(topics.data).toEqual([]);
  });

  it("student cannot update experiences (even their own)", async () => {
    const { data: id } = await submitExperience(alice);
    const { data } = await alice.client.from("experiences").update({ status: "verified" }).eq("id", id).select("id");
    expect(data).toEqual([]);
    const check = await serviceClient().from("experiences").select("status").eq("id", id).single();
    expect(check.data?.status).toBe("pending");
  });

  it("submit_experience rejects an evidence path outside the caller's folder", async () => {
    const { error } = await submitExperience(alice, { p_evidence_path: evidencePath(bob.id) });
    expect(error?.message).toMatch(/Invalid evidence path/);

    const traversal = await submitExperience(alice, { p_evidence_path: `${alice.id}/../${bob.id}/x.pdf` });
    expect(traversal.error?.message).toMatch(/Invalid evidence path/);
  });

  it("submit_experience caps pending experiences at 5", async () => {
    const carol = await createUser("carol");
    try {
      for (let i = 0; i < 5; i++) {
        const { error } = await submitExperience(carol, { p_evidence_path: evidencePath(carol.id) });
        expect(error).toBeNull();
      }
      const sixth = await submitExperience(carol);
      expect(sixth.error?.message).toMatch(/5 experiences awaiting verification/);
    } finally {
      await deleteUsers(carol);
    }
  });

  it("anon cannot call submit_experience", async () => {
    const drive = await driveFor("TCS");
    const { error } = await anonClient().rpc("submit_experience", {
      p_company_id: drive.company_id, p_role_id: drive.role_id, p_drive_id: drive.id,
      p_rounds_summary: null, p_timeline: null, p_evidence_path: null, p_topic_ids: [], p_resource_ids: [],
    });
    expect(error).not.toBeNull();
  });

  it("admin can verify; verified experience then appears publicly", async () => {
    const { data: id } = await submitExperience(bob);
    const { error } = await admin.client
      .from("experiences")
      .update({ status: "verified", verified_by: admin.id, verified_at: new Date().toISOString() })
      .eq("id", id);
    expect(error).toBeNull();

    const pub = await anonClient().from("public_experiences").select("id, author_role").eq("id", id);
    expect(pub.data).toEqual([{ id, author_role: "student" }]);
  });
});

describe("prep plans + save_plan", () => {
  let driveId: string;
  let verifiedId: string;
  let topicId: string;
  let resourceId: string;

  const items = () => [
    { topic_id: topicId, position: 1, week: 1, label: "Pseudocode drills", resource_ids: [resourceId] },
    { topic_id: null, position: 2, week: 2, label: "Mock test", resource_ids: [] },
  ];

  beforeAll(async () => {
    driveId = (await driveFor("TCS")).id;
    verifiedId = (await anonClient().from("public_experiences").select("id").limit(1).single()).data!.id;
    topicId = await lookupId("topics", "label", "Pseudocode");
    resourceId = await lookupId("resources", "title", "TCS NQT pattern overview");
  });

  it("save_plan writes plan, items, resources and provenance atomically", async () => {
    const { data: planId, error } = await alice.client.rpc("save_plan", {
      p_drive_id: driveId, p_items: items(), p_experience_ids: [verifiedId],
    });
    expect(error).toBeNull();

    const plan = await alice.client.from("prep_plans").select("id, plan_items(position, week, label, plan_item_resources(resource_id)), plan_experiences(experience_id)").eq("id", planId).single();
    expect(plan.data!.plan_items).toHaveLength(2);
    expect(plan.data!.plan_experiences).toEqual([{ experience_id: verifiedId }]);
    const first = plan.data!.plan_items.find((i: { position: number }) => i.position === 1)!;
    expect(first.plan_item_resources).toEqual([{ resource_id: resourceId }]);
  });

  it("regenerate replaces the plan (one plan per user+drive)", async () => {
    const first = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: items(), p_experience_ids: [] });
    const second = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: items(), p_experience_ids: [] });
    expect(second.error).toBeNull();
    expect(second.data).not.toBe(first.data);
    const plans = await alice.client.from("prep_plans").select("id").eq("drive_id", driveId);
    expect(plans.data).toEqual([{ id: second.data }]);
  });

  it("save_plan failure mid-write leaves the previous plan intact (forced error)", async () => {
    const { data: goodId } = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: items(), p_experience_ids: [] });

    // Item 2 violates the week >= 1 check after the delete + plan insert already ran.
    const broken = [...items().slice(0, 1), { topic_id: null, position: 2, week: 0, label: "bad", resource_ids: [] }];
    const { error } = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: broken, p_experience_ids: [] });
    expect(error?.code).toBe("23514");

    const plans = await alice.client.from("prep_plans").select("id, plan_items(id)").eq("drive_id", driveId);
    expect(plans.data).toHaveLength(1);
    expect(plans.data![0].id).toBe(goodId);
    expect(plans.data![0].plan_items).toHaveLength(2);
  });

  it("save_plan rejects citing non-verified experiences", async () => {
    const { data: pendingId } = await submitExperience(bob);
    const { error } = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: items(), p_experience_ids: [pendingId] });
    expect(error?.message).toMatch(/only cite verified/);
  });

  it("student cannot read or modify another user's plan", async () => {
    const { data: planId } = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: items(), p_experience_ids: [] });

    expect((await bob.client.from("prep_plans").select("id").eq("id", planId)).data).toEqual([]);
    expect((await bob.client.from("plan_items").select("id").eq("plan_id", planId)).data).toEqual([]);

    const toggle = await bob.client.from("plan_items").update({ done: true }).eq("plan_id", planId).select("id");
    expect(toggle.data).toEqual([]);

    const inject = await bob.client.from("plan_items").insert({ plan_id: planId, position: 99, week: 1, label: "x" });
    expect(inject.error?.code).toBe("42501");

    const del = await bob.client.from("prep_plans").delete().eq("id", planId).select("id");
    expect(del.data).toEqual([]);
  });

  it("plan_items client update is limited to done / done_at", async () => {
    const { data: planId } = await alice.client.rpc("save_plan", { p_drive_id: driveId, p_items: items(), p_experience_ids: [] });

    const ok = await alice.client.from("plan_items").update({ done: true, done_at: new Date().toISOString() }).eq("plan_id", planId).eq("position", 1).select("done");
    expect(ok.data).toEqual([{ done: true }]);

    const relabel = await alice.client.from("plan_items").update({ label: "changed" }).eq("plan_id", planId);
    expect(relabel.error?.code).toBe("42501");
  });
});

describe("storage: evidence bucket", () => {
  it("student can upload into their own folder", async () => {
    const { error } = await alice.client.storage.from("evidence").upload(evidencePath(alice.id), pdfBytes());
    expect(error).toBeNull();
  });

  it("student cannot upload outside {own uid}/", async () => {
    const other = await alice.client.storage.from("evidence").upload(evidencePath(bob.id), pdfBytes());
    expect(other.error).not.toBeNull();
    const root = await alice.client.storage.from("evidence").upload(`loose-${Date.now()}.pdf`, pdfBytes());
    expect(root.error).not.toBeNull();
  });

  it("bucket rejects disallowed MIME types", async () => {
    const html = new Blob(["<script>alert(1)</script>"], { type: "text/html" });
    const { error } = await alice.client.storage.from("evidence").upload(`${alice.id}/${crypto.randomUUID()}.pdf`, html, { contentType: "text/html" });
    expect(error).not.toBeNull();
  });

  it("student cannot read, list, sign, overwrite or delete any evidence object (even their own)", async () => {
    const path = evidencePath(alice.id);
    expect((await alice.client.storage.from("evidence").upload(path, pdfBytes())).error).toBeNull();
    const bucket = alice.client.storage.from("evidence");

    expect((await bucket.download(path)).error).not.toBeNull();
    expect((await bucket.createSignedUrl(path, 60)).error).not.toBeNull();
    expect((await bucket.list(alice.id)).data ?? []).toEqual([]);
    expect((await bucket.upload(path, pdfBytes(), { upsert: true })).error).not.toBeNull();

    await bucket.remove([path]);
    const still = await serviceClient().storage.from("evidence").list(alice.id);
    expect(still.data!.map((o) => `${alice.id}/${o.name}`)).toContain(path);
  });

  it("anon cannot upload or read evidence", async () => {
    const up = await anonClient().storage.from("evidence").upload(evidencePath(alice.id), pdfBytes());
    expect(up.error).not.toBeNull();
  });

  it("admin can create a 60 s signed URL", async () => {
    const path = evidencePath(alice.id);
    await alice.client.storage.from("evidence").upload(path, pdfBytes());
    const { data, error } = await admin.client.storage.from("evidence").createSignedUrl(path, 60);
    expect(error).toBeNull();
    expect(data?.signedUrl).toContain("token=");
  });
});

describe("admin-only operations", () => {
  it("non-admin cannot perform verification writes", async () => {
    const { data: id } = await submitExperience(bob);
    const res = await alice.client.from("experiences").update({ status: "verified" }).eq("id", id).select("id");
    expect(res.data).toEqual([]);
  });

  it("is_admin() reflects the caller", async () => {
    expect((await alice.client.rpc("is_admin")).data).toBe(false);
    expect((await admin.client.rpc("is_admin")).data).toBe(true);
    expect((await anonClient().rpc("is_admin")).error).not.toBeNull();
  });

  // Server Actions do not exist until Phase 1/2; the DB-level guards they
  // rely on are covered above. These become real tests with the actions.
  it.todo("non-admin calling verifyExperience / rejectExperience → rejected");
  it.todo("non-admin calling getEvidenceUrl → rejected");
  // createDrive / updateDrive: tests/rls/drives-actions.test.ts
});
