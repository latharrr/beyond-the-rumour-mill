import Link from "next/link";
import { VERDICT_TONE } from "@/components/rumour/VerdictCard";
import type { Tone } from "@/components/ui/status";
import { Paperclip } from "@/components/ui/marks";
import { stretchedLink } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { listVerifiedExperiences } from "@/lib/experiences/data";
import { checkClaimVerdict, type Verdict } from "@/lib/experiences/rumour";
import { listCompanies, listTopics } from "@/lib/taxonomy";

// Hostel rumours on file. Each is checked as "<company> heavily asks <topic>".
export const RUMOURS = [
  { quote: "Amazon interviews are all Leadership Principles.", company: "Amazon", topic: "Leadership Principles" },
  { quote: "TCS NQT is basically quant aptitude.", company: "TCS", topic: "Quantitative Aptitude" },
  { quote: "Infosys always throws pseudocode at you.", company: "Infosys", topic: "Pseudocode" },
  { quote: "Amazon only asks dynamic programming.", company: "Amazon", topic: "Dynamic Programming" },
  { quote: "TCS interviews are all OOP.", company: "TCS", topic: "OOP" },
  { quote: "Infosys is all about SQL.", company: "Infosys", topic: "SQL" },
];

const STAMP_TEXT: Record<Verdict, string> = {
  "Supported": "Supported",
  "Mixed evidence": "Mixed",
  "Not supported": "Not supported",
  "No verified evidence yet": "Unproven",
};

// Stamps are solid ink with paper-coloured letters; the colours stay the same in dark mode, like the paper they sit on.
const STAMP_INK: Record<Tone, string> = {
  verified: "bg-stamp-ok",
  mixed: "bg-stamp-mixed",
  rumour: "bg-stamp-no",
  neutral: "bg-stamp-none",
};

// Each note rests slightly off-square (within ±2deg), alternating sticky yellow and kraft.
const TILT = ["-rotate-[1.6deg]", "rotate-[1.2deg]", "-rotate-[0.6deg]", "rotate-[2deg]", "-rotate-[1.4deg]", "rotate-[0.8deg]"];
const TAPE_TILT = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2", "rotate-1"];
// The page's only two paperclips; those notes need no tape.
const CLIPPED = new Set([1, 4]);

const MAX_CITES = 8;

/**
 * Research-paper footnotes: [1] [2] … each linking to one cited verified
 * experience. Sits above a card's stretched link, so each one is clickable.
 */
export function Citations({ ids, onPaper = false }: { ids: string[]; /** On a paper note, whose colours don't change with the theme. */ onPaper?: boolean }) {
  if (ids.length === 0) return null;
  return (
    <span className="relative z-10 ml-1 inline-flex flex-wrap gap-x-0.5">
      {ids.slice(0, MAX_CITES).map((id, i) => (
        <sup key={id}>
          <Link href={`/experiences/${id}`} aria-label={`Cited experience ${i + 1}`} className={cn("hit-44 font-mono text-[11px] hover:underline", onPaper ? "text-object-accent" : "text-accent")}>
            [{i + 1}]
          </Link>
        </sup>
      ))}
      {ids.length > MAX_CITES && <sup className={cn("font-mono text-[11px]", onPaper ? "text-object-ink-2" : "text-ink-2")}>+{ids.length - MAX_CITES}</sup>}
    </span>
  );
}

/**
 * Server Component: every rumour on file as a card of hearsay, stamped with its
 * live verdict from verified experiences (the same rule as /rumour-check) and
 * footnoted with the experiences it cites. HomeMotion drops each note onto
 * the desk and slams its stamp down as it scrolls into view.
 */
export async function RumourRegister({ evidence }: { evidence: ReturnType<typeof listVerifiedExperiences> }) {
  const [{ experiences }, companies, topics] = await Promise.all([evidence, listCompanies(), listTopics()]);

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
    <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((e, i) => (
        <li
          key={e.n}
          data-drop
          className={cn(
            "relative flex min-h-[208px] flex-col justify-between gap-5 rounded-[2px] p-6 pt-7 text-object-ink paper-fibre shadow-[var(--shadow-object)]",
            i % 2 ? "bg-kraft" : "bg-sticky",
            TILT[i % TILT.length],
          )}
        >
          {CLIPPED.has(i) ? (
            <Paperclip className="absolute -top-5 right-8 h-12 w-[18px] rotate-6" />
          ) : (
            <span aria-hidden="true" className={cn("absolute -top-3.5 left-1/2 h-[28px] w-[104px] -translate-x-1/2 bg-[url(/marks/tape.svg)] bg-size-[100%_100%]", TAPE_TILT[i % TAPE_TILT.length])} />
          )}
          <div className="flex items-center justify-between gap-3 type-label text-object-ink-2">
            <span>#{e.n}</span>
            <span>
              {e.company} · {e.topic}
            </span>
          </div>
          <h3 className="max-w-[22ch] font-serif text-[24px] leading-[1.1] font-normal tracking-[-0.02em] text-balance italic">
            <Link href={e.href} className={cn(stretchedLink, "focus-visible:outline-none")}>
              &ldquo;{e.quote}&rdquo;
            </Link>
          </h3>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="type-small text-object-ink-2">
              <span className="sr-only">Verdict: {e.result.verdict}. </span>
              {e.result.total > 0 ? (
                <>
                  <span className="type-data text-object-ink">
                    {e.result.cites.length} of {e.result.total}
                  </span>{" "}
                  mention it
                  <Citations ids={e.result.cites} onPaper />
                  {e.result.lowSample ? <span className="mt-1 block type-label">Low sample (<span className="normal-case">n = {e.result.total}</span>)</span> : null}
                </>
              ) : (
                "No verified experiences yet"
              )}
            </p>
            <span
              data-stamp
              aria-hidden="true"
              className={cn(
                "shrink-0 -rotate-[6deg] rounded-[3px] px-3 py-1.5 stamp-ink font-mono text-[19px] leading-none font-bold tracking-[0.06em] text-object-paper uppercase",
                STAMP_INK[VERDICT_TONE[e.result.verdict]],
              )}
            >
              {STAMP_TEXT[e.result.verdict]}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Same box as the notes, so nothing shifts when they stream in. */
export function RumourRegisterFallback() {
  return (
    <ol aria-hidden="true" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {RUMOURS.map((r) => (
        <li key={r.quote} className="min-h-[208px] rounded-[2px] bg-surface/50" />
      ))}
    </ol>
  );
}
