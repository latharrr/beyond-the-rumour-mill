import { describe, expect, it } from "vitest";
import { checkClaimVerdict, MIN_SAMPLE, NOT_SUPPORTED_MAX_FRAC, SUPPORTED_MIN_FRAC } from "@/lib/rumour";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `e${i}`);

describe("checkClaimVerdict", () => {
  it("named thresholds match the spec", () => {
    expect([SUPPORTED_MIN_FRAC, NOT_SUPPORTED_MAX_FRAC, MIN_SAMPLE]).toEqual([0.5, 0.15, 3]);
  });

  it("no verified experiences → 'No verified evidence yet', no cites", () => {
    expect(checkClaimVerdict([], [])).toEqual({
      verdict: "No verified evidence yet", label: "No verified evidence yet", frac: 0, total: 0, lowSample: false, cites: [],
    });
  });

  it("frac exactly 0.50 → Supported, citing the linked experiences", () => {
    const r = checkClaimVerdict(ids(4), ["e0", "e3"]);
    expect(r).toMatchObject({ verdict: "Supported", label: "Supported", frac: 0.5, total: 4, cites: ["e0", "e3"] });
  });

  it("just below 0.50 → Mixed evidence", () => {
    expect(checkClaimVerdict(ids(9), ["e0", "e1", "e2", "e3"]).verdict).toBe("Mixed evidence"); // 0.444
  });

  it("frac exactly 0.15 → Not supported; just above → Mixed", () => {
    expect(checkClaimVerdict(ids(20), ["e0", "e1", "e2"]).verdict).toBe("Not supported"); // 0.15
    expect(checkClaimVerdict(ids(19), ["e0", "e1", "e2"]).verdict).toBe("Mixed evidence"); // 0.158
  });

  it("zero linked → Not supported with no cites", () => {
    expect(checkClaimVerdict(ids(5), [])).toMatchObject({ verdict: "Not supported", frac: 0, cites: [] });
  });

  it("total < 3 appends the low-sample note; total = 3 does not", () => {
    expect(checkClaimVerdict(ids(2), ["e0"]).label).toBe("Supported · Low sample (n = 2)");
    expect(checkClaimVerdict(ids(1), []).label).toBe("Not supported · Low sample (n = 1)");
    expect(checkClaimVerdict(ids(3), ["e0", "e1"])).toMatchObject({ label: "Supported", lowSample: false });
  });

  it("ignores linked ids outside the company set", () => {
    expect(checkClaimVerdict(ids(2), ["e0", "other-company"]).cites).toEqual(["e0"]);
  });
});
