import { describe, expect, it } from "vitest";
import { evidenceObjectPath, fileMatchesType, sniffMatches } from "@/lib/evidence";
import { evidenceFileSchema } from "@/lib/schemas";

const file = (bytes: number[], type: string, size?: number) => {
  const body = new Uint8Array(size ?? bytes.length);
  body.set(bytes);
  return new File([body], "upload", { type });
};

describe("evidence file checks", () => {
  it("accepts real PDF / PNG / JPEG signatures", async () => {
    expect(await fileMatchesType(file([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31], "application/pdf"))).toBe(true);
    expect(await fileMatchesType(file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png"))).toBe(true);
    expect(await fileMatchesType(file([0xff, 0xd8, 0xff, 0xe0], "image/jpeg"))).toBe(true);
  });

  it("rejects a mislabelled file and disallowed types", async () => {
    expect(await fileMatchesType(file([0x4d, 0x5a, 0x90, 0x00], "application/pdf"))).toBe(false); // "MZ" exe
    expect(await fileMatchesType(file([0x3c, 0x68], "text/html"))).toBe(false);
    expect(sniffMatches("image/png", new Uint8Array([0x89, 0x50]))).toBe(false);
  });

  it("schema enforces 4 MB and the MIME allowlist", () => {
    expect(evidenceFileSchema.safeParse(file([0x25], "application/pdf", 4 * 1024 * 1024)).success).toBe(true);
    expect(evidenceFileSchema.safeParse(file([0x25], "application/pdf", 4 * 1024 * 1024 + 1)).success).toBe(false);
    expect(evidenceFileSchema.safeParse(file([0x25], "image/gif")).success).toBe(false);
  });

  it("paths are {uid}/{uuid}.{ext} with a server-chosen name", () => {
    expect(evidenceObjectPath("u1", "application/pdf", "abc")).toBe("u1/abc.pdf");
    expect(evidenceObjectPath("u1", "image/jpeg")).toMatch(/^u1\/[0-9a-f-]{36}\.jpg$/);
  });
});
