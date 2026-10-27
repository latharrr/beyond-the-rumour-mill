import "server-only";
import { createClient } from "@/lib/supabase/server";

// Admin-only reads. Callers sit behind (admin)/layout.tsx; RLS additionally
// limits base-table reads to admins. evidence_path is reduced to a boolean
// here so the path never reaches the browser, even an admin's.

export type QueueItem = {
  id: string;
  company: string;
  role: string;
  drive: string | null;
  rounds_summary: string | null;
  preparation_timeline: string | null;
  created_at: string | null;
  hasEvidence: boolean;
  topics: string[];
  author: { role: string | null; grad_year: number | null };
};

export async function listVerificationQueue(): Promise<QueueItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiences")
    .select(`id, rounds_summary, preparation_timeline, created_at, evidence_path, user_id,
      company:companies(name), role:roles(label), drive:drives(title),
      experience_topics(topic:topics(label))`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const userIds = [...new Set(data.map((e) => e.user_id).filter((x): x is string => !!x))];
  const authors = userIds.length
    ? (await supabase.from("profiles").select("id, role, grad_year").in("id", userIds)).data ?? []
    : [];

  return data.map((e) => {
    const author = authors.find((a) => a.id === e.user_id);
    return {
      id: e.id,
      company: e.company?.name ?? "Unknown",
      role: e.role?.label ?? "Unknown",
      drive: e.drive?.title ?? null,
      rounds_summary: e.rounds_summary,
      preparation_timeline: e.preparation_timeline,
      created_at: e.created_at,
      hasEvidence: e.evidence_path != null,
      topics: e.experience_topics.map((t) => t.topic?.label ?? "").filter(Boolean),
      author: { role: author?.role ?? null, grad_year: author?.grad_year ?? null },
    };
  });
}
