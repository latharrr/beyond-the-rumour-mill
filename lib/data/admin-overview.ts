import 'server-only';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/** Every call gates itself. All queries use the caller's RLS-bound client. */
export async function adminOverview() {
 await requireAdmin(); const db=await createClient();
 const [users,drives,submissions,plans] = await Promise.all([
  db.from('profiles').select('id',{count:'exact',head:true}),
  db.from('drives').select('id',{count:'exact',head:true}),
  db.from('experiences').select('status'),
  db.from('prep_plans').select('id',{count:'exact',head:true}),
 ]);
 for (const r of [users,drives,submissions,plans]) if(r.error) throw r.error;
 return { users:users.count??0, drives:drives.count??0, plans:plans.count??0,
  pending:submissions.data!.filter(s=>s.status==='pending').length,
  verified:submissions.data!.filter(s=>s.status==='verified').length,
  rejected:submissions.data!.filter(s=>s.status==='rejected').length };
}
export async function adminUsers(page:number) {
 await requireAdmin(); const db=await createClient();
 const {data,error,count}=await db.from('profiles').select('id,role,grad_year,branch:branches(code),created_at',{count:'exact'}).order('created_at',{ascending:false}).range((page-1)*25,page*25-1);
 if(error) throw error; return {users:data,count:count??0};
}
export async function adminSubmissions() {
 await requireAdmin(); const db=await createClient();
 const {data,error}=await db.from('experiences').select('id,status,created_at,verified_at,company:companies(name),role:roles(label)').order('created_at',{ascending:false}).limit(100);
 if(error) throw error; return data;
}
