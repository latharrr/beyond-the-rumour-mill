import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

// Service-role client: bypasses RLS. Server-only and used for exactly two
// jobs that users are deliberately not granted: deleting orphaned evidence
// objects after a failed submit, and account deletion. Never pass its
// results to the client unfiltered.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
