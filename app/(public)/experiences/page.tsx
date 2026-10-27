import Link from "next/link";
import { Suspense } from "react";
import { CommunityTipsLane } from "@/components/experiences/CommunityTipsLane";
import { ExperienceCard } from "@/components/experiences/ExperienceCard";
import { TopicFrequencyBars } from "@/components/experiences/TopicFrequencyBars";
import { LoadingState } from "@/components/route-states";
import { isUuid } from "@/lib/data/drives";
import { listCommunityTips, listVerifiedExperiences } from "@/lib/data/experiences";
import { listCompanies } from "@/lib/data/taxonomy";

// §3.2: verified experiences (with TrustScore) and the quarantined
// community-tips lane, visually separate sections.
export default function ExperiencesPage({ searchParams }: PageProps<"/experiences">) {
  return (
    <main>
      <h1>Experiences</h1>
      <p><Link href="/experiences/new">Share your placement experience</Link></p>
      <Suspense fallback={<LoadingState label="Loading experiences…" />}>
        <Experiences searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Experiences({ searchParams }: Pick<PageProps<"/experiences">, "searchParams">) {
  const { company } = await searchParams;
  const companyId = typeof company === "string" && isUuid(company) ? company : undefined;
  const [{ experiences, frequency }, tips, companies] = await Promise.all([
    listVerifiedExperiences({ companyId }),
    listCommunityTips({ companyId }),
    listCompanies(),
  ]);

  return (
    <>
      <form method="get" action="/experiences" role="search">
        <label htmlFor="company">Company</label>
        <select id="company" name="company" defaultValue={companyId ?? ""}>
          <option value="">All companies</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit">Filter</button>
      </form>

      <section aria-labelledby="topic-frequency">
        <h2 id="topic-frequency">What gets asked</h2>
        <TopicFrequencyBars frequency={frequency} total={experiences.length} />
      </section>

      <section aria-labelledby="verified">
        <h2 id="verified">Verified experiences</h2>
        {experiences.length === 0 ? (
          <p>No verified experiences yet{companyId ? " for this company" : ""}.</p>
        ) : (
          <ul>
            {experiences.map((e) => (
              <li key={e.id}><ExperienceCard experience={e} /></li>
            ))}
          </ul>
        )}
      </section>

      <CommunityTipsLane tips={tips} />
    </>
  );
}
