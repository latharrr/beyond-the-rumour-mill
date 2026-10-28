import type { Metadata } from 'next';
import { CompanyCards } from '@/components/research/CompanyCards';
import { PageHeader, pageMain } from '@/components/ui/surface';
export const metadata: Metadata = { title: 'Company interview research and requirements', alternates: { canonical: '/companies' } };
export default function CompaniesPage() {
  return <main className={pageMain}><PageHeader title="Company research" label="Public sources" lede="What companies publish and what candidates report, kept separate and linked to the original evidence." /><CompanyCards introduction={false} /></main>;
}
