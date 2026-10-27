import type { TopicFrequency } from "@/lib/topic-frequency";

/**
 * Topic frequency across verified experiences. Phase 0–2: a plain table with
 * the computed numbers; the design pass turns `share` into bars.
 */
export function TopicFrequencyBars({ frequency, total }: { frequency: TopicFrequency[]; total: number }) {
  if (!frequency.length) return <p>No topic data yet.</p>;
  return (
    <table>
      <caption>Most-asked topics across {total} verified experience{total === 1 ? "" : "s"}</caption>
      <thead>
        <tr><th scope="col">Topic</th><th scope="col">Category</th><th scope="col">Experiences</th><th scope="col">Share</th></tr>
      </thead>
      <tbody>
        {frequency.map((t) => (
          <tr key={t.id} data-share={t.share}>
            <th scope="row">{t.label}</th>
            <td>{t.category}</td>
            <td>{t.count}</td>
            <td>{Math.round(t.share * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
