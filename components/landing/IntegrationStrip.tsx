import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { getPlanPreview, type PlanPreview } from "@/lib/data/landing";
import { formatCgpa } from "@/lib/format";
import { SEED_EXPERIENCES_ARE_SAMPLE } from "@/lib/sample-data";
import { SampleTag, SECTION_SPACE, SectionHeading } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "chain-title";
const STRIP = "mt-10 grid rounded-[var(--radius-card)] border border-line bg-panel md:mt-12 lg:min-h-[188px] lg:grid-cols-3";

function Intro() {
  return (
    <>
      <SectionHeading id={HEADING_ID}>Requirement in, plan out.</SectionHeading>
      <p data-rise className="mt-5 max-w-[58ch] type-body text-ink-muted md:mt-6">
        The three parts work as one chain. Here it is for the next drive on the list, with today&rsquo;s numbers.
      </p>
    </>
  );
}

export function IntegrationStripFallback() {
  return (
    <section aria-labelledby={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <Intro />
      <div role="status" aria-label="Loading the chain" className={`${STRIP} min-h-[420px]`} />
    </section>
  );
}

type Step = { name: string; value: ReactNode; detail: ReactNode };

function stepsFor(p: PlanPreview | null): Step[] {
  if (!p) {
    return [
      { name: "Drive requirement", value: "No open drive yet", detail: "Eligibility and rounds come from the drive listing." },
      { name: "Experiences and resources", value: "Waiting on a drive", detail: "Matched by company and role once one is listed." },
      { name: "Your plan", value: "Nothing to plan yet", detail: "Weeks are counted back from the drive date." },
    ];
  }
  const d = p.drive;
  const rules = (
    <>
      <Count n={d.rounds} noun="round" /> · CGPA {d.cgpa === null ? "no cut-off" : <span className="type-data">{formatCgpa(d.cgpa)}+</span>} · backlogs:{" "}
      {d.max_backlogs <= 0 ? (
        "none allowed"
      ) : (
        <>
          up to <span className="type-data">{d.max_backlogs}</span>
        </>
      )}
    </>
  );
  const evidence: Step =
    p.scope === "rounds"
      ? {
          name: "Experiences and resources",
          value: "No verified experiences yet",
          detail: (
            <>
              Falls back to the <Count n={p.total} noun="topic" /> listed in the drive&rsquo;s rounds · <Count n={p.resources} noun="resource" />
            </>
          ),
        }
      : {
          name: "Experiences and resources",
          value: <Count n={p.experiences} noun="verified experience" />,
          detail: (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span>
                <Count n={p.total} noun="topic" /> weighted · <Count n={p.resources} noun="resource" /> attached
              </span>
              {SEED_EXPERIENCES_ARE_SAMPLE && <SampleTag />}
            </span>
          ),
        };
  return [
    { name: "Drive requirement", value: d.title, detail: rules },
    evidence,
    p.total > 0
      ? {
          name: "Your plan",
          value: (
            <>
              <span className="type-data">{p.weeks.length}</span>-week plan
            </>
          ),
          detail: (
            <>
              <Count n={p.total} noun="checklist item" /> · <span className="type-data whitespace-nowrap">0 of {p.total}</span> done · exports to Markdown
            </>
          ),
        }
      : { name: "Your plan", value: "No plan yet", detail: "Needs verified experiences or round topics first." },
  ];
}

/** "12 topics": the figure in Geist Mono, the noun in Geist. */
function Count({ n, noun }: { n: number; noun: string }) {
  return (
    <>
      <span className="type-data">{n}</span> {n === 1 ? noun : `${noun}s`}
    </>
  );
}

export async function IntegrationStrip() {
  const preview = await getPlanPreview();
  const steps = stepsFor(preview);
  return (
    <Reveal variant="sequence" labelledBy={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <Intro />
      <ol className={STRIP}>
        {steps.map((s, i) => (
          <li
            key={s.name}
            data-step
            className="relative flex flex-col p-6 not-last:border-b not-last:border-line md:p-7 lg:not-last:border-r lg:not-last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line type-data text-[13px] text-ink">
                {i + 1}
              </span>
              <span className="type-small text-ink-muted">{s.name}</span>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="ml-auto hidden items-center text-ink-dim lg:flex">
                  <span data-link className="block h-px w-10 bg-ink-dim/60 lg:w-16" />
                  <ArrowRightIcon className="-ml-1.5 size-4" />
                </span>
              )}
            </div>
            <p className="mt-6 type-title text-ink md:mt-8">{s.value}</p>
            <p className="mt-2 type-small text-ink-muted">{s.detail}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
