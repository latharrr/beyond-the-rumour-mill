import type { SupabaseClient } from "@supabase/supabase-js";
import { anonClient } from "../helpers";

// Stand-in for "@/lib/supabase/server" in Server Action tests: actions run
// against real local Supabase as whichever user the test has signed in.
export const session: { client: SupabaseClient | null } = { client: null };

export async function createClient() {
  return session.client ?? anonClient();
}
