import type { RoundDetail } from "@/lib/data/drives";

export function RoundList({ rounds }: { rounds: RoundDetail[] }) {
  if (!rounds.length) return <p>The placement cell hasn&rsquo;t published the rounds for this drive yet.</p>;
  return (
    <ol>
      {rounds.map((r) => (
        <li key={r.id}>
          <h3>{r.name}</h3>
          {r.description && <p>{r.description}</p>}
          {r.topics.length > 0 && (
            <p>Topics: {r.topics.map((t) => t.label).join(", ")}</p>
          )}
          {r.resources.length > 0 && (
            <ul>
              {r.resources.map((res) => (
                <li key={res.id}>
                  <a href={res.url} target="_blank" rel="noopener noreferrer">{res.title}</a> ({res.type})
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
