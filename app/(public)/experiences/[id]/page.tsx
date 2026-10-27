import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { TrustScore } from "@/components/experiences/TrustScore";
import { VerifiedBadge } from "@/components/experiences/VerifiedBadge";
import { BackLink, ResourceLink } from "@/components/ui/pill";
import { Chip, SampleTag } from "@/components/ui/status";
import { card, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { isUuid } from "@/lib/data/drives";
import { getVerifiedExperience } from "@/lib/data/experiences";
import { authorLabel } from "@/lib/format";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { COMPLETENESS_FIELDS } from "@/lib/trust";

// Verified experiences only: pending/rejected ids 404 here (they are only
// visible, anonymously, in the community-tips lane).
export default function ExperiencePage({ params }: PageProps<"/experiences/[id]">) {
  return (
    <main className={pageMain}>
      <BackLink href="/experiences">All experiences</BackLink>
      <Suspense fallback={<div role="status" aria-label="Loading experience" className={cn(card, "mt-8 h-[480px]")} />}>
        <Experience params={params} />
      </Suspense>
    </main>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line py-8 md:py-10">
      <h2 id={id} className="type-label text-ink-dim">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const prose = "max-w-[68ch] type-body whitespace-pre-line text-pretty text-ink";
const missing = "type-body text-ink-dim";

async function Experience({ params }: Pick<PageProps<"/experiences/[id]">, "params">) {
  const { id } = await params;
  const e = isUuid(id) ? await getVerifiedExperience(id) : null;
  if (!e) notFound();

  const filled = Math.round(e.trust.completeness * COMPLETENESS_FIELDS);
  const factors: { label: string; weight: string; value: number; note: ReactNode }[] = [
    { label: "Recency", weight: "40%", value: e.trust.recency, note: "Fades over the year after it was submitted." },
    {
      label: "Corroboration",
      weight: "40%",
      value: e.trust.corroboration,
      note: `Share of the other verified ${e.company} experiences that report at least one of the same topics.`,
    },
    {
      label: "Completeness",
      weight: "20%",
      value: e.trust.completeness,
      note: (
        <>
          <span className="type-data">
            {filled} of {COMPLETENESS_FIELDS}
          </span>{" "}
          filled in: rounds, preparation, two or more topics, a resource, evidence{e.has_evidence ? " (on file, never public)" : ""}.
        </>
      ),
    },
  ];

  return (
    <article className="pb-16 md:pb-24">
      <header className="pt-8 pb-10 md:pt-10 md:pb-14">
        <div className="flex flex-wrap items-center gap-3">
          <VerifiedBadge verifiedAt={e.verified_at} long />
          {SEED_EXPERIENCES_ARE_SAMPLE && <SampleTag />}
        </div>
        <h1 className="mt-5 max-w-[20ch] type-section text-balance text-ink">
          {e.company} · {e.role}
        </h1>
        <p className="mt-4 type-body text-ink-muted">{authorLabel(e.author_role, e.grad_year)}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-14">
        <div>
          <Block id="rounds" title="Rounds">
            {e.rounds_summary ? <p className={prose}>{e.rounds_summary}</p> : <p className={missing}>Not provided.</p>}
          </Block>
          <Block id="preparation" title="Preparation">
            {e.preparation_timeline ? <p className={prose}>{e.preparation_timeline}</p> : <p className={missing}>Not provided.</p>}
          </Block>
          <Block id="topics" title="Topics asked">
            {e.topics.length ? (
              <ul className="flex flex-wrap gap-2">
                {e.topics.map((t) => (
                  <li key={t.id}>
                    <Chip className="h-8 px-3 text-[14px]">{t.label}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={missing}>None tagged.</p>
            )}
          </Block>
          <Block id="resources" title="Resources that helped">
            {e.resources.length ? (
              <ul className="grid gap-1">
                {e.resources.map((r) => (
                  <li key={r.id}>
                    <ResourceLink href={r.url} title={r.title} type={r.type} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={missing}>None listed.</p>
            )}
          </Block>
        </div>

        <aside aria-labelledby="trust" className="lg:pt-8">
          <section className={cn(card, "p-5 md:p-6 lg:sticky lg:top-24")}>
            <h2 id="trust" className="type-label text-ink-dim">
              Why this TrustScore
            </h2>
            <p className="mt-4">
              <TrustScore trust={e.trust} className="text-[15px]" />
            </p>
            <dl className="mt-6 grid gap-5">
              {factors.map((f) => (
                <div key={f.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[15px] text-ink">
                      {f.label} <span className="type-small text-ink-dim">· weight <span className="type-data">{f.weight}</span></span>
                    </dt>
                    <dd className="type-data text-[15px] text-ink">{Math.round(f.value * 100)}%</dd>
                  </div>
                  <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(2, Math.round(f.value * 100))}%` }} />
                  </div>
                  <p className="mt-1.5 type-small text-ink-dim">{f.note}</p>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </article>
  );
}
