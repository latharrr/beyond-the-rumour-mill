"use client";

import { createContext, useContext } from "react";

// Shared checklist state, so WeeklyBuckets does not have to pass the toggle
// handler down to every ChecklistItem (Context API instead of prop drilling).
type ChecklistState = { toggle: (id: string, done: boolean) => void; saving: boolean };

export const ChecklistContext = createContext<ChecklistState | null>(null);

/** Custom hook: read the checklist context, failing loudly outside <Checklist>. */
export function useChecklist() {
  const value = useContext(ChecklistContext);
  if (!value) throw new Error("useChecklist must be used inside <Checklist>");
  return value;
}
