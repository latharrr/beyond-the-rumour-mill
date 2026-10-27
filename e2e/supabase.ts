import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// Service-role client for e2e setup only (creating confirmation links,
// checking DB state). Keys come from the running local stack.
let cached: Record<string, string> | null = null;
function status() {
  cached ??= JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  return cached!;
}

export const serviceClient = () =>
  createClient(status().API_URL, status().SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
