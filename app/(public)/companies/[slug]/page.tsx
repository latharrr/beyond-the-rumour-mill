import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BackLink, textLink } from '@/components/ui/pill';
import { card, PageHeader, pageMain } from '@/components/ui/surface';
import { companyResearch, getCompanyResearch, researchChecked, researchStatus } from '@/lib/company-research';
export function generateStaticParams() { return companyResearch.map(c => ({ slug: c.slug })); }
export async function generateMetadata({params}: PageProps<'/companies/[slug]'>): Promise<Metadata> {
  const c = getCompanyResearch((await params).slug);
  return { title: c ? `${c.name}: requirements and reported interview questions` : 'Company not found' };
}
const Bullets = ({items}: {items: string[]}) => <ul className="mt-4 list-disc space-y-2 pl-5 type-body text-ink-muted">{items.map((s,i) => <li key={i}>{s}</li>)}</ul>;
export default async function CompanyPage({params}: PageProps<'/companies/[slug]'>) {
 const c = getCompanyResearch((await params).slug); if (!c) notFound();
 return <main className={`${pageMain} pb-20`}>
  <BackLink href="/companies">All companies</BackLink>
  <PageHeader title={c.name} label={c.segment} lede={c.roles.join(' · ')} />
  <section className={`${card} p-5 md:p-7`}>
    <p className="type-label text-amber">{researchStatus(c)}</p><h2 className="mt-3 type-title">{c.opening.label}</h2>
    <p className="mt-3 type-body text-ink-muted">{c.status_note}</p>
    <p className="mt-3 type-small text-ink-dim">Checked {researchChecked}. Availability may change. No campus affiliation, application deadline or eligibility is implied where the source does not state it.</p>
    <a className={`${textLink} mt-4 inline-block`} href={c.opening.url} target="_blank" rel="noreferrer">View official opportunity / current status ↗</a>
  </section>
  <section className="mt-10"><h2 className="type-section">Official requirements & process</h2>
    <Bullets items={c.official_requirements.facts} />
    <a className={`${textLink} mt-4 inline-block`} href={c.official_requirements.source_url} target="_blank" rel="noreferrer">Official source ↗</a>
    {c.name === 'Wipro' && <p className="mt-2 type-small text-ink-dim">Role-specific requirements come from the Graduate Engineer Trainee posting linked above, not a universal Wipro rule.</p>}
    <p className="mt-4 type-small text-ink-dim">Not stated means unknown, not zero backlogs, all branches or all batches. No automated eligibility verdict is made for these public records.</p>
  </section>
  <section className="mt-10"><h2 className="type-section">Candidate-reported interviews</h2>
    <p className="mt-3 type-body text-ink-muted">Historical examples, not guaranteed future questions. Each report is one candidate&apos;s account, not a company-wide frequency estimate or an app-verified experience.</p>
    {c.experiences.map(e => <article key={e.source_url} className={`${card} mt-5 p-5 md:p-7`}>
      <p className="type-label text-ink-dim">Historical report · {e.published}</p><h3 className="mt-3 type-title">{e.role}</h3>
      <p className="mt-2 type-small text-ink-dim">Candidate-written GeeksforGeeks report. Independently unverified. Summarized, not reproduced in full.</p>
      <h4 className="mt-6 type-label">Reported rounds</h4><Bullets items={e.rounds} />
      <h4 className="mt-6 type-label">Reported questions & topics</h4><Bullets items={e.questions} />
      <a className={`${textLink} mt-5 inline-block`} href={e.source_url} target="_blank" rel="noreferrer">Read original report: {e.source_title} ↗</a>
    </article>)}
  </section>
  <section className="mt-10"><h2 className="type-section">Preparation focus</h2><Bullets items={c.prep_focus} /><p className="mt-3 type-small text-ink-dim">Editorial preparation suggestions based on the sources above, not official requirements.</p></section>
 </main>;
}
