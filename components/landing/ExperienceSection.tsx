import Link from "next/link";
import { type ExperienceSnapshot, getExperienceSnapshot } from "@/lib/data/landing";
import { authorLabel } from "@/lib/format";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { ArrowLink, GlowFrame, PaperCard, SampleTag, SECTION_SPACE, SectionHeading, StatusPill } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "experiences-title";
const GLOW = { x: "58%", y: "40%" };
const ROW = "grid items-start gap-10 md:gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center lg:gap-14";
const PANEL = "p-6 sm:p-8 md:px-14 md:py-16";
// The cards run past the frame's right edge and are cropped by it. Cards on
// that edge carry the same extra right padding, so only padding is cropped.
const BLEED = "-mr-12 sm:-mr-14 md:-mr-[96px]";
const EDGE_PAD = "pr-[44px] md:pr-[64px]";

function Copy() {
  return (
    <div className="max-w-[640px] text-pretty lg:pt-4">
      <SectionHeading id={HEADING_ID}>What seniors were actually asked.</SectionHeading>
      <p data-rise className="mt-5 type-body text-ink-muted md:mt-6">
        Placed seniors&rsquo; write-ups, counted only once a project admin verifies them.
      </p>
      <div data-rise className="mt-7">
        <ArrowLink href="/experiences">Read the verified experiences</ArrowLink>
      </div>
    </div>
  );
}

export function ExperienceSectionFallback() {
  return (
    <section aria-labelledby={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <div className={ROW}>
        <Copy />
        <GlowFrame glow={GLOW} className={PANEL}>
          <PaperCard role="status" aria-label="Loading topic counts" className="h-[320px] opacity-90" />
        </GlowFrame>
      </div>
    </section>
  );
}

export async function ExperienceSection() {
  const snapshot = await getExperienceSnapshot(5);
  return (
    <Reveal variant="feature" labelledBy={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <div className={ROW}>
        <Copy />
        <GlowFrame glow={GLOW} className={PANEL}>
          <div className={`grid gap-3 md:gap-4 ${BLEED}`}>
            <TopicsCard snapshot={snapshot} />
            <div className={snapshot.featured ? "grid gap-3 md:grid-cols-2 md:gap-4" : "grid"}>
              {snapshot.featured && <FeaturedCard snapshot={snapshot} />}
              <TipCard snapshot={snapshot} />
            </div>
          </div>
        </GlowFrame>
      </div>
    </Reveal>
  );
}

function TopicsCard({ snapshot: { total, topTopics } }: { snapshot: ExperienceSnapshot }) {
  return (
    <PaperCard data-card className={`p-5 md:p-6 ${EDGE_PAD}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-[16px] font-medium tracking-[-0.01em]">
          {total > 0 ? (
            <>
              Most asked, across <span className="type-data">{total}</span> verified experience{total === 1 ? "" : "s"}
            </>
          ) : (
            "Most asked topics"
          )}
        </h3>
        {total > 0 && SEED_EXPERIENCES_ARE_SAMPLE && <SampleTag onPaper />}
      </div>

      {topTopics.length === 0 ? (
        <div className="mt-5 rounded-lg border border-paper-ink/15 px-4 py-6">
          <p className="text-[15px] font-medium">No verified experiences yet.</p>
          <p className="mt-1 type-small text-paper-ink/65">
            Topic counts appear here once a project admin verifies the first senior write-up.
          </p>
        </div>
      ) : (
        <ol className="mt-5 grid gap-4">
          {topTopics.map((t) => (
            <li key={t.id}>
              <div className="flex items-baseline justify-between gap-4 text-[15px]">
                <span className="min-w-0 truncate">{t.label}</span>
                <span className="shrink-0 text-[13px] text-paper-ink/65">
                  <span className="type-data">
                    {t.count} of {total}
                  </span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-ink/[0.08]">
                <div data-bar className="h-full rounded-full bg-paper-ink" style={{ width: `${Math.max(2, Math.round(t.share * 100))}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </PaperCard>
  );
}

function FeaturedCard({ snapshot: { featured: e } }: { snapshot: ExperienceSnapshot }) {
  if (!e) return null;
  const shown = e.topics.slice(0, 4);
  const more = e.topics.length - shown.length;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <PaperCard data-card className={`relative flex flex-col p-5 pr-[44px] md:pr-5`}>
      <div className="flex items-center justify-between gap-3">
        <StatusPill tone="verified" onPaper>
          Verified
        </StatusPill>
        <span
          className="text-[13px] text-paper-ink/65"
          title={`Recency ${pct(e.trust.recency)} · Corroboration ${pct(e.trust.corroboration)} · Completeness ${pct(e.trust.completeness)}`}
        >
          TrustScore{" "}
          <span className="type-data">
            <span className="text-[15px] font-medium text-paper-ink">{e.trust.score}</span>/100
          </span>
        </span>
      </div>
      <h3 className="mt-4 text-[17px] font-medium tracking-[-0.01em]">
        <Link href={`/experiences/${e.id}`} className="after:absolute after:inset-0 after:rounded-[inherit] hover:underline">
          {e.company} · {e.role}
        </Link>
      </h3>
      <p className="mt-1 type-small text-paper-ink/65">{authorLabel(e.author_role, e.grad_year)}</p>
      {shown.length > 0 && (
        <ul aria-label="Topics asked" className="mt-4 flex flex-wrap gap-1.5">
          {shown.map((t) => (
            <li key={t.id} className="inline-flex h-7 items-center rounded-full bg-paper-ink/[0.06] px-2.5 text-[13px]">
              {t.label}
            </li>
          ))}
          {more > 0 && <li className="inline-flex h-7 items-center px-1 text-[13px] text-paper-ink/60"><span className="type-data">+{more}</span>&nbsp;more</li>}
        </ul>
      )}
    </PaperCard>
  );
}

function TipCard({ snapshot: { tip } }: { snapshot: ExperienceSnapshot }) {
  return (
    <div data-card data-lane="unverified" className={`flex flex-col rounded-[var(--radius-card)] border border-dashed border-line bg-panel p-5 ${EDGE_PAD}`}>
      <div>
        <StatusPill tone="rumour">Rumour · unverified</StatusPill>
      </div>
      {tip ? (
        <>
          <p className="mt-4 type-small text-ink-muted">
            {tip.company} · {tip.role}
          </p>
          <blockquote className="mt-1.5 text-[17px] leading-snug text-ink">&ldquo;{tip.rounds_summary?.trim()}&rdquo;</blockquote>
          <p className="mt-auto pt-4 type-small text-ink-dim">Left out of every count until a project admin verifies it.</p>
        </>
      ) : (
        <p className="mt-4 type-small text-ink-muted">
          No unverified tips right now. When one comes in, it waits here, labelled as rumour, and stays out of every count.
        </p>
      )}
    </div>
  );
}
