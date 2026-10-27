import Link from "next/link";
import type { Explanation } from "@/lib/eligibility";

/** Why the student is not eligible: one sentence per failed predicate (§2.7). */
export function IneligibilityExplainer({ explanations }: { explanations: Explanation[] }) {
  if (!explanations.length) return null;
  return (
    <section aria-labelledby="why-not-eligible">
      <h2 id="why-not-eligible">Why you&rsquo;re not eligible</h2>
      <ul>
        {explanations.map((e) => (
          <li key={e.key}>
            {e.href ? <Link href={e.href}>{e.sentence}</Link> : e.sentence}
          </li>
        ))}
      </ul>
    </section>
  );
}
