import type { EligibilityResult } from "@/lib/eligibility";

/** "Eligible" / "Not eligible" / "Complete your profile"; nothing when signed out. */
export function EligibilityBadge({ eligibility }: { eligibility: EligibilityResult | null }) {
  if (!eligibility) return null;
  const label = eligibility.eligible ? "Eligible" : eligibility.incomplete ? "Complete your profile" : "Not eligible";
  return <span data-eligibility={eligibility.eligible ? "eligible" : eligibility.incomplete ? "incomplete" : "ineligible"}>{label}</span>;
}
