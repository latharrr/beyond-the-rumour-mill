import Link from 'next/link';
import { adminOverview } from '@/lib/data/admin-overview';
import { card } from '@/components/ui/surface';
export async function AdminOverview() {
 const d=await adminOverview();
 return <section className="mb-10" aria-label="Admin overview">
 <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{Object.entries(d).map(([label,value])=><div key={label} className={`${card} p-4`}><p className="type-label text-ink-dim">{label==='users'?'Profiles':label==='plans'?'Visible plans':label}</p><p className="mt-2 type-section">{value}</p></div>)}</div>
 <p className="mt-3 type-small text-ink-dim">Live database counts. Profile count is not a login/traffic metric. Plans respect the current account&apos;s row access.</p>
 <div className="mt-4 flex flex-wrap gap-5 type-small text-amber"><Link href="/admin/users">Browse users</Link><Link href="/admin/content">Content & source coverage</Link><Link href="/admin/drives">Manage campus drives</Link></div>
 </section>;
}
