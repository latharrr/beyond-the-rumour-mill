import { StatusPill } from "@/components/ui/status";
import type { EligibilityResult } from "@/lib/eligibility";

/** "Eligible" / "Not eligible" / "Complete your profile"; nothing when signed out. */
export function EligibilityBadge({ eligibility }: { eligibility: EligibilityResult | null }) {
  if (!eligibility) return null;
  const state = eligibility.eligible ? "eligible" : eligibility.incomplete ? "incomplete" : "ineligible";
  return (
    <span data-eligibility={state} className="inline-flex">
      <StatusPill tone={state === "eligible" ? "verified" : state === "incomplete" ? "mixed" : "rumour"}>
        {state === "eligible" ? "Eligible" : state === "incomplete" ? "Complete your profile" : "Not eligible"}
      </StatusPill>
    </span>
  );
}
