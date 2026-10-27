import type { TrustBreakdown } from "@/lib/trust";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** 0–100 TrustScore (§2.6) with its three inputs for transparency. */
export function TrustScore({ trust }: { trust: TrustBreakdown }) {
  return (
    <span data-trust-score={trust.score} title={`Recency ${pct(trust.recency)} · Corroboration ${pct(trust.corroboration)} · Completeness ${pct(trust.completeness)}`}>
      Trust score {trust.score}/100
    </span>
  );
}
