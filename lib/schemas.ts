import { z } from "zod";

// Shared Zod schemas (client pre-validation + server authoritative).

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type Credentials = z.infer<typeof credentialsSchema>;

// Only same-origin relative paths; anything else falls back to the default.
export const safeNextPath = (value: unknown, fallback = "/dashboard") =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : fallback;

export const deleteAccountSchema = z.object({
  confirm: z.literal("DELETE", { error: "Type DELETE to confirm" }),
});
