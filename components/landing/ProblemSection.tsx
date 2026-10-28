import { SECTION_SPACE, SectionHeading } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "problem-title";

/** The story's first beat: why the rest of the page exists. Static copy, no data. */
export function ProblemSection() {
  return (
    <Reveal variant="close" labelledBy={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14">
        <SectionHeading id={HEADING_ID} className="max-w-[12ch]">
          Right now, prep runs on who you know.
        </SectionHeading>
        <p data-rise className="max-w-[44ch] type-body text-ink-muted md:pt-2">
          Prep runs on rumours, senior networks and scattered resources, so students without strong networks start every drive
          behind.
        </p>
      </div>
    </Reveal>
  );
}
