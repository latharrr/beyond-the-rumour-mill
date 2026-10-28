import type { Metadata } from "next";
import { Suspense } from "react";
import { SubmitWizard } from "@/components/experiences/SubmitWizard";
import { LoadingState } from "@/components/route-states";
import { pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { listDrives } from "@/lib/data/drives";
import { listCompanies, listResources, listRoles, listTopics } from "@/lib/data/taxonomy";

export const metadata: Metadata = {
  title: "Share your experience",
  description: "Placed through a campus drive? Share your rounds and topics; once verified, juniors' prep plans are built from them.",
  robots: { index: false, follow: true },
};

const NOTES = [
  ["Anonymous", "Shown only as “Placed senior · Batch of <year>”. Your name and email never appear."],
  ["Verified first", "A placement-cell admin checks it before it counts anywhere. Until then it sits in the rumour lane."],
  ["Deletable", "Delete your account any time; your write-up stays, unlinked from you, as “Former student”."],
] as const;

// Auth required (proxy). Submissions go to the verification queue.
export default function NewExperiencePage() {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start lg:gap-14">
        <div className="lg:sticky lg:top-24">
          <p className="type-label text-ink-dim">Contribute</p>
          <h1 className="mt-4 max-w-[12ch] type-section text-balance text-ink">Share your experience</h1>
          <p className="mt-5 max-w-[46ch] type-body text-pretty text-ink-muted">
            Juniors&rsquo; prep plans are built from verified experiences like yours. Your name is never shown; verified
            experiences appear as &ldquo;Placed senior · Batch of &lt;year&gt;&rdquo;.
          </p>
          <dl className="mt-8 hidden gap-4 lg:grid">
            {NOTES.map(([t, d]) => (
              <div key={t} className="border-t border-line pt-4">
                <dt className="type-label text-ink-dim">{t}</dt>
                <dd className="mt-2 type-small text-ink-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Suspense fallback={<LoadingState label="Loading form…" />}>
          <Form />
        </Suspense>
      </div>
    </main>
  );
}

async function Form() {
  const [companies, roles, drives, topics, resources] = await Promise.all([
    listCompanies(),
    listRoles(),
    listDrives(),
    listTopics(),
    listResources(),
  ]);
  return (
    <SubmitWizard
      companies={companies}
      roles={roles}
      drives={drives.map(({ id, title, company_id, role_id }) => ({ id, title, company_id, role_id }))}
      topics={topics}
      resources={resources}
    />
  );
}
