import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabasePublishableKey, supabaseUrl } from "./env";

// Browser client for Client Components. Same RLS as the server client.
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
