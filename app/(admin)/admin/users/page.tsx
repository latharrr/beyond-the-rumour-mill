import Link from 'next/link';
import { Suspense } from 'react';
import { adminUsers } from '@/lib/data/admin-overview';
import { PageHeader,pageMain,card } from '@/components/ui/surface';
export default function UsersPage({searchParams}:PageProps<'/admin/users'>) {
 return <main className={`${pageMain} pb-20`}><PageHeader title="Users" lede="Minimal profile directory for project administration. Private auth credentials, emails and evidence paths are never included."/><Suspense fallback={<p role="status">Loading profiles...</p>}><Users searchParams={searchParams}/></Suspense></main>;
}
async function Users({searchParams}:Pick<PageProps<'/admin/users'>,'searchParams'>) {
 const value=(await searchParams).page; const page=Math.min(10000,Math.max(1,Number(typeof value==='string'?value:1)||1));
 const {users,count}=await adminUsers(Math.floor(page));
 return <><p className="mb-4 type-small text-ink-muted">{count} profiles · page {page} · 25 per page</p><ul className="grid gap-3 md:grid-cols-2">{users.map(u=><li key={u.id} className={`${card} p-5`}>
 <h2 className="type-title">Account {u.id.slice(0,8)}...</h2><p className="mt-2 type-small text-ink-muted">Role: {u.role} · Batch: {u.grad_year??'Not set'} · Branch: {u.branch?.code??'Not set'}</p><p className="mt-2 type-small text-ink-dim">Joined {u.created_at?.slice(0,10)??'Unknown'}</p></li>)}</ul>
 <nav aria-label="User pages" className="mt-6 flex gap-6 text-amber">{page>1&&<Link href={`/admin/users?page=${page-1}`}>Previous</Link>}{page*25<count&&<Link href={`/admin/users?page=${page+1}`}>Next</Link>}</nav>
 <p className="mt-6 type-small text-ink-dim">Read-only by design. No bulk messaging, role escalation, suspension or deletion is performed here.</p></>;
}
