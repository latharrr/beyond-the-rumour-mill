import { CompanyCards } from "@/components/research/CompanyCards";
import type { Metadata } from "next";
import { Suspense } from "react";
import { checkClaim } from "@/app/_actions/rumour";
import { SampleTag } from "@/components/ui/status";
import { card, PageHeader, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { ClaimForm } from "@/components/rumour/ClaimForm";
import { listCompanies, listTopics } from "@/lib/data/taxonomy";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { claimSchema } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Rumour check: does a company really ask that topic?",
  description:
    "Check a placement rumour like \u201cTCS heavily asks DP\u201d against verified senior experiences. A fixed rule gives Supported, Mixed evidence or Not supported, and cites every experience it counted.",
  alternates: { canonical: "/rumour-check" },
};

export default function RumourCheckPage({ searchParams }: PageProps<"/rumour-check">) {
  return (
    <main className={cn(pageMain, "pb-16 md:pb-24")}>
      <PageHeader
        label="Rumour check"
        title="Heard something? Check it."
        lede={
          <>
            Heard that a company &ldquo;only asks DP&rdquo;? Check it against verified senior experiences. The verdict is a
            fixed rule over the data, with every supporting experience cited.
            {SEED_EXPERIENCES_ARE_SAMPLE && (
              <span className="mt-4 flex">
                <SampleTag />
              </span>
            )}
          </>
        }
      />
      <CompanyCards compact />
      <Suspense fallback={<div role="status" aria-label="Loading" className={cn(card, "h-[520px] lg:w-5/12")} />}>
        <Claim searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

// ?company_id=&topic_id= (e.g. from the landing page's claim bar) arrives already checked.
async function Claim({ searchParams }: Pick<PageProps<"/rumour-check">, "searchParams">) {
  const { company_id, topic_id } = await searchParams;
  const [companies, topics] = await Promise.all([listCompanies(), listTopics()]);
  const claim = claimSchema.safeParse({ company_id, topic_id });
  if (!claim.success) return <ClaimForm companies={companies} topics={topics} />;

  const form = new FormData();
  form.set("company_id", claim.data.company_id);
  form.set("topic_id", claim.data.topic_id);
  const initial = await checkClaim(null, form);
  return (
    <ClaimForm
      companies={companies}
      topics={topics}
      initial={initial}
      defaultCompanyId={claim.data.company_id}
      defaultTopicId={claim.data.topic_id}
    />
  );
}
