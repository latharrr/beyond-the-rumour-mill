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

// --- FormData helpers -------------------------------------------------------
// HTML forms send "" for empty inputs; these turn "" into null/undefined
// before validation so optional numeric fields work with plain <input>s.

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const decimal = (min: number, max: number, label: string) =>
  z.coerce
    .number({ error: `Enter your ${label}` })
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`)
    .refine((n) => Math.round(n * 100) === n * 100 || Math.abs(Math.round(n * 100) - n * 100) < 1e-6, `${label} can have at most 2 decimals`);

const optionalDecimal = (min: number, max: number, label: string) =>
  z.preprocess(blankToNull, decimal(min, max, label).nullable());

const uuid = (label: string) => z.uuid(`Choose a ${label}`);

// --- Profile (saveProfile) --------------------------------------------------
// No `role` field: the DB column grant blocks it anyway (§2.2).

export const profileSchema = z.object({
  branch_id: uuid("branch"),
  cgpa: decimal(0, 10, "CGPA"),
  backlogs: z.coerce.number({ error: "Enter your active backlogs" }).int("Backlogs must be a whole number").min(0, "Backlogs cannot be negative"),
  pct_10th: decimal(0, 100, "10th percentage"),
  pct_12th: decimal(0, 100, "12th percentage"),
  grad_year: z.coerce.number({ error: "Enter your graduation year" }).int().min(2000, "Enter a valid year").max(2100, "Enter a valid year"),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// --- Drives (createDrive / updateDrive → save_drive RPC) --------------------

export const DRIVE_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;

export const roundSchema = z.object({
  name: z.string().trim().min(1, "Round name is required").max(120),
  description: z.string().trim().max(2000).nullable().optional().transform((v) => v || null),
  topic_ids: z.array(z.uuid()).default([]),
  resource_ids: z.array(z.uuid()).default([]),
});

/** "2026, 2027" → [2026, 2027]; blank → [] (all batches). */
const gradYearsList = z.preprocess(
  (v) => (typeof v === "string" ? v.split(/[\s,]+/).filter(Boolean) : v ?? []),
  z.array(z.coerce.number().int().min(2000, "Years must be 2000–2100").max(2100, "Years must be 2000–2100")),
).transform((years) => [...new Set(years)].sort((a, b) => a - b));

/** Rounds arrive as a JSON string from the rounds editor's hidden input. */
const roundsJson = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return [];
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}, z.array(roundSchema, { error: "Rounds could not be read" }).max(20));

export const driveSchema = z.object({
  id: z.preprocess(blankToNull, z.uuid().nullable()).optional(),
  company_id: uuid("company"),
  role_id: uuid("role"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  eligibility_cgpa: optionalDecimal(0, 10, "CGPA cutoff"),
  max_backlogs: z.preprocess((v) => (v === "" || v == null ? 0 : v), z.coerce.number().int().min(0, "Backlogs cannot be negative")),
  min_10th_pct: optionalDecimal(0, 100, "10th minimum"),
  min_12th_pct: optionalDecimal(0, 100, "12th minimum"),
  grad_years: gradYearsList,
  drive_date: z.preprocess(blankToNull, z.iso.date("Enter a valid date").nullable()),
  location: z.preprocess(blankToNull, z.string().trim().max(200).nullable()),
  status: z.enum(DRIVE_STATUSES, { error: "Choose a status" }),
  branch_ids: z.array(z.uuid()).default([]),
  rounds: roundsJson,
});

export type DriveInput = z.infer<typeof driveSchema>;

// --- /drives filters (searchParams) ------------------------------------------

export const driveFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  company: z.uuid().optional().catch(undefined),
  eligibleOnly: z.preprocess((v) => v === "1" || v === "true" || v === "on", z.boolean()).catch(false),
});

export type DriveFilters = z.infer<typeof driveFiltersSchema>;
