import { CompanyCards } from "@/components/research/CompanyCards";
import type { Metadata } from "next";
import { Suspense } from "react";
import { checkClaims } from "@/app/_actions/rumour";
import { card, PageHeader, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { ClaimForm } from "@/components/rumour/ClaimForm";
import { listCompanies, listTopics } from "@/lib/taxonomy";
import { claimsSchema } from "@/lib/validation";

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

          </>
        }
      />
      <Suspense fallback={<div role="status" aria-label="Loading" className={cn(card, "h-[520px] lg:w-5/12")} />}>
        <Claim searchParams={searchParams} />
      </Suspense>
      <CompanyCards compact />
    </main>
  );
}

// ?company_id=&topic_id=&topic_id= (e.g. from the landing page's claim bar) arrives already checked.
async function Claim({ searchParams }: Pick<PageProps<"/rumour-check">, "searchParams">) {
  const { company_id, topic_id } = await searchParams;
  const [companies, topics] = await Promise.all([listCompanies(), listTopics()]);
  const topicIds = topic_id === undefined ? [] : Array.isArray(topic_id) ? topic_id : [topic_id];
  const claim = claimsSchema.safeParse({ company_id, topic_ids: topicIds });
  if (!claim.success) return <ClaimForm companies={companies} topics={topics} />;

  const form = new FormData();
  form.set("company_id", claim.data.company_id);
  for (const id of claim.data.topic_ids) form.append("topic_id", id);
  const initial = await checkClaims(null, form);
  return (
    <ClaimForm
      companies={companies}
      topics={topics}
      initial={initial}
      defaultCompanyId={claim.data.company_id}
      defaultTopicIds={claim.data.topic_ids}
    />
  );
}
