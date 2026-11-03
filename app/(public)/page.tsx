import type { Metadata } from "next";
import { Suspense } from "react";
import { DRIVE_CARD, DriveCard } from "@/components/drives/DriveCard";
import { ArrowLink, PillLink } from "@/components/ui/pill";
import { SampleTag } from "@/components/ui/status";
import { card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { listDrives, withRoundCounts } from "@/lib/placement/data";
import { SEED_DRIVES_ARE_SAMPLE } from "@/lib/sample-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// The three P08 modules, rendered from data with .map() (one reusable card shape).
const MODULES = [
  {
    step: "1",
    title: "Placement information",
    body: "Every campus drive with its eligibility rules, role, date and rounds. Sign in and each drive tells you whether you qualify, and why not.",
    href: "/drives",
    link: "Browse drives",
  },
  {
    step: "2",
    title: "Experience repository",
    body: "Interview experiences from placed seniors. Only ones a placement-cell admin has verified count; unverified tips stay labelled as rumours.",
    href: "/experiences",
    link: "Read experiences",
  },
  {
    step: "3",
    title: "Your preparation plan",
    body: "Pick a drive and get a week-by-week checklist built from what verified seniors were asked, with resources. Tick items off and track progress.",
    href: "/dashboard",
    link: "Open your dashboard",
  },
] as const;

export default function HomePage() {
  return (
    <main className="container-page pb-20 md:pb-28">
      <section aria-labelledby="hero-title" className="pt-12 pb-14 md:pt-20 md:pb-20">
        <p className="type-label text-ink-dim">Placement prep for LPU students</p>
        <h1 id="hero-title" className="mt-5 max-w-[16ch] type-section text-balance text-ink md:text-[64px] md:leading-[1.05]">
          Prepare from evidence, not hostel rumours.
        </h1>
        <p className="mt-6 max-w-[60ch] type-body text-pretty text-ink-muted">
          Students without senior contacts prepare blind. This puts the drive rules, verified senior experiences and a dated prep plan in one
          place, for everyone.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PillLink href="/drives" variant="primary">
            See upcoming drives
          </PillLink>
          <PillLink href="/rumour-check">Check a rumour</PillLink>
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title" className="type-title text-ink">
          How it works
        </h2>
        <p className="mt-2 max-w-[60ch] type-small text-ink-muted">
          A drive&rsquo;s requirements lead to the experiences for that company, which become your plan.
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {MODULES.map((m) => (
            <li key={m.step} className={cn(card, "flex flex-col p-6")}>
              <span className="type-data text-ink-dim">{m.step}</span>
              <h3 className="mt-3 type-title text-ink">{m.title}</h3>
              <p className="mt-2 type-small text-ink-muted">{m.body}</p>
              <ArrowLink href={m.href} className="mt-auto pt-5">
                {m.link}
              </ArrowLink>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="drives-title" className="mt-16 md:mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="drives-title" className="type-title text-ink">
            Upcoming drives
          </h2>
          <ArrowLink href="/drives">All drives</ArrowLink>
        </div>
        <Suspense fallback={<DrivesFallback />}>
          <UpcomingDrives />
        </Suspense>
      </section>
    </main>
  );
}

/** Server Component: fetches on the server and streams in behind the Suspense fallback. */
async function UpcomingDrives() {
  const open = (await listDrives()).filter((d) => d.status === "upcoming" || d.status === "ongoing").slice(0, 3);
  if (open.length === 0) {
    return <p className="mt-6 type-body text-ink-muted">No upcoming drives are listed yet. Past drives stay on the drives page.</p>;
  }
  const drives = await withRoundCounts(open);
  const now = new Date();
  return (
    <>
      {SEED_DRIVES_ARE_SAMPLE && (
        <div className="mt-4">
          <SampleTag />
        </div>
      )}
      <ul className="mt-4 grid gap-4 lg:grid-cols-3">
        {drives.map((d) => (
          <li key={d.id}>
            <DriveCard drive={d} now={now} />
          </li>
        ))}
      </ul>
    </>
  );
}

function DrivesFallback() {
  return (
    <ul aria-hidden="true" className="mt-4 grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className={cn(DRIVE_CARD, "animate-pulse")} />
      ))}
    </ul>
  );
}
