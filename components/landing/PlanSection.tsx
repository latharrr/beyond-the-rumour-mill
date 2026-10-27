import { getPlanPreview, type PlanPreview, type PreviewResource } from "@/lib/data/landing";
import { formatDriveDate } from "@/lib/format";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { ArrowLink, GlowFrame, PaperCard, SampleTag, SECTION_SPACE, SectionHeading } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "plan-title";
const GLOW = { x: "42%", y: "58%" };
const ROW = "grid items-start gap-10 md:gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-14";
// The card runs past the frame's bottom edge and is cropped by it; its extra
// bottom padding is all that gets cut.
const PANEL = "px-6 pt-6 sm:px-8 sm:pt-8 md:px-14 md:pt-16 lg:order-first";
// The first week is shown item by item; later weeks collapse to one summary row each.
const FIRST_WEEK_ITEMS = 4;
const COLLAPSED_WEEKS = 3;

function Copy({ preview }: { preview: PlanPreview | null | undefined }) {
  return (
    <div className="max-w-[640px] text-pretty lg:pt-4">
      <SectionHeading id={HEADING_ID}>A plan dated to your drive.</SectionHeading>
      <p data-rise className="mt-5 type-body text-ink-muted md:mt-6">
        A week-by-week checklist counted back from the drive date, with resources and a Markdown export.
      </p>
      <div data-rise className="mt-7">
        {preview ? (
          <>
            <ArrowLink href={`/drives/${preview.drive.id}`}>Generate yours on the {preview.drive.company} drive page</ArrowLink>
            <p className="mt-1.5 type-small text-ink-dim">Saving a plan needs you to sign in.</p>
          </>
        ) : (
          preview === null && <ArrowLink href="/drives">Browse all drives</ArrowLink>
        )}
      </div>
    </div>
  );
}

export function PlanSectionFallback() {
  return (
    <section aria-labelledby={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <div className={ROW}>
        <Copy preview={undefined} />
        <GlowFrame glow={GLOW} className={PANEL}>
          <PaperCard role="status" aria-label="Loading the plan preview" className="h-[560px] opacity-90" />
        </GlowFrame>
      </div>
    </section>
  );
}

export async function PlanSection() {
  const preview = await getPlanPreview();
  return (
    <Reveal variant="plan" labelledBy={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <div className={ROW}>
        <Copy preview={preview} />
        <GlowFrame glow={GLOW} className={PANEL}>
          <PaperCard data-card className="-mb-6 p-5 pb-11 md:-mb-8 md:p-6 md:pb-14">
            {preview ? <PlanPreviewCard preview={preview} /> : <Empty title="No upcoming drive to plan against yet." body="When a drive is listed, a live preview of its plan shows up here." />}
          </PaperCard>
        </GlowFrame>
      </div>
    </Reveal>
  );
}

/** Sets each "n of N" count phrase in the engine's reason line in Geist Mono. */
function withCounts(text: string) {
  return text.split(/(\d+ of \d+)/).map((part, i) => (i % 2 ? <span key={i} className="type-data">{part}</span> : part));
}

const TYPE_LABEL: Record<string, string> = { video: "Video", article: "Article", course: "Course", book: "Book" };

/** The item's first resource as a real link, or an honest note when none is attached. */
function ItemResource({ resources }: { resources: PreviewResource[] }) {
  const [r, ...rest] = resources;
  if (!r) return <span className="mt-1 block text-[13px] text-paper-ink/50">No resource linked yet</span>;
  return (
    <span className="mt-1 block text-[13px] leading-[1.5]">
      <span className="mr-2 inline-flex h-5 items-center rounded-full border border-paper-ink/15 px-2 align-[1px] text-[11px] font-medium tracking-[0.04em] text-paper-ink/70 uppercase">
        {TYPE_LABEL[r.type] ?? r.type}
      </span>
      {/* Vertical padding on an inline link grows its tap area to 44px without moving the line. */}
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="py-1 font-medium text-paper-ink underline decoration-paper-ink/25 underline-offset-[3px] hover:decoration-paper-ink"
      >
        {r.title}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {rest.length > 0 && (
        <span className="ml-2 whitespace-nowrap text-paper-ink/55">
          <span className="type-data">+{rest.length}</span> more
        </span>
      )}
    </span>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-paper-ink/15 px-4 py-6">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="mt-1 type-small text-paper-ink/65">{body}</p>
    </div>
  );
}

function PlanPreviewCard({ preview: p }: { preview: PlanPreview }) {
  const [first, ...rest] = p.weeks;
  const later = rest.slice(0, COLLAPSED_WEEKS);
  const hiddenWeeks = rest.length - later.length;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-medium tracking-[-0.01em]">{p.drive.title}</h3>
          <p className="mt-1 type-small text-paper-ink/65">
            {p.drive.drive_date ? (
              <>
                Drive on{" "}
                <time dateTime={p.drive.drive_date} className="type-data">
                  {formatDriveDate(p.drive.drive_date)}
                </time>
              </>
            ) : (
              "Date to be announced"
            )}
            {p.weeks.length > 0 && (
              <>
                {" "}
                · <span className="type-data">{p.weeks.length}</span>-week plan
              </>
            )}
          </p>
        </div>
        {p.total > 0 && (
          <div className="w-full shrink-0 sm:w-[132px]">
            <p className="text-[13px] text-paper-ink/70 sm:text-right">
              <span className="type-data">0 of {p.total}</span> done
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-paper-ink/[0.08]" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-paper-ink/10 pt-4 type-small text-paper-ink/70">
        {p.scope === "rounds" ? (
          <span>
            No verified experiences for {p.drive.company} yet, so this preview uses the topics listed in the drive&rsquo;s rounds.
          </span>
        ) : (
          <>
            <span>
              Built from <span className="type-data">{p.experiences}</span> verified {p.scope === "role" ? p.drive.role : p.drive.company}{" "}
              experience{p.experiences === 1 ? "" : "s"}
            </span>
            {SEED_EXPERIENCES_ARE_SAMPLE && <SampleTag onPaper />}
          </>
        )}
      </div>

      {p.total === 0 ? (
        <div className="mt-5">
          <Empty
            title="Not enough data for a plan yet."
            body="This drive has no verified experiences and no topics listed in its rounds."
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4">
          {first && (
            <section aria-label={`Week ${first.week}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="type-label text-paper-ink">
                  Week <span className="type-data">{first.week}</span>
                </h4>
                <span className="text-[12px] text-paper-ink/55">
                  <span className="type-data">{first.items.length}</span> item{first.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ol className="mt-2 divide-y divide-paper-ink/[0.08] rounded-lg border border-paper-ink/10">
                {first.items.slice(0, FIRST_WEEK_ITEMS).map((item) => (
                  <li key={item.topicId} data-item className="flex items-start gap-3 px-3 py-2.5 md:px-4">
                    <span aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 rounded-[5px] border-[1.5px] border-paper-ink/35" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
                        <span className="text-[15px] font-medium">{item.topic}</span>
                        {item.why && <span className="min-w-0 text-[13px] leading-snug text-paper-ink/60">{withCounts(item.why)}</span>}
                      </span>
                      <ItemResource resources={item.resources} />
                    </span>
                  </li>
                ))}
                {first.items.length > FIRST_WEEK_ITEMS && (
                  <li data-item className="px-3 py-2 text-[13px] text-paper-ink/60 md:px-4">
                    <span className="type-data">+{first.items.length - FIRST_WEEK_ITEMS}</span> more this week
                  </li>
                )}
              </ol>
            </section>
          )}
          {later.length > 0 && (
            <ol aria-label="Later weeks" className="divide-y divide-paper-ink/[0.08] rounded-lg border border-paper-ink/10">
              {later.map(({ week, items }) => (
                <li key={week} data-item className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-3 py-2.5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] md:px-4">
                  <span className="pt-[3px] type-label text-paper-ink">
                    Week <span className="type-data">{week}</span>
                  </span>
                  <span className="col-span-2 row-start-2 text-[14px] leading-snug text-paper-ink/70 sm:col-span-1 sm:col-start-2 sm:row-start-1">{items.map((i) => i.topic).join(", ")}</span>
                  <span className="col-start-2 row-start-1 pt-px text-[12px] text-paper-ink/55 sm:col-start-3">
                    <span className="type-data">{items.length}</span> item{items.length === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {hiddenWeeks > 0 && <p className="type-small text-paper-ink/60"><span className="type-data">+{hiddenWeeks}</span> more week{hiddenWeeks === 1 ? "" : "s"} in the full plan</p>}
        </div>
      )}

      <p className="mt-5 type-small text-paper-ink/55">Computed live for this preview. Nothing is saved until you generate your own.</p>
    </>
  );
}
