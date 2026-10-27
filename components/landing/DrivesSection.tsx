import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { type LandingDrive, listUpcomingDrives } from "@/lib/data/landing";
import { daysUntil, formatCgpa, formatDriveDate } from "@/lib/format";
import { SEED_DRIVES_ARE_SAMPLE } from "@/lib/sample-data";
import { PillLink, SampleTag, SECTION_SPACE, SectionHeading } from "./parts";
import { Reveal } from "./Reveal";

const HEADING_ID = "drives-title";
// Card footprint shared by the real cards and the loading placeholders.
const CARD = "relative flex min-h-[292px] flex-col rounded-[var(--radius-card)] border border-line bg-panel p-6";

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

function DriveCard({ drive: d, now }: { drive: LandingDrive; now: Date }) {
  const days = d.drive_date ? daysUntil(d.drive_date, now) : null;
  const when =
    days === null ? null : days === 0 ? "Today" : days > 0 ? (
      <>
        In <span className="type-data">{days}</span> day{days === 1 ? "" : "s"}
      </>
    ) : (
      "Date passed"
    );
  const titleId = `drive-${d.id}`;
  return (
    <article
      aria-labelledby={titleId}
      className={`${CARD} group h-full transition-colors duration-200 has-[a:hover]:border-white/16 has-[a:hover]:bg-panel-2`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="type-label text-ink-muted">{d.company.name}</span>
        <span className="type-label text-ink-dim">{d.status === "ongoing" ? "Ongoing" : "Upcoming"}</span>
      </div>

      <h3 id={titleId} className="mt-5 type-title text-ink">
        {/* The whole card is this link's hit area. */}
        <Link href={`/drives/${d.id}`} className="after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-amber">
          {d.title}
        </Link>
      </h3>
      <p className="mt-1.5 type-small text-ink-muted">
        {d.role.label}
        {d.location && <> · {d.location}</>}
      </p>

      <p className="mt-5 flex items-baseline gap-2.5">
        {d.drive_date ? (
          <>
            <time dateTime={d.drive_date} className="type-data text-[17px] text-ink">
              {formatDriveDate(d.drive_date)}
            </time>
            <span className="type-small text-ink-dim">{when}</span>
          </>
        ) : (
          <span className="type-small text-ink-muted">Date to be announced</span>
        )}
      </p>

      <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-4">
        <Spec label="CGPA" value={d.eligibility_cgpa === null ? "Any" : `${formatCgpa(d.eligibility_cgpa)}+`} numeric={d.eligibility_cgpa !== null} />
        <Spec
          label="Backlogs"
          value={
            d.max_backlogs <= 0 ? (
              "None"
            ) : (
              <>
                Up to <span className="type-data">{d.max_backlogs}</span>
              </>
            )
          }
        />
        <Spec label="Rounds" value={String(d.round_count)} numeric />
      </dl>
    </article>
  );
}

function Spec({ label, value, numeric = false }: { label: string; value: ReactNode; numeric?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="type-label text-ink-dim">{label}</dt>
      <dd className={`mt-2 text-[15px] text-ink ${numeric ? "type-data" : ""}`}>{value}</dd>
    </div>
  );
}
