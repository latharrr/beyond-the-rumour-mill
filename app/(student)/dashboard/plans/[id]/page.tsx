import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Countdown } from "@/components/drives/DriveCard";
import { Checklist } from "@/components/plans/Checklist";
import { BackLink, textLink } from "@/components/ui/pill";
import { card, pageMain } from "@/components/ui/surface";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { isUuid } from "@/lib/data/drives";
import { getMyPlan } from "@/lib/data/plans";
import { formatDriveDate } from "@/lib/format";
import { DownloadIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Prep plan" };

const DAY_MS = 86_400_000;

// Owner-only: another user's plan id is a 404, same as a missing one.
export default function PlanPage({ params }: PageProps<"/dashboard/plans/[id]">) {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <BackLink href="/dashboard">Dashboard</BackLink>
      <Suspense fallback={<div role="status" aria-label="Loading plan" className={cn(card, "mt-8 h-[520px] animate-pulse")} />}>
        <Plan params={params} />
      </Suspense>
    </main>
  );
}

async function Plan({ params }: Pick<PageProps<"/dashboard/plans/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/plans/${id}`);
  const plan = isUuid(id) ? await getMyPlan(user.id, id) : null;
  if (!plan) notFound();

  const now = new Date();
  const weeks = new Set(plan.items.map((i) => i.week)).size;
  const started = plan.created_at ? Date.parse(plan.created_at) : NaN;
  const currentWeek = Number.isNaN(started) ? null : Math.floor((now.getTime() - started) / (7 * DAY_MS)) + 1;

  return (
    <>
      <header className="pt-8 pb-10 md:pt-10 md:pb-12">
        <p className="type-label text-ink-muted">
          {plan.drive.company} · {plan.drive.role}
        </p>
        <h1 className="mt-4 max-w-[24ch] type-section text-balance text-ink">Prep plan: {plan.drive.title}</h1>
        <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 type-body text-ink-muted">
          {plan.drive.drive_date ? (
            <span>
              Drive on{" "}
              <time dateTime={plan.drive.drive_date} className="type-data text-ink">
                {formatDriveDate(plan.drive.drive_date)}
              </time>{" "}
              <span className="type-small text-ink-dim">
                <Countdown date={plan.drive.drive_date} now={now} />
              </span>
            </span>
          ) : (
            <span>Drive date not announced</span>
          )}
          <span aria-hidden="true">·</span>
          <span>
            <span className="type-data text-ink">{plan.items.length}</span> topics over <span className="type-data text-ink">{weeks}</span>{" "}
            week{weeks === 1 ? "" : "s"}
          </span>
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={`/api/plans/${plan.id}/export`}
            download
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[15px] font-medium text-ink transition-colors duration-200 hover:bg-panel"
          >
            <DownloadIcon className="size-4" />
            Export as Markdown
          </a>
          <Link href={`/drives/${plan.drive.id}`} className={cn(textLink, "hit-44 type-small")}>
            Back to the drive
          </Link>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
        <Checklist items={plan.items} startedAt={plan.created_at} currentWeek={currentWeek} />

        <section aria-labelledby="provenance" className={cn(card, "p-5 md:p-6 lg:sticky lg:top-24")}>
          <h2 id="provenance" className="type-title text-ink">
            Built from
          </h2>
          <p className="mt-1 type-small text-ink-muted">
            Topics are weighted by how often these verified experiences mention them, newer ones counting more.
          </p>
          {plan.experiences.length ? (
            <ul className="mt-4 grid">
              {plan.experiences.map((e) => (
                <li key={e.id} className="border-t border-line first:border-t-0">
                  <Link href={`/experiences/${e.id}`} className="flex min-h-11 items-center justify-between gap-3 py-2 text-[15px] text-ink hover:underline">
                    {e.author}
                    <span aria-hidden="true" className="text-ink-dim">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 type-small text-ink-muted">
              No verified experiences for this company yet; this plan uses the drive&rsquo;s listed round topics.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
