import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrustScore } from "@/components/experiences/TrustScore";
import { VerifiedBadge } from "@/components/experiences/VerifiedBadge";
import { LoadingState } from "@/components/route-states";
import { isUuid } from "@/lib/data/drives";
import { getVerifiedExperience } from "@/lib/data/experiences";
import { authorLabel } from "@/lib/format";

// Verified experiences only: pending/rejected ids 404 here (they are only
// visible, anonymously, in the community-tips lane).
export default function ExperiencePage({ params }: PageProps<"/experiences/[id]">) {
  return (
    <main>
      <Suspense fallback={<LoadingState label="Loading experience…" />}>
        <Experience params={params} />
      </Suspense>
    </main>
  );
}

async function Experience({ params }: Pick<PageProps<"/experiences/[id]">, "params">) {
  const { id } = await params;
  const e = isUuid(id) ? await getVerifiedExperience(id) : null;
  if (!e) notFound();

  return (
    <article>
      <h1>{e.company} · {e.role}</h1>
      <p>{authorLabel(e.author_role, e.grad_year)}</p>
      <VerifiedBadge verifiedAt={e.verified_at} /> <TrustScore trust={e.trust} />
      <dl>
        <dt>Recency</dt><dd>{Math.round(e.trust.recency * 100)}%</dd>
        <dt>Corroborated by other {e.company} experiences</dt><dd>{Math.round(e.trust.corroboration * 100)}%</dd>
        <dt>Completeness</dt><dd>{Math.round(e.trust.completeness * 100)}%{e.has_evidence ? " (evidence on file)" : ""}</dd>
      </dl>

      <h2>Rounds</h2>
      <p>{e.rounds_summary ?? "Not provided."}</p>

      <h2>Preparation</h2>
      <p>{e.preparation_timeline ?? "Not provided."}</p>

      <h2>Topics asked</h2>
      {e.topics.length ? <ul>{e.topics.map((t) => <li key={t.id}>{t.label}</li>)}</ul> : <p>None tagged.</p>}

      <h2>Resources that helped</h2>
      {e.resources.length ? (
        <ul>
          {e.resources.map((r) => (
            <li key={r.id}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> ({r.type})</li>
          ))}
        </ul>
      ) : (
        <p>None listed.</p>
      )}
    </article>
  );
}
