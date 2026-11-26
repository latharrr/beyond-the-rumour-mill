# Design system: Clean desk, real paper

**Idea:** the page is a calm, architectural desk: warm paper, hairlines, huge type, empty space, one deep colour. Only the evidence objects are physical: rumour notes, stamps, ticket stubs and the prep brief. Calm background, tactile objects. References: santalarch.com (hairline grid, scale, space), sweet-tape.com (real tape and paper), agrumeafarm.it (cream plus one deep colour).

Light is the default and the only automatic theme. Dark is opt-in from the nav toggle, saved as `btrm-theme` in `localStorage`; the OS setting is ignored. The old `theme` key is cleared on load (`app/layout.tsx`).

All values are tokens in `app/globals.css` under `@theme static`; components never use raw hex. Older names (`ground`, `panel`, `panel-2`, `ink-muted`, `amber`, `accent-ink`, `verified`, `rumour`) point at these, so inner pages re-theme without edits.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F4F1EA` | `#161513` | the page |
| `bg-alt` | `#ECE7DC` | `#1D1C19` | alternate sections (no dark sections anywhere) |
| `surface` | `#FFFDF8` | `#23221F` | cards, the brief, tickets |
| `line` | ink at 12% | ink at 12% | hairlines |
| `guide` | ink at 6% | ink at 5% | the 12-column guides |
| `ink` / `ink-2` | `#191816` / `#6B665C` | `#ECE7DC` / `#A9A397` | text |
| `accent` | `#7A1F2B` oxblood | `#E08A95` | CTAs, links, active states. The only strong colour. |
| `ok` / `mixed` / `no` | `#2E6B4A` / `#B7771C` / `#B3261E` | lighter | status in the UI |
| `sticky` / `kraft` | `#FFE27A` / `#D9B98C` | same | rumour notes and sticky notes |
| `stamp-ok/mixed/no/none`, `object-ink`, `object-accent` | fixed | fixed | colours on paper objects, the same in both themes |

No blue, no orange, no gradients, no glass, no offset or brutalist shadows. `--shadow-object` (`0 1px 1px rgb(0 0 0/.08), 0 12px 28px -14px rgb(0 0 0/.25)`) is for physical objects only; everything else is flat.

## Type

- **Display:** Gambarino (Fontshare, self-hosted, `app/fonts`), regular, tracking −0.02em. Gambarino has no italic or bold, so the same `font-serif` family uses Zodiak for italic (rumour quotes) and bold.
- **UI and body:** Switzer (Fontshare, self-hosted), 15/24.
- **Handwriting:** Reenie Beanie (`font-hand`), only for the struck-out "hostel rumours" in the hero and small annotations.
- **Meta and stamps:** JetBrains Mono, 11–12px uppercase, 0.1em tracking (`type-label`). `n` in sample sizes stays lowercase.

## Hero (first viewport)

`components/home/hero/`: `Hero`, `Desk`, `StickyNote`, `Stamp`, `CompanySearch`, `TicketStrip`.

- Exactly one screen from 768px up (`100svh` minus the nav); headline, search and desk all above the fold at 1280×720. No column guides in the hero.
- Headline in two lines at up to 104px across the full width; the desk starts beside the second line and fills down to the drive strip on the fold.
- Desk: three rumour notes (sticky, kraft, white) on top of a peeking prep brief. Every 2.4s the next note lifts 8px and comes to the front, its stamp slams (1.4 → 1, 120ms) and the desk jolts 2px; then the next three rumours are dealt. Hover pauses; notes drift 10px and the brief 4px against the cursor. Two notes on phones.
- Entrance once, about 1.2s, in CSS: meta fades, lines rise, strike draws at 0.6s, search slides up, notes drop (70ms stagger).
- Reduced motion: first notes already stamped, no loop, no parallax, strip still.

## Layout

- 12-column grid (4 on phones) with visible 1px guides at 6% on `bg` sections (`<Guides>`, `guides` utility), lines through the middle of each 24px gutter.
- Each section opens with one full-width hairline, its meta label on the first column and an index (`01 / 06`) in the last.
- At least 30% of every viewport is empty.

## Objects

- **Rumour notes:** alternate sticky yellow and kraft, real fibre texture (`paper-fibre`, `public/textures/paper-fibre.png`), object shadow, ±2° rest angle, one strip of masking tape (`public/marks/tape.svg`). Two notes on the page get a paperclip instead (the page maximum).
- **Stamps:** solid ink with paper letters, ragged edges (`stamp-ink`, `public/marks/stamp-mask.svg`), −6°, 19px bold mono.
- **Ticket stubs:** white, perforated left edge and a punched hole (`ticket-cut` mask; shadow is a drop-shadow on the wrapper), date in mono.
- **Prep brief:** a white form with hairline fields; an oxblood VERIFIED stamp over its top edge when the company has verified experiences.
- **Counters:** three big serif numbers between vertical hairlines, each with a small yellow sticky note of its `n`.

## Buttons

Primary: `accent` fill, `#FFFDF8` text, fully rounded, 48px tall, no shadow; hover darkens the fill 8% and slides the arrow 4px. Secondary: transparent with a 1px ink border, same shape.

## Motion

Below the hero only these move: masked line reveals (`data-split`), notes dropping onto the desk with a small settle, stamps slamming in (scale 1.4 → 1, 120ms), and the ticket hover lift (6px). Nothing else animates. Lenis smooth scroll stays. Under `prefers-reduced-motion` nothing runs: notes and stamps are in place and the strike is already drawn. Code: `lib/motion.ts`, `components/home/HomeMotion.tsx`.
