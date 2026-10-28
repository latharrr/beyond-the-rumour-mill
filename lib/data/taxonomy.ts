import { connection } from "next/server";
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseUrl, supabasePublishableKey } from "@/lib/supabase/env";

// Public reference tables only. No cookies, sessions or private rows enter this cache.
function publicClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// Reference data (public read). Small tables: fetched whole.

export type Company = { id: string; name: string; sector: string | null; logo_url: string | null };
export type Role = { id: string; label: string; aliases: string[] };
export type Branch = { id: string; code: string; label: string };
export type Topic = { id: string; label: string; category: string; aliases: string[] };
export type Resource = { id: string; title: string; url: string; type: string; topic_id: string | null; company_id: string | null };

async function cachedListCompanies(): Promise<Company[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("taxonomy");
  const supabase = publicClient();
  const { data, error } = await supabase.from("companies").select("id, name, sector, logo_url").order("name");
  if (error) throw error;
  return data;
}

async function cachedListRoles(): Promise<Role[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("taxonomy");
  const supabase = publicClient();
  const { data, error } = await supabase.from("roles").select("id, label, aliases").order("label");
  if (error) throw error;
  return data;
}

async function cachedListBranches(): Promise<Branch[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("taxonomy");
  const supabase = publicClient();
  const { data, error } = await supabase.from("branches").select("id, code, label").order("code");
  if (error) throw error;
  return data;
}

async function cachedListTopics(): Promise<Topic[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("taxonomy");
  const supabase = publicClient();
  const { data, error } = await supabase.from("topics").select("id, label, category, aliases").order("category").order("label");
  if (error) throw error;
  return data;
}

async function cachedListResources(): Promise<Resource[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("taxonomy");
  const supabase = publicClient();
  const { data, error } = await supabase.from("resources").select("id, title, url, type, topic_id, company_id").order("title");
  if (error) throw error;
  return data;
}

/** Branch id → code, for eligibility reasons ("Open to CSE, IT only"). */
export const branchCodeMap = (branches: Branch[]) => Object.fromEntries(branches.map((b) => [b.id, b.code]));

export async function listCompanies() {
  await connection();
  return cachedListCompanies();
}

export async function listRoles() {
  await connection();
  return cachedListRoles();
}

export async function listBranches() {
  await connection();
  return cachedListBranches();
}

export async function listTopics() {
  await connection();
  return cachedListTopics();
}

export async function listResources() {
  await connection();
  return cachedListResources();
}
