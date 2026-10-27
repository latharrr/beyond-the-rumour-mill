import { Suspense } from "react";
import { EvidenceButton } from "@/components/admin/EvidenceButton";
import { ReviewForms } from "@/components/admin/ReviewForms";
import { LoadingState } from "@/components/route-states";
import { listVerificationQueue } from "@/lib/data/admin";
import { authorLabel } from "@/lib/format";

// Verification queue + evidence viewer (§3.1). Oldest first.
export default function AdminPage() {
  return (
    <main>
      <h1>Verification queue</h1>
      <Suspense fallback={<LoadingState label="Loading queue…" />}>
        <Queue />
      </Suspense>
    </main>
  );
}

async function Queue() {
  const queue = await listVerificationQueue();
  if (!queue.length) return <p>Nothing to review. New submissions appear here.</p>;

  return (
    <ol>
      {queue.map((e) => (
        <li key={e.id}>
          <article>
            <h2>{e.company} · {e.role}{e.drive ? ` · ${e.drive}` : ""}</h2>
            <p>
              {authorLabel(e.author.role, e.author.grad_year)} · submitted{" "}
              {e.created_at && <time dateTime={e.created_at}>{e.created_at.slice(0, 10)}</time>}
            </p>
            <h3>Rounds</h3>
            <p>{e.rounds_summary ?? "Not provided."}</p>
            {e.preparation_timeline && (
              <>
                <h3>Preparation</h3>
                <p>{e.preparation_timeline}</p>
              </>
            )}
            <p>Topics: {e.topics.join(", ") || "none"}</p>
            {e.hasEvidence ? <EvidenceButton experienceId={e.id} /> : <p>No evidence attached.</p>}
            <ReviewForms experienceId={e.id} />
          </article>
        </li>
      ))}
    </ol>
  );
}
