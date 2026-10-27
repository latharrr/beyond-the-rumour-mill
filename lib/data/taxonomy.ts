import "server-only";
import { createClient } from "@/lib/supabase/server";

// Reference data (public read). Small tables: fetched whole.

export type Company = { id: string; name: string; sector: string | null; logo_url: string | null };
export type Role = { id: string; label: string; aliases: string[] };
export type Branch = { id: string; code: string; label: string };
export type Topic = { id: string; label: string; category: string; aliases: string[] };
export type Resource = { id: string; title: string; url: string; type: string; topic_id: string | null; company_id: string | null };

export async function listCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").select("id, name, sector, logo_url").order("name");
  if (error) throw error;
  return data;
}

export async function listRoles(): Promise<Role[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select("id, label, aliases").order("label");
  if (error) throw error;
  return data;
}

export async function listBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").select("id, code, label").order("code");
  if (error) throw error;
  return data;
}

export async function listTopics(): Promise<Topic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("topics").select("id, label, category, aliases").order("category").order("label");
  if (error) throw error;
  return data;
}

export async function listResources(): Promise<Resource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("resources").select("id, title, url, type, topic_id, company_id").order("title");
  if (error) throw error;
  return data;
}

/** Branch id → code, for eligibility reasons ("Open to CSE, IT only"). */
export const branchCodeMap = (branches: Branch[]) => Object.fromEntries(branches.map((b) => [b.id, b.code]));
