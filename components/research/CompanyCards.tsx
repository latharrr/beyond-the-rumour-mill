import Link from 'next/link';
import { companyResearch, researchChecked, researchStatus } from '@/lib/company-research';
import { card } from '@/components/ui/surface';
import { textLink } from '@/components/ui/pill';

export function CompanyCards({ compact = false }: { compact?: boolean }) {
  return <section className="my-10" aria-labelledby="public-research">
    <h2 id="public-research" className="type-section text-ink">Company research & public opportunities</h2>
    <p className="mt-3 max-w-[75ch] type-body text-ink-muted">12 companies, official career requirements and attributed interview reports. Checked {researchChecked}. These are not LPU campus announcements. A career page is not proof of an open role; unknown requirements are not eligibility.</p>
    <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{companyResearch.map(c => <li key={c.slug} className={`${card} p-5`}>
      <p className="type-label text-ink-dim">{researchStatus(c)}</p>
      <h3 className="mt-3 type-title text-ink"><Link href={`/companies/${c.slug}`} className="hover:underline">{c.name}</Link></h3>
      <p className="mt-2 type-small text-ink-muted">{c.opening.label}</p>
      {!compact && <p className="mt-3 type-small text-ink-muted">{c.prep_focus.join(' · ')}</p>}
      <Link href={`/companies/${c.slug}`} className={`${textLink} mt-4 inline-block`}>Requirements, rounds & sources</Link>
    </li>)}</ul>
    <p className="mt-4 type-small text-ink-dim">Public reports are historical candidate accounts, not verified app submissions. They do not affect rumour verdicts, topic frequencies or personalized campus plans.</p>
  </section>;
}
