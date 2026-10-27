// Team decision: account deletion anonymises experiences, removes evidence,
// cascades personal data. Runs the real deleteAccount Server Action.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  anonClient,
  createAdmin,
  createUser,
  deleteUsers,
  driveFor,
  evidencePath,
  pdfBytes,
  serviceClient,
  submitExperience,
  type TestUser,
} from "./helpers";
import { session } from "./mocks/server";

vi.mock("@/lib/supabase/server", () => import("./mocks/server"));
vi.mock("next/navigation", () => import("./mocks/navigation"));
vi.mock("next/cache", () => import("./mocks/cache"));

const { deleteAccount } = await import("@/app/_actions/account");

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

const leftovers: TestUser[] = [];
afterAll(async () => {
  await deleteUsers(...leftovers);
});

beforeEach(() => {
  session.client = null;
});

describe("deleteAccount", () => {
  it("requires typing DELETE", async () => {
    const user = await createUser("keep");
    leftovers.push(user);
    session.client = user.client;
    const res = await deleteAccount(null, form({ confirm: "delete" }));
    expect(res.ok).toBe(false);
    expect(!res.ok && res.fieldErrors?.confirm?.[0]).toBe("Type DELETE to confirm");
    expect((await serviceClient().from("profiles").select("id").eq("id", user.id)).data).toHaveLength(1);
  });

  it("rejects when signed out", async () => {
    const res = await deleteAccount(null, form({ confirm: "DELETE" }));
    expect(res).toMatchObject({ ok: false, message: "Please sign in first." });
  });

  it("removes evidence + personal data and anonymises experiences", async () => {
    const svc = serviceClient();
    const admin = await createAdmin();
    leftovers.push(admin);
    const carol = await createUser("carol");

    const path = evidencePath(carol.id);
    expect((await carol.client.storage.from("evidence").upload(path, pdfBytes())).error).toBeNull();
    const { data: expId, error } = await submitExperience(carol, { p_evidence_path: path });
    expect(error).toBeNull();
    await admin.client.from("experiences")
      .update({ status: "verified", verified_by: admin.id, verified_at: new Date().toISOString() })
      .eq("id", expId);

    const driveId = (await driveFor("TCS")).id;
    const plan = await carol.client.rpc("save_plan", {
      p_drive_id: driveId,
      p_items: [{ topic_id: null, position: 1, week: 1, label: "x", resource_ids: [] }],
      p_experience_ids: [],
    });
    expect(plan.error).toBeNull();

    session.client = carol.client;
    await expect(deleteAccount(null, form({ confirm: "DELETE" }))).rejects.toThrow("NEXT_REDIRECT:/?account=deleted");

    expect((await svc.auth.admin.getUserById(carol.id)).data.user).toBeNull();
    expect((await svc.from("profiles").select("id").eq("id", carol.id)).data).toEqual([]);
    expect((await svc.from("prep_plans").select("id").eq("user_id", carol.id)).data).toEqual([]);
    expect((await svc.storage.from("evidence").list(carol.id)).data).toEqual([]);

    const exp = await svc.from("experiences").select("user_id, evidence_path, status").eq("id", expId).single();
    expect(exp.data).toEqual({ user_id: null, evidence_path: null, status: "verified" });

    const pub = await anonClient().from("public_experiences").select("id, author_role, grad_year, has_evidence").eq("id", expId);
    expect(pub.data).toEqual([{ id: expId, author_role: null, grad_year: null, has_evidence: false }]);

    // Cleanup: anonymised experience is no longer tied to any test user.
    await svc.from("experiences").delete().eq("id", expId);
  });

  it("an admin who verified experiences and created drives can delete their account", async () => {
    const svc = serviceClient();
    const admin = await createAdmin();
    const student = await createUser("dave");
    leftovers.push(student);

    const { data: expId } = await submitExperience(student);
    await admin.client.from("experiences")
      .update({ status: "rejected", rejection_reason: "test", verified_by: admin.id })
      .eq("id", expId);
    const drive = await driveFor("TCS");
    const created = await admin.client.from("drives")
      .insert({ company_id: drive.company_id, role_id: drive.role_id, title: "Temp drive", created_by: admin.id })
      .select("id")
      .single();
    expect(created.error).toBeNull();

    session.client = admin.client;
    await expect(deleteAccount(null, form({ confirm: "DELETE" }))).rejects.toThrow("NEXT_REDIRECT");

    expect((await svc.from("experiences").select("verified_by").eq("id", expId).single()).data).toEqual({ verified_by: null });
    expect((await svc.from("drives").select("created_by").eq("id", created.data!.id).single()).data).toEqual({ created_by: null });
    await svc.from("drives").delete().eq("id", created.data!.id);
  });
});
