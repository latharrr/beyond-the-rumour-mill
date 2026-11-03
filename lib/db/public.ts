import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabasePublishableKey, supabaseUrl } from "./env";

/** Anonymous client for public tables and views only: no session, no secret key. Safe inside "use cache". */
export function publicClient() {
  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
