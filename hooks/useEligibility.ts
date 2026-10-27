"use client";

import { useMemo } from "react";
import {
  type BranchLabels,
  type EligibilityDrive,
  type EligibilityProfile,
  evaluateEligibility,
  explainEligibility,
} from "@/lib/eligibility";

/** Client-side eligibility (same pure engine the server uses), e.g. live preview while editing a profile. */
export function useEligibility(profile: EligibilityProfile | null, drive: EligibilityDrive, branchLabels?: BranchLabels) {
  return useMemo(() => {
    const result = evaluateEligibility(profile, drive, branchLabels);
    return { ...result, explanations: explainEligibility(result) };
  }, [profile, drive, branchLabels]);
}
