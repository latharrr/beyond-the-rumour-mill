import Link from "next/link";
import { Chip } from "@/components/ui/status";
import { cardInteractive, stretchedLink } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { ExperienceView } from "@/lib/data/experiences";
import { authorLabel } from "@/lib/format";
import { TrustScore } from "./TrustScore";
import { VerifiedBadge } from "./VerifiedBadge";

const MAX_TOPICS = 4;

/** A verified experience in a list: status and TrustScore, who, what happened, topics. */
export function ExperienceCard({ experience: e, headingLevel: H = "h3" }: { experience: ExperienceView; headingLevel?: "h2" | "h3" }) {
  const shown = e.topics.slice(0, MAX_TOPICS);
  const more = e.topics.length - shown.length;
  return (
    <article className={cn(cardInteractive, "flex h-full flex-col p-5 md:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <VerifiedBadge verifiedAt={e.verified_at} />
        <TrustScore trust={e.trust} />
      </div>
      <H className="mt-4 type-title text-ink">
        <Link href={`/experiences/${e.id}`} className={stretchedLink}>
          {e.company} · {e.role}
        </Link>
      </H>
      <p className="mt-1 type-small text-ink-dim">{authorLabel(e.author_role, e.grad_year)}</p>
      {e.rounds_summary && <p className="mt-3 line-clamp-3 type-small text-pretty text-ink-muted">{e.rounds_summary}</p>}
      {shown.length > 0 && (
        <ul aria-label="Topics asked" className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {shown.map((t) => (
            <li key={t.id}>
              <Chip>{t.label}</Chip>
            </li>
          ))}
          {more > 0 && (
            <li className="inline-flex h-7 items-center px-1 text-[13px] text-ink-dim">
              <span className="type-data">+{more}</span>&nbsp;more
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
