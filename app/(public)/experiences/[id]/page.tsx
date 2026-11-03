import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense, type ReactNode } from "react";
import { VerifiedBadge } from "@/components/experiences/VerifiedBadge";
import { BackLink, ResourceLink } from "@/components/ui/pill";
import { Chip, SampleTag } from "@/components/ui/status";
import { card, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { isUuid } from "@/lib/placement/data";
import { getVerifiedExperience } from "@/lib/experiences/data";
import { breadcrumbs, jsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";
import { authorLabel } from "@/lib/format";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";

// Verified experiences only: pending/rejected ids 404 here (they are only
// visible, anonymously, in the community-tips lane).
// One fetch per request, shared by the metadata and the page.
const getExperience = cache((id: string) => (isUuid(id) ? getVerifiedExperience(id) : Promise.resolve(null)));

export async function generateMetadata({ params }: PageProps<"/experiences/[id]">): Promise<Metadata> {
  const { id } = await params;
  const e = await getExperience(id);
  if (!e) return { title: "Experience not found", robots: { index: false } };
  const topics = e.topics.slice(0, 5).map((t) => t.label).join(", ");
  return {
    title: `${e.company} ${e.role} interview experience`,
    description: `A verified ${e.company} ${e.role} placement experience (${authorLabel(e.author_role, e.grad_year)}): rounds, preparation${topics ? ` and topics asked, including ${topics}` : ""}.`,
    alternates: { canonical: `/experiences/${e.id}` },
    openGraph: { type: "article", url: `/experiences/${e.id}` },
  };
}

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
  const e = await getExperience(id);
  if (!e) notFound();

  return (
    <article className="pb-16 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbs([
              ["Home", absoluteUrl("/")],
              ["Experiences", absoluteUrl("/experiences")],
              [`${e.company} · ${e.role}`, absoluteUrl(`/experiences/${e.id}`)],
            ]),
          ),
        }}
      />
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

      <div>
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

      </div>
    </article>
  );
}
