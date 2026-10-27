// Server Actions for profiles + drives, run against real local Supabase.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdmin, createUser, deleteUsers, lookupId, serviceClient, type TestUser } from "./helpers";
import { session } from "./mocks/server";

vi.mock("@/lib/supabase/server", () => import("./mocks/server"));
vi.mock("next/navigation", () => import("./mocks/navigation"));
vi.mock("next/cache", () => import("./mocks/cache"));

const { saveProfile } = await import("@/app/_actions/profile");
const { createDrive, updateDrive } = await import("@/app/_actions/drives");

const NOT_AUTHORISED = "You are not allowed to do that.";

function form(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) fd.append(k, x);
  return fd;
}

let student: TestUser;
let admin: TestUser;
let ids: { company: string; role: string; cse: string; it: string; dp: string; arrays: string };
const createdDrives: string[] = [];

beforeAll(async () => {
  [student, admin] = await Promise.all([createUser("drv-student"), createAdmin()]);
  const svc = serviceClient();
  const branch = async (code: string) => (await svc.from("branches").select("id").eq("code", code).single()).data!.id as string;
  ids = {
    company: await lookupId("companies", "name", "Infosys"),
    role: (await svc.from("roles").select("id").eq("label", "Data Analyst").single()).data!.id,
    cse: await branch("CSE"),
    it: await branch("IT"),
    dp: await lookupId("topics", "label", "Dynamic Programming"),
    arrays: await lookupId("topics", "label", "Arrays"),
  };
});

afterAll(async () => {
  await serviceClient().from("drives").delete().in("id", createdDrives);
  await deleteUsers(student, admin);
});

beforeEach(() => {
  session.client = null;
});

const driveFields = (over: Record<string, string | string[]> = {}) => ({
  title: "Infosys DA pilot",
  company_id: ids.company,
  role_id: ids.role,
  status: "upcoming",
  eligibility_cgpa: "7.5",
  max_backlogs: "0",
  min_10th_pct: "",
  min_12th_pct: "",
  grad_years: "2026, 2027",
  drive_date: "2026-12-01",
  location: "Virtual",
  branch_ids: [ids.cse, ids.it],
  rounds: JSON.stringify([
    { name: "OA", description: "Coding", topic_ids: [ids.dp, ids.arrays] },
    { name: "Interview", description: "", topic_ids: [] },
  ]),
  ...over,
});

describe("saveProfile", () => {
  const valid = () => ({ branch_id: ids.cse, cgpa: "8.25", backlogs: "0", pct_10th: "90", pct_12th: "85", grad_year: "2026" });

  it("updates the caller's own profile", async () => {
    session.client = student.client;
    const res = await saveProfile(null, form(valid()));
    expect(res).toEqual({ ok: true, data: null, message: "Profile saved." });
    const row = await serviceClient().from("profiles").select("cgpa, branch_id, grad_year, role").eq("id", student.id).single();
    expect(row.data).toEqual({ cgpa: 8.25, branch_id: ids.cse, grad_year: 2026, role: "student" });
  });

  it("ignores a smuggled role field", async () => {
    session.client = student.client;
    await saveProfile(null, form({ ...valid(), role: "admin" }));
    expect((await serviceClient().from("profiles").select("role").eq("id", student.id).single()).data?.role).toBe("student");
  });

  it("returns field errors for invalid input", async () => {
    session.client = student.client;
    const res = await saveProfile(null, form({ ...valid(), cgpa: "11", branch_id: "" }));
    expect(res.ok).toBe(false);
    expect(!res.ok && Object.keys(res.fieldErrors ?? {}).sort()).toEqual(["branch_id", "cgpa"]);
  });

  it("redirects to a safe `next` after saving", async () => {
    session.client = student.client;
    await expect(saveProfile(null, form({ ...valid(), next: "//evil.example" }))).rejects.toThrow("NEXT_REDIRECT:/drives?eligibleOnly=1");
    await expect(saveProfile(null, form({ ...valid(), next: "/drives/abc" }))).rejects.toThrow("NEXT_REDIRECT:/drives/abc");
  });

  it("rejects when signed out", async () => {
    expect(await saveProfile(null, form(valid()))).toMatchObject({ ok: false, message: "Please sign in first." });
  });
});

describe("createDrive / updateDrive (admin)", () => {
  it("non-admin calling createDrive → rejected, nothing written", async () => {
    session.client = student.client;
    const res = await createDrive(null, form(driveFields({ title: "Student drive" })));
    expect(res).toEqual({ ok: false, message: NOT_AUTHORISED });
    expect((await serviceClient().from("drives").select("id").eq("title", "Student drive")).data).toEqual([]);
  });

  it("anon calling createDrive → rejected", async () => {
    expect(await createDrive(null, form(driveFields()))).toEqual({ ok: false, message: NOT_AUTHORISED });
  });

  it("non-admin calling save_drive RPC directly → 42501", async () => {
    const { error } = await student.client.rpc("save_drive", {
      p_drive_id: null as unknown as string, p_company_id: ids.company, p_role_id: ids.role, p_title: "x",
      p_eligibility_cgpa: null as unknown as number, p_max_backlogs: 0, p_min_10th_pct: null as unknown as number,
      p_min_12th_pct: null as unknown as number, p_grad_years: [], p_drive_date: null as unknown as string,
      p_location: null as unknown as string, p_status: "upcoming", p_branch_ids: [], p_rounds: [],
    });
    expect(error?.code).toBe("42501");
  });

  it("admin creates a drive with branches, rounds and round topics in one call", async () => {
    session.client = admin.client;
    const res = await createDrive(null, form(driveFields()));
    expect(res.ok).toBe(true);
    const id = res.ok ? res.data.id : "";
    createdDrives.push(id);

    const svc = serviceClient();
    const drive = await svc.from("drives").select("title, grad_years, eligibility_cgpa, created_by").eq("id", id).single();
    expect(drive.data).toEqual({ title: "Infosys DA pilot", grad_years: [2026, 2027], eligibility_cgpa: 7.5, created_by: admin.id });
    expect((await svc.from("drive_branches").select("branch_id").eq("drive_id", id)).data).toHaveLength(2);
    const rounds = await svc.from("rounds").select("name, position, round_topics(topic_id)").eq("drive_id", id).order("position");
    expect(rounds.data!.map((r) => [r.name, r.position, r.round_topics.length])).toEqual([["OA", 1, 2], ["Interview", 2, 0]]);
  });

  it("returns field errors without touching the DB", async () => {
    session.client = admin.client;
    const res = await createDrive(null, form(driveFields({ title: "x", status: "archived" })));
    expect(!res.ok && Object.keys(res.fieldErrors ?? {}).sort()).toEqual(["status", "title"]);
  });

  it("non-admin calling updateDrive → rejected, drive unchanged", async () => {
    session.client = student.client;
    const id = createdDrives[0];
    const res = await updateDrive(null, form(driveFields({ id, title: "Hijacked" })));
    expect(res).toEqual({ ok: false, message: NOT_AUTHORISED });
    expect((await serviceClient().from("drives").select("title").eq("id", id).single()).data?.title).toBe("Infosys DA pilot");
  });

  it("admin update replaces branches and rounds", async () => {
    session.client = admin.client;
    const id = createdDrives[0];
    const res = await updateDrive(null, form(driveFields({
      id, title: "Infosys DA pilot (v2)", branch_ids: [],
      rounds: JSON.stringify([{ name: "Single round", topic_ids: [ids.dp] }]),
    })));
    expect(res).toMatchObject({ ok: true, data: { id } });
    const svc = serviceClient();
    expect((await svc.from("drive_branches").select("branch_id").eq("drive_id", id)).data).toEqual([]);
    expect((await svc.from("rounds").select("name").eq("drive_id", id)).data).toEqual([{ name: "Single round" }]);
  });

  it("a failing update is atomic: nothing changes", async () => {
    session.client = admin.client;
    const id = createdDrives[0];
    const res = await updateDrive(null, form(driveFields({
      id, title: "Should not persist",
      rounds: JSON.stringify([{ name: "Bad", topic_ids: ["00000000-0000-4000-8000-000000000000"] }]),
    })));
    expect(res.ok).toBe(false);
    const svc = serviceClient();
    expect((await svc.from("drives").select("title").eq("id", id).single()).data?.title).toBe("Infosys DA pilot (v2)");
    expect((await svc.from("rounds").select("name").eq("drive_id", id)).data).toEqual([{ name: "Single round" }]);
  });

  it("updating a missing drive reports it", async () => {
    session.client = admin.client;
    const res = await updateDrive(null, form(driveFields({ id: "00000000-0000-4000-8000-000000000000" })));
    expect(res).toEqual({ ok: false, message: "That drive no longer exists." });
  });
});
