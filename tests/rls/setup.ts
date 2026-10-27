import { execSync } from "node:child_process";

// Resolve local Supabase URL + keys. CI and local both run `supabase start`,
// so `supabase status` is the single source of truth unless env overrides it.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const raw = execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const status = JSON.parse(raw) as Record<string, string>;
  process.env.SUPABASE_URL ??= status.API_URL;
  process.env.SUPABASE_ANON_KEY ??= status.ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= status.SERVICE_ROLE_KEY;
}

// The app's own env names, for Server Actions imported by tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= process.env.SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= process.env.SUPABASE_ANON_KEY;
process.env.SUPABASE_SECRET_KEY ??= process.env.SUPABASE_SERVICE_ROLE_KEY;
