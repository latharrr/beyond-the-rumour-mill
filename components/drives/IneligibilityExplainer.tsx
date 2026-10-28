import Link from "next/link";
import { textLink } from "@/components/ui/pill";
import type { Explanation } from "@/lib/eligibility";

/** Why the student is not eligible: one sentence per failed predicate (§2.7). */
export function IneligibilityExplainer({ explanations, headingLevel: H = "h2" }: { explanations: Explanation[]; headingLevel?: "h2" | "h3" }) {
  if (!explanations.length) return null;
  return (
    <section aria-labelledby="why-not-eligible">
      <H id="why-not-eligible" className="type-label text-ink-dim">
        Why you&rsquo;re not eligible
      </H>
      <ul className="mt-3 grid gap-2">
        {explanations.map((e) => (
          <li key={e.key} className="flex gap-2.5 type-small text-ink">
            <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-rumour" />
            <span>{e.href ? <Link href={e.href} className={textLink}>{e.sentence}</Link> : e.sentence}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
