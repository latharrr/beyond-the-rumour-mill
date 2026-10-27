import Link from "next/link";
import type { ExperienceView } from "@/lib/data/experiences";
import { authorLabel } from "@/lib/format";
import { TrustScore } from "./TrustScore";
import { VerifiedBadge } from "./VerifiedBadge";

export function ExperienceCard({ experience: e }: { experience: ExperienceView }) {
  return (
    <article>
      <h3>
        <Link href={`/experiences/${e.id}`}>{e.company} · {e.role}</Link>
      </h3>
      <p>{authorLabel(e.author_role, e.grad_year)}</p>
      <VerifiedBadge verifiedAt={e.verified_at} /> <TrustScore trust={e.trust} />
      {e.rounds_summary && <p>{e.rounds_summary}</p>}
      {e.topics.length > 0 && <p>Topics: {e.topics.map((t) => t.label).join(", ")}</p>}
    </article>
  );
}
