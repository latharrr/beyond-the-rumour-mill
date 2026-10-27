"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Hover lift and press squash for a pill control (framer-motion owns these). */
export function Press({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.span className={cn("inline-flex", className)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
      {children}
    </m.span>
  );
}
