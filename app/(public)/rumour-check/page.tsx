import { Suspense } from "react";
import { LoadingState } from "@/components/route-states";
import { ClaimForm } from "@/components/rumour/ClaimForm";
import { listCompanies, listTopics } from "@/lib/data/taxonomy";

export default function RumourCheckPage() {
  return (
    <main>
      <h1>Rumour check</h1>
      <p>
        Heard that a company &ldquo;only asks DP&rdquo;? Check it against verified senior experiences. The verdict is
        a fixed rule over the data, with every supporting experience cited.
      </p>
      <Suspense fallback={<LoadingState label="Loading…" />}>
        <Claim />
      </Suspense>
    </main>
  );
}

async function Claim() {
  const [companies, topics] = await Promise.all([listCompanies(), listTopics()]);
  return <ClaimForm companies={companies} topics={topics} />;
}
