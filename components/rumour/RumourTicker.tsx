// "The rumour mill": hostel rumours scrolling past, each tagged as unchecked.
// A Server Component with no JavaScript in the browser; the motion is the CSS
// `animate-marquee` keyframes in app/globals.css.

const HEARD = [
  "Amazon only asks Leadership Principles",
  "CGPA under 7 means no shortlist",
  "TCS NQT is pure aptitude",
  "One backlog and you're out",
  "Infosys repeats last year's paper",
  "The HR round is just a formality",
  "Google only wants competitive programmers",
  "Microsoft asks DP in every round",
];

export function RumourTicker() {
  // Rendered twice back to back: the track slides left by exactly one copy (-50%)
  // and restarts, so the loop has no visible jump.
  const items = [...HEARD, ...HEARD];
  return (
    <div
      aria-label="Rumours heard in hostels"
      role="region"
      className="group relative w-screen overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] md:py-7"
    >
      <ul className="flex w-max items-center gap-8 motion-safe:animate-marquee group-hover:[animation-play-state:paused] md:gap-12">
        {items.map((r, i) => (
          // The second copy is only there for the loop, so screen readers skip it.
          <li key={i} aria-hidden={i >= HEARD.length} className="flex shrink-0 items-center gap-8 md:gap-12">
            <span className="font-serif text-[26px] whitespace-nowrap text-ink-muted italic md:text-[40px]">&ldquo;{r}&rdquo;</span>
            <span className="-rotate-6 rounded-md border-2 border-rumour px-2 py-0.5 type-data text-[12px] font-bold tracking-[0.14em] text-rumour uppercase">
              Unchecked
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
