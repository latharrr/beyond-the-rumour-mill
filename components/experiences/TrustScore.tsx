import { cn } from "@/lib/cn";
import type { TrustBreakdown } from "@/lib/trust";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** 0–100 TrustScore (§2.6); the hover title gives its three inputs. */
export function TrustScore({ trust, className }: { trust: TrustBreakdown; className?: string }) {
  return (
    <span
      data-trust-score={trust.score}
      title={`Recency ${pct(trust.recency)} · Corroboration ${pct(trust.corroboration)} · Completeness ${pct(trust.completeness)}`}
      className={cn("type-small whitespace-nowrap text-ink-muted", className)}
    >
      TrustScore{" "}
      <span className="type-data">
        <span className="font-medium text-ink">{trust.score}</span>/100
      </span>
    </span>
  );
}
