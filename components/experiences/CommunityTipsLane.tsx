import type { CommunityTip } from "@/lib/data/experiences";

export const UNVERIFIED_BANNER = "Unverified — treat as rumour until a placement-cell admin verifies it.";

/** §3.2: pending submissions, quarantined behind the banner, no author info. */
export function CommunityTipsLane({ tips }: { tips: CommunityTip[] }) {
  return (
    <section aria-labelledby="community-tips" data-lane="unverified">
      <h2 id="community-tips">Community tips</h2>
      <p role="note">{UNVERIFIED_BANNER}</p>
      {tips.length === 0 ? (
        <p>No unverified tips right now.</p>
      ) : (
        <ul>
          {tips.map((t) => (
            <li key={t.id}>
              <p>{t.company} · {t.role}</p>
              {t.rounds_summary && <p>{t.rounds_summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
