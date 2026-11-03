import type { Metadata } from "next";
import { type ReactNode, Suspense } from "react";
import { DriveCard } from "@/components/drives/DriveCard";
import { RuleLab } from "@/components/rumour/RuleLab";
import { RumourRegister, RumourRegisterFallback } from "@/components/rumour/RumourRegister";
import { RumourTicker } from "@/components/rumour/RumourTicker";
import { ArrowLink, PillLink } from "@/components/ui/pill";
import { SampleTag } from "@/components/ui/status";
import { listDrives, withRoundCounts } from "@/lib/placement/data";
import { SEED_DRIVES_ARE_SAMPLE } from "@/lib/sample-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// The three P08 modules, rendered from data with .map().
const MODULES = [
  {
    title: "Placement information",
    body: "Every campus drive with its eligibility rules, role, date and rounds. Signed in, each drive tells you whether you qualify, and why not.",
    href: "/drives",
    link: "Browse drives",
  },
  {
    title: "Experience repository",
    body: "Interview experiences from placed seniors. Only ones the placement cell has verified count; unverified tips stay labelled as rumours.",
    href: "/experiences",
    link: "Read experiences",
  },
  {
    title: "Your preparation plan",
    body: "Pick a drive and get a week-by-week checklist built from what verified seniors were asked, with resources. Tick items off as you go.",
    href: "/dashboard",
    link: "Open your dashboard",
  },
];

export default function HomePage() {
  return (
    <main className="container-page pb-24 md:pb-32">
      <section aria-labelledby="hero-title" className="pt-14 md:pt-24">
        <h1 id="hero-title" className="font-serif text-[44px] leading-[1] font-bold tracking-[-0.035em] text-balance text-ink sm:text-[64px] lg:text-[100px] lg:leading-[0.96] lg:text-wrap">
          Prepare from evidence, <span className="font-normal text-ink-muted italic lg:block">not hostel rumours.</span>
        </h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t border-line pt-6 md:mt-14">
          <p className="max-w-[52ch] type-body text-pretty text-ink-muted">
            Hostel rumours, checked against interview experiences from placed seniors that the placement cell has verified. No senior contacts
            needed.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <PillLink href="/drives" variant="primary">
              See upcoming drives
            </PillLink>
            <ArrowLink href="/experiences/new">Share your experience</ArrowLink>
          </div>
        </div>
      </section>

      {/* Full-bleed: pulled out of the centred container to the screen edges. */}
      <div className="mt-16 ml-[calc(50%-50vw)] md:mt-20">
        <RumourTicker />
      </div>

      <Step n="01" id="register-title" title="Rumours on file" lede="Each one is stamped by the evidence, not by who said it." action={<ArrowLink href="/rumour-check">Check any rumour</ArrowLink>}>
        <Suspense fallback={<RumourRegisterFallback />}>
          <RumourRegister />
        </Suspense>
      </Step>

      <Step n="02" id="rule-title" title="How a rumour gets its stamp" lede="Count the verified experiences for the company that mention the topic.">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
          <div className="grid max-w-[52ch] content-start gap-4 type-body text-ink-muted">
            <p>
              Half or more, and the rumour is <span className="text-ink">supported</span>. Fifteen percent or less, and it is{" "}
              <span className="text-ink">not supported</span>. Anything between is <span className="text-ink">mixed</span>.
            </p>
            <p>Fewer than three experiences is flagged as a low sample. Unverified tips never count. Move the sliders to try it.</p>
          </div>
          <RuleLab />
        </div>
      </Step>

      <Step n="03" id="modules-title" title="From a drive to your plan" lede="Requirements pick the evidence; the evidence becomes your checklist.">
        <ol className="border-t border-line">
          {MODULES.map((m) => (
            <li key={m.href} className="grid gap-x-8 gap-y-2 border-b border-line py-6 md:grid-cols-[1fr_auto] md:items-baseline">
              <div>
                <h3 className="type-title text-ink">{m.title}</h3>
                <p className="mt-1 max-w-[70ch] type-small text-ink-muted">{m.body}</p>
              </div>
              <ArrowLink href={m.href}>{m.link}</ArrowLink>
            </li>
          ))}
        </ol>
      </Step>

      <Suspense fallback={null}>
        <UpcomingDrives />
      </Suspense>
    </main>
  );
}

/** One numbered step of the home page; every section shares this header so the page reads as one path. */
function Step({ n, id, title, lede, action, children }: { n: string; id: string; title: string; lede: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-24 md:mt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-data text-[13px] text-accent-ink">{n}</p>
          <h2 id={id} className="mt-2 font-serif text-[28px] leading-tight font-bold tracking-[-0.02em] text-ink md:text-[36px]">
            {title}
          </h2>
          <p className="mt-1 type-small text-ink-muted">{lede}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Server Component: fetches on the server and streams in behind the Suspense fallback. */
async function UpcomingDrives() {
  const open = (await listDrives()).filter((d) => d.status === "upcoming" || d.status === "ongoing").slice(0, 3);
  if (open.length === 0) return null; // nothing to show; /drives still lists past drives
  const drives = await withRoundCounts(open);
  const now = new Date();
  return (
    <section aria-labelledby="drives-title" className="mt-24 md:mt-32">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="drives-title" className="font-serif text-[28px] leading-tight font-bold tracking-[-0.02em] text-ink md:text-[36px]">
          Upcoming drives
        </h2>
        <ArrowLink href="/drives">All drives</ArrowLink>
      </div>
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
    </section>
  );
}
