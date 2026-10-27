import { DRIVE_CARD as CARD, DriveCard } from "@/components/drives/DriveCard";
import { ArrowRightIcon } from "@/components/icons";
import { listUpcomingDrives } from "@/lib/data/landing";
import { SEED_DRIVES_ARE_SAMPLE } from "@/lib/sample-data";
import { PillLink, SampleTag, SECTION_SPACE, SectionHeading } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "drives-title";

function Intro() {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
      <div>
        <SectionHeading id={HEADING_ID} className="max-w-[16ch]">
          Every drive, rules up front.
        </SectionHeading>
        <p data-rise className="mt-5 max-w-[58ch] type-body text-ink-muted md:mt-6">
          Rules and rounds for every drive, checked against your profile once you sign in.
        </p>
      </div>
      <div data-rise>
        <PillLink href="/drives">
          Browse all drives
          <ArrowRightIcon className="size-4" />
        </PillLink>
      </div>
    </div>
  );
}

export function DrivesSectionFallback() {
  return (
    <section aria-labelledby={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <Intro />
      {/* Holds the Sample data tag's place so the cards land where they will stay. */}
      {SEED_DRIVES_ARE_SAMPLE && <div aria-hidden="true" className="mt-10 h-6 md:mt-12" />}
      <ul role="status" aria-label="Loading upcoming drives" className={`${SEED_DRIVES_ARE_SAMPLE ? "mt-4" : "mt-10 md:mt-12"} grid gap-4 md:gap-5 lg:grid-cols-3`}>
        {[0, 1, 2].map((i) => (
          <li key={i} className={CARD} aria-hidden="true">
            <span className="h-3 w-16 rounded-full bg-panel-2" />
            <span className="mt-5 h-5 w-4/5 rounded-full bg-panel-2" />
            <span className="mt-3 h-4 w-1/2 rounded-full bg-panel-2" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function DrivesSection() {
  const { drives, now } = await listUpcomingDrives(3);
  return (
    <Reveal variant="cards" labelledBy={HEADING_ID} className={`container-page ${SECTION_SPACE}`}>
      <Intro />
      {drives.length === 0 ? (
        <div data-card className="mt-10 rounded-[var(--radius-card)] border border-line bg-panel p-6 md:mt-12 md:p-8">
          <p className="type-title text-ink">No upcoming drives are listed yet.</p>
          <p className="mt-2 max-w-[60ch] type-body text-ink-muted">
            Drives appear here, with their eligibility rules and rounds, as soon as they&rsquo;re announced. Past drives stay
            on the drives page.
          </p>
        </div>
      ) : (
        <>
          {SEED_DRIVES_ARE_SAMPLE && (
            <div data-rise className="mt-10 md:mt-12">
              <SampleTag />
            </div>
          )}
          <ul className={`${SEED_DRIVES_ARE_SAMPLE ? "mt-4" : "mt-10 md:mt-12"} grid gap-4 md:gap-5 lg:grid-cols-3`}>
          {drives.map((d) => (
            <li key={d.id} data-card>
              <DriveCard drive={d} now={now} />
            </li>
          ))}
          </ul>
        </>
      )}
    </Reveal>
  );
}
