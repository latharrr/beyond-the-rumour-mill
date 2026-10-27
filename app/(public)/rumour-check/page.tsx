import { Suspense } from "react";
import { checkClaim } from "@/app/_actions/rumour";
import { LoadingState } from "@/components/route-states";
import { ClaimForm } from "@/components/rumour/ClaimForm";
import { listCompanies, listTopics } from "@/lib/data/taxonomy";
import { claimSchema } from "@/lib/schemas";

export default function RumourCheckPage({ searchParams }: PageProps<"/rumour-check">) {
  return (
    <main>
      <h1>Rumour check</h1>
      <p>
        Heard that a company &ldquo;only asks DP&rdquo;? Check it against verified senior experiences. The verdict is
        a fixed rule over the data, with every supporting experience cited.
      </p>
      <Suspense fallback={<LoadingState label="Loading…" />}>
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
