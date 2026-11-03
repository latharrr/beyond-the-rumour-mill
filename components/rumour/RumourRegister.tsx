import Link from "next/link";
import { VERDICT_TONE } from "@/components/rumour/VerdictCard";
import type { Tone } from "@/components/ui/status";
import { stretchedLink } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { listVerifiedExperiences } from "@/lib/experiences/data";
import { checkClaimVerdict, type Verdict } from "@/lib/experiences/rumour";
import { listCompanies, listTopics } from "@/lib/taxonomy";

// Hostel rumours on file. Each is checked as "<company> heavily asks <topic>".
const RUMOURS = [
  { quote: "Amazon interviews are all Leadership Principles.", company: "Amazon", topic: "Leadership Principles" },
  { quote: "TCS NQT is basically quant aptitude.", company: "TCS", topic: "Quantitative Aptitude" },
  { quote: "Infosys always throws pseudocode at you.", company: "Infosys", topic: "Pseudocode" },
];

const STAMP_TEXT: Record<Verdict, string> = {
  "Supported": "Supported",
  "Mixed evidence": "Mixed",
  "Not supported": "Not supported",
  "No verified evidence yet": "Unproven",
};

// Status colours darkened so the stamp stays readable on the paper mat.
const STAMP_INK: Record<Tone, string> = {
  verified: "text-[color-mix(in_oklab,var(--color-verified)_45%,black)]",
  mixed: "text-[color-mix(in_oklab,var(--color-mixed)_45%,black)]",
  rumour: "text-[color-mix(in_oklab,var(--color-rumour)_65%,black)]",
  neutral: "text-paper-ink/55",
};

/** Server Component: every rumour on file with its live verdict from verified experiences. */
export async function RumourRegister() {
  const [{ experiences }, companies, topics] = await Promise.all([listVerifiedExperiences(), listCompanies(), listTopics()]);

  const entries = RUMOURS.flatMap((r, i) => {
    const company = companies.find((c) => c.name === r.company);
    const topic = topics.find((t) => t.label === r.topic);
    if (!company || !topic) return [];
    const forCompany = experiences.filter((e) => e.company_id === company.id);
    const result = checkClaimVerdict(
      forCompany.map((e) => e.id),
      forCompany.filter((e) => e.topics.some((t) => t.id === topic.id)).map((e) => e.id),
    );
    return [{ ...r, n: String(i + 1).padStart(2, "0"), result, href: `/rumour-check?company_id=${company.id}&topic_id=${topic.id}` }];
  });

  return (
    <ol className="grid gap-x-8 gap-y-12 md:grid-cols-3">
      {entries.map((e) => {
        const tone = VERDICT_TONE[e.result.verdict];
        return (
          <li key={e.n} className="group relative">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-ink/40 px-2.5 py-0.5 type-data text-[13px] text-ink">#{e.n}</span>
              <span className="type-data text-[13px] uppercase text-ink-muted">
                {e.company} · {e.topic}
              </span>
            </div>

            <div className="mt-3 flex aspect-[4/3] flex-col justify-between overflow-hidden bg-paper p-6 ring-1 ring-line text-paper-ink transition-transform duration-300 ease-[var(--ease-out-3)] group-hover:-translate-y-1">
              <h3 className="max-w-[18ch] font-serif text-[28px] leading-[1.08] font-bold tracking-[-0.02em] text-balance italic md:text-[32px]">
                <Link href={e.href} className={cn(stretchedLink, "focus-visible:outline-none")}>
                  &ldquo;{e.quote}&rdquo;
                </Link>
              </h3>
              <span
                className={cn(
                  "self-end -rotate-[7deg] rounded-lg border-[3px] motion-safe:stamp-in border-current px-4 py-1.5 type-data text-[18px] font-bold tracking-[0.14em] uppercase transition-transform duration-300 group-hover:-rotate-3",
                  STAMP_INK[tone],
                )}
              >
                {STAMP_TEXT[e.result.verdict]}
              </span>
            </div>

            <p className="mt-4 type-small text-ink-muted">
              <span className="sr-only">Verdict: {e.result.verdict}. </span>
              {e.result.total > 0 && (
                <>
                  <span className="type-data text-ink">
                    {e.result.cites.length} of {e.result.total}
                  </span>{" "}
                  verified {e.company} experiences mention {e.topic}.
                </>
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function RumourRegisterFallback() {
  return (
    <ol aria-hidden="true" className="grid gap-x-8 gap-y-12 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="h-6" />
          <div className="mt-3 aspect-[4/3] animate-pulse bg-panel" />
        </li>
      ))}
    </ol>
  );
}
