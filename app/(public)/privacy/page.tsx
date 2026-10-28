import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { pageMain } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Beyond the Rumour Mill stores about you, what is public, how evidence files are handled, and how to delete your account.",
  alternates: { canonical: "/privacy" },
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-line py-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-14 md:py-14">
      <h2 id={id} className="type-title text-ink">
        {title}
      </h2>
      <div className="flex max-w-[64ch] flex-col gap-4 type-body text-ink-muted">{children}</div>
    </section>
  );
}

const LIST = "flex list-disc flex-col gap-2 pl-5 marker:text-ink-dim";

// Mirrors the README's "Evidence: PII and retention" notes; keep the two in step.
export default function PrivacyPage() {
  return (
    <main className={`${pageMain} pb-8`}>
      <header className="pb-10 md:pb-14">
        <p className="type-label text-ink-dim">Privacy</p>
        <h1 className="mt-4 max-w-[14ch] type-section text-ink">What we keep, and who sees it</h1>
        <p className="mt-6 max-w-[56ch] type-body text-pretty text-ink-muted">
          Beyond the Rumour Mill is a student course project. It stores the least it needs to check eligibility, build your
          prep plan and verify senior experiences, and nothing on a public page can identify you.
        </p>
      </header>

      <Section id="privacy-collect" title="What we store">
        <ul className={LIST}>
          <li>
            <span className="text-ink">Your account:</span> email and password, handled by Supabase Auth.
          </li>
          <li>
            <span className="text-ink">Your profile:</span> branch, CGPA, backlogs, 10th and 12th percentages and graduation
            year. These are used only to check drive eligibility.
          </li>
          <li>
            <span className="text-ink">Your prep plans</span> and which checklist items you have ticked.
          </li>
          <li>
            <span className="text-ink">Experiences you share:</span> rounds, topics, timeline, resources and an optional
            evidence file (an offer letter or similar).
          </li>
        </ul>
        <p>No analytics, no advertising trackers. The only cookies are the ones that keep you signed in.</p>
      </Section>

      <Section id="privacy-public" title="What other people see">
        <p>
          A verified experience appears publicly as <span className="text-ink">&ldquo;Placed senior · Batch of YYYY&rdquo;</span>.
          Your account id, email, grades and evidence file are never part of a public page or a public query.
        </p>
        <p>
          Your plans are visible only to you. Your profile is visible to you and authorized project admins. Admins can read pending submissions and evidence to verify them.
        </p>
      </Section>

      <Section id="privacy-evidence" title="Evidence files">
        <ul className={LIST}>
          <li>Stored in a private bucket. JPEG, PNG or PDF only, up to 4 MB, and checked by content, not just by name.</li>
          <li>Saved under a random name. The name of the file on your device is never kept.</li>
          <li>
            Once uploaded, students cannot read, list or replace evidence, including their own. An admin opens it through a
            link that expires after 60 seconds.
          </li>
          <li>Evidence is kept only for verification and is deleted on request.</li>
        </ul>
      </Section>

      <Section id="privacy-delete" title="Deleting your account">
        <p>
          On your{" "}
          <Link href="/onboarding" className="text-ink underline underline-offset-4 decoration-ink-dim hover:decoration-ink">
            profile page
          </Link>
          , type DELETE to confirm. In one step:
        </p>
        <ol className="flex list-decimal flex-col gap-2 pl-5 marker:text-ink-dim">
          <li>every evidence file you uploaded is deleted;</li>
          <li>your account, profile and prep plans are deleted;</li>
          <li>
            experiences you shared stay so juniors keep the data, but they are unlinked from you and shown as
            &ldquo;Former student&rdquo;.
          </li>
        </ol>
      </Section>

      <Section id="privacy-contact" title="Questions">
        <p>
          This project is run by Group 8 (INT252/257) and is not operated by the LPU placement cell. Open an issue on{" "}
          <a
            href="https://github.com/latharrr/beyond-the-rumour-mill/issues"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline underline-offset-4 decoration-ink-dim hover:decoration-ink"
          >
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          for anything about your data.
        </p>
      </Section>
    </main>
  );
}
