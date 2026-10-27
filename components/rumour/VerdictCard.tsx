import Link from "next/link";
import type { ClaimCheck } from "@/app/_actions/rumour";

/** Deterministic verdict with the experiences it cites (§2.5). */
export function VerdictCard({ result }: { result: ClaimCheck }) {
  return (
    <section aria-labelledby="verdict" data-verdict={result.verdict}>
      <h2 id="verdict">{result.label}</h2>
      <p>
        Claim: &ldquo;{result.company} heavily asks {result.topic}&rdquo;.{" "}
        {result.total === 0
          ? `No verified ${result.company} experiences exist yet.`
          : `${result.cites.length} of ${result.total} verified ${result.company} experience${result.total === 1 ? "" : "s"} (${Math.round(result.frac * 100)}%) mention ${result.topic}.`}
      </p>
      {result.cited.length > 0 && (
        <>
          <h3>Cited experiences</h3>
          <ul>
            {result.cited.map((e) => (
              <li key={e.id}>
                <Link href={`/experiences/${e.id}`}>{e.rounds_summary?.slice(0, 120) ?? "Verified experience"}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p>
        Rule: Supported at 50% or more, Not supported at 15% or less, otherwise Mixed. Fewer than 3 experiences is
        flagged as a low sample.
      </p>
    </section>
  );
}
