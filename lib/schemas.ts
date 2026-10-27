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

// --- Experiences (submitExperience / verify / reject) ------------------------

export const EVIDENCE_MAX_BYTES = 4 * 1024 * 1024; // team decision: Vercel 4.5 MB body cap
export const EVIDENCE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" } as const;
export type EvidenceType = keyof typeof EVIDENCE_TYPES;

const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(max).nullable().optional())
    .transform((v) => v ?? null);

export const experienceSchema = z.object({
  company_id: uuid("company"),
  role_id: uuid("role"),
  drive_id: z.preprocess(blankToNull, z.uuid().nullable()),
  rounds_summary: z.string().trim().min(30, "Describe the rounds in at least 30 characters").max(5000),
  preparation_timeline: optionalText(2000),
  topic_ids: z.array(z.uuid()).min(1, "Pick at least one topic").max(20, "Pick at most 20 topics"),
  resource_ids: z.array(z.uuid()).max(20).default([]),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

/** Client + server pre-check on the evidence file (server also sniffs bytes). */
export const evidenceFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= EVIDENCE_MAX_BYTES, "Evidence must be 4 MB or smaller")
  .refine((f) => f.type in EVIDENCE_TYPES, "Evidence must be a JPEG, PNG or PDF");

export const reviewIdSchema = z.object({ id: z.uuid("Missing experience id") });

export const rejectSchema = z.object({
  id: z.uuid("Missing experience id"),
  reason: z.string().trim().min(5, "Give the student a reason (at least 5 characters)").max(500),
});

// --- Rumour check (§2.5) ------------------------------------------------------

export const claimSchema = z.object({
  company_id: uuid("company"),
  topic_id: uuid("topic"),
});

// --- Plans (generatePlan, toggleChecklistItem) -------------------------------
export const generatePlanSchema = z.object({ drive_id: z.uuid("Missing drive id") });

export const toggleItemSchema = z.object({
  id: z.uuid("Missing checklist item id"),
  done: z.boolean(),
});
