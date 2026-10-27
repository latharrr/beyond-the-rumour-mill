import { z } from "zod";

// Shared Zod schemas (client pre-validation + server authoritative).
// Feature schemas land in Phase 1; login is the only form in Phase 0.

export const loginSchema = z.object({
  email: z.email(),
});

export type LoginInput = z.infer<typeof loginSchema>;
