import research from '@/data/company-research.json';

export const researchChecked = research.checked;
export const companyResearch = research.companies;
export type ResearchedCompany = (typeof companyResearch)[number];
export const researchStatus = (c: ResearchedCompany) => c.status === 'closed' ? 'Closed / past cycle' : c.status === 'open_posting' ? 'Public job posting' : (c.status === 'closed_or_unverified' || c.slug === 'google') ? 'Unavailable / not confirmed' : (c.status === 'listed' || c.slug === 'amazon' || c.slug === 'hcltech') ? 'Program or listing, confirm status' : 'Career route, no open drive confirmed';
export const getCompanyResearch = (slug: string) => companyResearch.find(c => c.slug === slug);
