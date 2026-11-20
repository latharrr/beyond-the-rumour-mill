import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ signUp: vi.fn(), verify: vi.fn(), set: vi.fn(), get: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/db/server", () => ({ createClient: async () => ({ auth: { signUp: h.signUp, verifyOtp: h.verify } }) }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error("REDIRECT:" + url); } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: h.set, get: h.get, delete: h.del }) }));
vi.mock("@/lib/site", () => ({ SITE_URL: "https://example.test" }));

import { signUp } from "@/app/_actions/auth";
import { GET } from "@/app/auth/confirm/route";
import { safeNextPath } from "@/lib/validation";
import { NextRequest } from "next/server";

const form = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };
const creds = { email: "fixture@example.test", password: "password123" };

beforeEach(() => { vi.resetAllMocks(); h.verify.mockResolvedValue({ error: null }); });

describe("safeNextPath", () => {
  it("keeps same-site paths with a query", () => expect(safeNextPath("/drives/abc?x=1")).toBe("/drives/abc?x=1"));
  it.each(["//evil.example", "/\\evil.example", "/\t/evil.example", "/\n/evil.example", "/ /evil", "https://evil.example", "", null, undefined, 5])(
    "rejects %j", (v) => expect(safeNextPath(v, "/safe")).toBe("/safe"));
  it("rejects very long values", () => expect(safeNextPath("/" + "a".repeat(600), "/safe")).toBe("/safe"));
});

describe("signUp keeps the destination", () => {
  it("with a session, goes to onboarding carrying next", async () => {
    h.signUp.mockResolvedValue({ data: { session: {} }, error: null });
    await expect(signUp({}, form({ ...creds, next: "/drives/abc" }))).rejects.toThrow("REDIRECT:/onboarding?next=%2Fdrives%2Fabc");
  });
  it("with a session and no next, goes to plain onboarding", async () => {
    h.signUp.mockResolvedValue({ data: { session: {} }, error: null });
    await expect(signUp({}, form(creds))).rejects.toThrow("REDIRECT:/onboarding");
  });
  it("drops an off-site next", async () => {
    h.signUp.mockResolvedValue({ data: { session: {} }, error: null });
    await expect(signUp({}, form({ ...creds, next: "//evil.example" }))).rejects.toThrow(/REDIRECT:\/onboarding$/);
  });
  it("without a session, remembers a safe next in an httpOnly cookie", async () => {
    h.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const r = await signUp({}, form({ ...creds, next: "/drives/abc" }));
    expect(r.message).toContain("Check your email");
    expect(h.set).toHaveBeenCalledWith("btrm_next", "/drives/abc", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  });
  it("without a session, stores nothing for an unsafe next", async () => {
    h.signUp.mockResolvedValue({ data: { session: null }, error: null });
    await signUp({}, form({ ...creds, next: "/\t/evil.example" }));
    expect(h.set).not.toHaveBeenCalled();
  });
});

describe("confirmation resumes the saved destination", () => {
  const url = (q: string) => new NextRequest("http://localhost:3100/auth/confirm?" + q);
  it("uses the saved cookie after a signup confirm, then clears it", async () => {
    h.get.mockReturnValue({ value: "/drives/abc" });
    const r = await GET(url("token_hash=t&type=signup"));
    expect(r.headers.get("location")).toBe("https://example.test/onboarding?next=%2Fdrives%2Fabc");
    expect(h.del).toHaveBeenCalledWith("btrm_next");
  });
  it("ignores an unsafe cookie", async () => {
    h.get.mockReturnValue({ value: "//evil.example" });
    const r = await GET(url("token_hash=t&type=signup"));
    expect(r.headers.get("location")).toBe("https://example.test/onboarding");
  });
  it("never lets a saved destination override a recovery link", async () => {
    h.get.mockReturnValue({ value: "/drives/abc" });
    const r = await GET(url("token_hash=t&type=recovery"));
    expect(r.headers.get("location")).toBe("https://example.test/reset-password");
  });
  it("keeps the cookie when verification fails", async () => {
    h.verify.mockResolvedValue({ error: { message: "x" } });
    const r = await GET(url("token_hash=t&type=signup"));
    expect(r.headers.get("location")).toBe("https://example.test/login?error=confirm");
    expect(h.del).not.toHaveBeenCalled();
  });
});
