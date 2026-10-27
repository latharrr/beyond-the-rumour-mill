// Experience / verification / evidence / rumour Server Actions against real
// local Supabase (Next runtime mocked).
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { anonClient, createAdmin, createUser, deleteUsers, driveFor, lookupId, serviceClient, type TestUser } from "./helpers";
import { session } from "./mocks/server";

vi.mock("@/lib/supabase/server", () => import("./mocks/server"));
vi.mock("next/navigation", () => import("./mocks/navigation"));
vi.mock("next/cache", () => import("./mocks/cache"));

const { submitExperience, verifyExperience, rejectExperience, getEvidenceUrl } = await import("@/app/_actions/experiences");
const { checkClaim } = await import("@/app/_actions/rumour");

const NOT_AUTHORISED = "You are not allowed to do that.";
const PDF = () => new File([new TextEncoder().encode("%PDF-1.4\n%test\n")], "offer.pdf", { type: "application/pdf" });
const FAKE_PDF = () => new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], "offer.pdf", { type: "application/pdf" });

let student: TestUser;
let other: TestUser;
let admin: TestUser;
let tcs: { id: string; company_id: string; role_id: string };
let amazon: { id: string; company_id: string; role_id: string };
let arrays: string;

function form(fields: Record<string, string | string[] | File>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v instanceof File) fd.append(k, v);
    else for (const x of [v].flat()) fd.append(k, x);
  }
  return fd;
}

const submission = (over: Record<string, string | string[] | File> = {}) => ({
  company_id: tcs.company_id,
  role_id: tcs.role_id,
  drive_id: tcs.id,
  rounds_summary: "Online test with pseudocode and aptitude, then a technical interview on OOP.",
  preparation_timeline: "Six weeks",
  topic_ids: [arrays],
  ...over,
});

const evidenceObjects = async (uid: string) => (await serviceClient().storage.from("evidence").list(uid)).data ?? [];

beforeAll(async () => {
  [student, other, admin] = await Promise.all([createUser("exp-student"), createUser("exp-other"), createAdmin()]);
  [tcs, amazon] = await Promise.all([driveFor("TCS"), driveFor("Amazon")]);
  arrays = await lookupId("topics", "label", "Arrays");
});

afterAll(async () => {
  for (const u of [student, other]) {
    const objs = await evidenceObjects(u.id);
    if (objs.length) await serviceClient().storage.from("evidence").remove(objs.map((o) => `${u.id}/${o.name}`));
  }
  await deleteUsers(student, other, admin);
});

beforeEach(() => {
  session.client = null;
});

describe("submitExperience", () => {
  it("rejects when signed out", async () => {
    expect(await submitExperience(null, form(submission()))).toMatchObject({ ok: false, message: "Please sign in first." });
  });

  it("uploads evidence to {uid}/{uuid}.pdf and creates a pending experience", async () => {
    session.client = student.client;
    const res = await submitExperience(null, form(submission({ evidence: PDF() })));
    expect(res.ok).toBe(true);
    const id = res.ok ? res.data.id : "";

    const row = await serviceClient().from("experiences").select("user_id, status, evidence_path").eq("id", id).single();
    expect(row.data).toMatchObject({ user_id: student.id, status: "pending" });
    expect(row.data!.evidence_path).toMatch(new RegExp(`^${student.id}/[0-9a-f-]{36}\\.pdf$`));
    expect((await evidenceObjects(student.id)).map((o) => `${student.id}/${o.name}`)).toContain(row.data!.evidence_path);
  });

  it("returns field errors and uploads nothing for invalid input", async () => {
    session.client = other.client;
    const res = await submitExperience(null, form(submission({ rounds_summary: "short", topic_ids: [] })));
    expect(!res.ok && Object.keys(res.fieldErrors ?? {}).sort()).toEqual(["rounds_summary", "topic_ids"]);
    expect(await evidenceObjects(other.id)).toEqual([]);
  });

  it("rejects a file whose bytes don't match its MIME type", async () => {
    session.client = other.client;
    const res = await submitExperience(null, form(submission({ evidence: FAKE_PDF() })));
    expect(!res.ok && res.fieldErrors?.evidence?.[0]).toMatch(/contents don't match/);
    expect(await evidenceObjects(other.id)).toEqual([]);
  });

  it("drive/company mismatch fails AND the uploaded evidence is cleaned up", async () => {
    session.client = other.client;
    const res = await submitExperience(null, form(submission({ drive_id: amazon.id, evidence: PDF() })));
    expect(!res.ok && res.fieldErrors?.drive_id?.[0]).toBe("That drive is for a different company or role.");
    expect(await evidenceObjects(other.id)).toEqual([]);
  });

  it("submit_experience RPC rejects a mismatched drive directly too", async () => {
    const { error } = await other.client.rpc("submit_experience", {
      p_company_id: tcs.company_id, p_role_id: tcs.role_id, p_drive_id: amazon.id,
      p_rounds_summary: "x", p_timeline: null as unknown as string, p_evidence_path: null as unknown as string,
      p_topic_ids: [], p_resource_ids: [],
    });
    expect(error?.message).toMatch(/does not match/);
  });

  it("a drive-less submission is allowed", async () => {
    session.client = other.client;
    const res = await submitExperience(null, form(submission({ drive_id: "", company_id: amazon.company_id, role_id: amazon.role_id })));
    expect(res.ok).toBe(true);
  });

  it("pending cap: 6th submission fails and its evidence is cleaned up", async () => {
    const capped = await createUser("exp-capped");
    try {
      session.client = capped.client;
      for (let i = 0; i < 5; i++) expect((await submitExperience(null, form(submission()))).ok).toBe(true);
      const res = await submitExperience(null, form(submission({ evidence: PDF() })));
      expect(res).toMatchObject({ ok: false, message: expect.stringContaining("5 experiences awaiting verification") });
      expect(await evidenceObjects(capped.id)).toEqual([]);
    } finally {
      await deleteUsers(capped);
    }
  });

  it("bucket limit is 4 MB (team decision)", async () => {
    const { data } = await serviceClient().storage.getBucket("evidence");
    expect(data?.file_size_limit).toBe(4 * 1024 * 1024);
  });
});

describe("verification (admin actions)", () => {
  let pendingId: string;
  beforeAll(async () => {
    session.client = student.client;
    const res = await submitExperience(null, form(submission({ evidence: PDF() })));
    pendingId = res.ok ? res.data.id : "";
  });

  it("non-admin calling verifyExperience → rejected", async () => {
    session.client = student.client;
    expect(await verifyExperience(null, form({ id: pendingId }))).toEqual({ ok: false, message: NOT_AUTHORISED });
    expect((await serviceClient().from("experiences").select("status").eq("id", pendingId).single()).data?.status).toBe("pending");
  });

  it("non-admin calling rejectExperience → rejected", async () => {
    session.client = other.client;
    expect(await rejectExperience(null, form({ id: pendingId, reason: "spam spam" }))).toEqual({ ok: false, message: NOT_AUTHORISED });
  });

  it("non-admin calling getEvidenceUrl → rejected, even for their own experience", async () => {
    session.client = student.client;
    expect(await getEvidenceUrl(pendingId)).toEqual({ ok: false, message: NOT_AUTHORISED });
    expect(await getEvidenceUrl(randomUUID())).toEqual({ ok: false, message: NOT_AUTHORISED });
  });

  it("anon calling admin actions → rejected", async () => {
    expect(await verifyExperience(null, form({ id: pendingId }))).toEqual({ ok: false, message: NOT_AUTHORISED });
    expect(await getEvidenceUrl(pendingId)).toEqual({ ok: false, message: NOT_AUTHORISED });
  });

  it("admin gets a 60 s signed URL that actually serves the file", async () => {
    session.client = admin.client;
    const res = await getEvidenceUrl(pendingId);
    expect(res.ok).toBe(true);
    const url = res.ok ? res.data.url : "";
    expect(url).toContain("token=");
    const body = await (await fetch(url)).text();
    expect(body.startsWith("%PDF-")).toBe(true);
  });

  it("admin: experience without evidence reports it", async () => {
    session.client = other.client;
    const res = await submitExperience(null, form(submission()));
    session.client = admin.client;
    expect(await getEvidenceUrl(res.ok ? res.data.id : "")).toEqual({ ok: false, message: "This experience has no evidence attached." });
  });

  it("reject requires a reason", async () => {
    session.client = admin.client;
    const res = await rejectExperience(null, form({ id: pendingId, reason: "" }));
    expect(!res.ok && res.fieldErrors?.reason?.[0]).toMatch(/reason/);
  });

  it("admin verifies; it leaves community_tips and appears in public_experiences", async () => {
    session.client = admin.client;
    expect(await verifyExperience(null, form({ id: pendingId }))).toMatchObject({ ok: true });
    const anon = anonClient();
    expect((await anon.from("public_experiences").select("id, has_evidence").eq("id", pendingId)).data).toEqual([{ id: pendingId, has_evidence: true }]);
    expect((await anon.from("community_tips").select("id").eq("id", pendingId)).data).toEqual([]);
    const row = await serviceClient().from("experiences").select("verified_by").eq("id", pendingId).single();
    expect(row.data?.verified_by).toBe(admin.id);
  });

  it("a second review of the same experience is refused", async () => {
    session.client = admin.client;
    expect(await verifyExperience(null, form({ id: pendingId }))).toEqual({ ok: false, message: "This experience was already reviewed." });
    expect(await rejectExperience(null, form({ id: pendingId, reason: "changed my mind" }))).toEqual({ ok: false, message: "This experience was already reviewed." });
  });

  it("admin rejects with a reason the owner can read", async () => {
    session.client = other.client;
    const sub = await submitExperience(null, form(submission()));
    const id = sub.ok ? sub.data.id : "";
    session.client = admin.client;
    expect(await rejectExperience(null, form({ id, reason: "No evidence of the interview" }))).toMatchObject({ ok: true });
    const own = await other.client.from("experiences").select("status, rejection_reason").eq("id", id).single();
    expect(own.data).toEqual({ status: "rejected", rejection_reason: "No evidence of the interview" });
  });
});

describe("checkClaim (anyone)", () => {
  it("cites exactly the verified company experiences tagged with the topic", async () => {
    const svc = serviceClient();
    const topicId = await lookupId("topics", "label", "Pseudocode");
    const verified = (await svc.from("experiences").select("id").eq("company_id", tcs.company_id).eq("status", "verified")).data!.map((r) => r.id);
    const tagged = (await svc.from("experience_topics").select("experience_id").eq("topic_id", topicId).in("experience_id", verified)).data!.map((r) => r.experience_id);

    const res = await checkClaim(null, form({ company_id: tcs.company_id, topic_id: topicId }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.total).toBe(verified.length);
    expect(res.data.cites.sort()).toEqual(tagged.sort());
    expect(res.data.cited.map((c) => c.id).sort()).toEqual(tagged.sort());
    expect(res.data).toMatchObject({ company: "TCS", topic: "Pseudocode" });
    expect(JSON.stringify(res.data)).not.toMatch(/user_id|evidence_path/);
  });

  it("requires both a company and a topic", async () => {
    const res = await checkClaim(null, form({ company_id: "", topic_id: "" }));
    expect(!res.ok && Object.keys(res.fieldErrors ?? {}).sort()).toEqual(["company_id", "topic_id"]);
  });
});
