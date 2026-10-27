// §2.5 Rumour-check: deterministic, no NLP, one claim type —
// "<company> heavily asks <topic>". Pure, unit-tested.

export const SUPPORTED_MIN_FRAC = 0.5;      // frac ≥ 0.50 → Supported
export const NOT_SUPPORTED_MAX_FRAC = 0.15; // frac ≤ 0.15 → Not supported
export const MIN_SAMPLE = 3;                // total < 3 → "Low sample (n = total)"

export type Verdict = "Supported" | "Not supported" | "Mixed evidence" | "No verified evidence yet";

export type ClaimResult = {
  verdict: Verdict;
  /** Verdict plus the low-sample note when it applies, e.g. "Supported · Low sample (n = 2)". */
  label: string;
  frac: number;
  total: number;
  lowSample: boolean;
  /** Verified experiences for the company that mention the topic: the evidence cited. */
  cites: string[];
};

/**
 * @param experienceIds verified experiences for the company (public_experiences)
 * @param linkedIds     the subset linked to the topic (public_experience_topics)
 */
export function checkClaimVerdict(experienceIds: string[], linkedIds: Iterable<string>): ClaimResult {
  const total = experienceIds.length;
  if (total === 0) {
    return { verdict: "No verified evidence yet", label: "No verified evidence yet", frac: 0, total: 0, lowSample: false, cites: [] };
  }

  const linked = new Set(linkedIds);
  const cites = experienceIds.filter((id) => linked.has(id));
  const frac = cites.length / total;

  const verdict: Verdict =
    frac >= SUPPORTED_MIN_FRAC ? "Supported" : frac <= NOT_SUPPORTED_MAX_FRAC ? "Not supported" : "Mixed evidence";
  const lowSample = total < MIN_SAMPLE;

  return {
    verdict,
    label: lowSample ? `${verdict} · Low sample (n = ${total})` : verdict,
    frac,
    total,
    lowSample,
    cites,
  };
}
