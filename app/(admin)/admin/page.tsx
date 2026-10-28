import { AdminOverview } from "@/components/admin/AdminOverview";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EvidenceButton } from "@/components/admin/EvidenceButton";
import { ReviewForms } from "@/components/admin/ReviewForms";
import { Chip, StatusPill } from "@/components/ui/status";
import { card, EmptyState, PageHeader, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { listVerificationQueue } from "@/lib/data/admin";
import { authorLabel, formatDriveDate } from "@/lib/format";

export const metadata: Metadata = { title: "Verification queue" };

// Verification queue + evidence viewer (§3.1). Oldest first.
export default function AdminPage() {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <PageHeader
        title="Verification queue"
        lede="Check each submission against its evidence. Verified experiences start counting in topic bars, verdicts and plans; rejected ones never appear publicly."
      />
      <Suspense fallback={<p role="status">Loading overview...</p>}><AdminOverview /></Suspense>
      <Suspense
        fallback={
          <div role="status" aria-label="Loading queue" className="grid gap-4">
            {[0, 1].map((i) => (
              <div key={i} aria-hidden="true" className={cn(card, "h-[260px] animate-pulse")} />
            ))}
          </div>
        }
      >
        <Queue />
      </Suspense>
    </main>
  );
}

async function Queue() {
  const queue = await listVerificationQueue();
  if (!queue.length) return <EmptyState title="Nothing to review.">New submissions appear here, oldest first.</EmptyState>;

  return (
    <>
      <p className="mb-4 type-small text-ink-muted">
        <span className="type-data text-ink">{queue.length}</span> pending, oldest first
      </p>
      <ol className="grid gap-4">
        {queue.map((e) => (
          <li key={e.id}>
            <article className={cn(card, "grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10")}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone="mixed">Pending</StatusPill>
                  {e.created_at && (
                    <span className="type-small text-ink-dim">
                      submitted <time dateTime={e.created_at} className="type-data">{formatDriveDate(e.created_at.slice(0, 10))}</time>
                    </span>
                  )}
                </div>
                <h2 className="mt-4 type-title text-ink">
                  {e.company} · {e.role}
                  {e.drive ? <span className="text-ink-muted"> · {e.drive}</span> : ""}
                </h2>
                <p className="mt-1 type-small text-ink-dim">{authorLabel(e.author.role, e.author.grad_year)}</p>

                <h3 className="mt-6 type-label text-ink-dim">Rounds</h3>
                <p className="mt-2 max-w-[68ch] type-body whitespace-pre-line text-ink">{e.rounds_summary ?? "Not provided."}</p>
                {e.preparation_timeline && (
                  <>
                    <h3 className="mt-5 type-label text-ink-dim">Preparation</h3>
                    <p className="mt-2 max-w-[68ch] type-body whitespace-pre-line text-ink-muted">{e.preparation_timeline}</p>
                  </>
                )}
                <h3 className="mt-5 type-label text-ink-dim">Topics</h3>
                {e.topics.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {e.topics.map((t) => (
                      <li key={t}>
                        <Chip>{t}</Chip>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 type-small text-ink-dim">None tagged.</p>
                )}
              </div>
              <div className="grid content-start gap-5 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                {e.hasEvidence ? <EvidenceButton experienceId={e.id} /> : <p className="type-small text-ink-dim">No evidence attached.</p>}
                <ReviewForms experienceId={e.id} />
              </div>
            </article>
          </li>
        ))}
      </ol>
    </>
  );
}
