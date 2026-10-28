# Design system: Beyond the Rumour Mill

**Idea: "Heat → evidence."** Placement season runs hot on rumours. The site is a warm ember glow cooling into a dark, precise evidence desk. Rumours are shown as rumours, and every claim on screen comes from verified senior experiences.

The landing page structure follows the Handshake bar (`bar.md`), but every colour, word and asset here is ours. Dark only. All values are tokens in `app/globals.css` under `@theme`; components never use raw hex.

## Colour

| Token | Value | Use |
|---|---|---|
| `--color-ground` | `#111114` | the page, everywhere below the hero |
| `--color-panel` | `#18181C` | cards, inputs on dark, the nav pill on dark |
| `--color-panel-2` | `#202026` | hover / selected rows |
| `--color-line` | `rgb(255 255 255 / .09)` | every 1px card border and divider |
| `--color-ink` | `#F5F3EF` | headings, primary text (warm white) |
| `--color-ink-muted` | `#A3A0A8` | body copy and secondary text |
| `--color-ink-dim` | `#85828B` | captions, meta, placeholders (≥ 4.5:1 on ground) |
| `--color-paper` | `#FBFAF7` | the hero claim bar and white UI cards inside glow panels |
| `--color-paper-ink` | `#16151A` | text on paper |
| `--color-amber` | `#FFB547` | **the only accent.** Used on primary CTA pills (with `paper-ink` text), the logo mark and the footer wordmark, and nowhere else |
| `--glow-1` / `--glow-2` / `--glow-3` | `#FF8A3D` / `#C2410C` / `#3B0D1A` | ember, rust and oxblood; used only in the hero glow and feature-panel glow frames |

**Semantic glyph colours.** These are for status, never decoration, and always come with a text label:
- `--color-verified` `#6FD3A0`: verified, Supported, eligible
- `--color-mixed` `#F2C94C`: pending, Mixed evidence, Low sample
- `--color-rumour` `#F07167`: rumour / unverified, Not supported, ineligible

Rules:
- Below the hero, the background is always `ground`. There are no white or coloured section bands.
- Glow appears in two places only, and each has its own shape. Both use soft multi-stop radial gradients in the `--glow-*` tokens, never a hard linear gradient and never purple/blue.
  - **Hero field:** a wide radial glow behind the headline and claim bar that fades to `ground` at the viewport edges.
  - **Feature-panel frame:** the glow is the panel's own ground, filling the rounded 12px frame edge to edge with no dark border box and no dim margin.
    - It is a deep multi-hue field, not a flat slab: an oxblood/rust base that darkens toward the corners, with one brighter ember pool behind the cards.
    - Overall it is clearly darker and less saturated than the `amber` CTA, so the accent is never spent on large areas.
    - The white `paper` cards sit on it, and they may bleed off one edge of the frame (cropped by it) for depth.
    - On mobile it stays as rich as on desktop.
- No drop shadows except on the floating nav pill (`0 8px 30px rgb(0 0 0 / .35)`) and the hero claim bar.

## Type

- **Display:** Archivo at width 62 (ExtraCondensed), weight 800, ALL CAPS, line-height 0.84 or less, tracking −0.01em, via `next/font/google` with the `wdth` axis. It is used for the hero h1, section openers and the footer wordmark only.
- **Text:** Geist, weights 400 and 500, via `next/font/google`.
- **Data:** Geist Mono for numbers that line up (counts, dates, percentages, IDs), with `tabular-nums`.

| Role | Desktop / mobile | Notes |
|---|---|---|
| hero | ~128px (clamp, cap height ≈ 110px) / fills the mobile width edge to edge | display, max 2 lines; the headline must own the first viewport like a poster |
| section | 56px / 36px | display |
| wordmark | fills container width | display, `amber` |
| title | 22px / 20px | Geist 500, −0.01em |
| body | 17px / 16px, lh 1.55 | Geist 400, `ink-muted` |
| small | 14px | Geist 400 |
| label | 12px, UPPERCASE, +0.06em | Geist 500, `ink-dim` |

No weight 700 in Geist. There are three families total, and Geist Mono appears only on numeric data (counts, dates, percentages, CGPA, IDs). Words such as `None`, `Up to 1` or `Upcoming` are set in Geist. A count phrase is set entirely in Geist Mono with tabular-nums, including its connective (`8 of 24`, `0 of 12`, `96/100`, `n = 9`); only the trailing noun after it (`done`, `items`, `verified experiences`) stays in Geist. A figure is never split across the two families.

## Shape, space, layout

- Radius: 999px for pills (CTAs, chips, nav pill), 12px for cards and panels, 20px for the claim bar.
- Spacing uses a 4px base, with sections ≥ 128px apart on desktop and 80px on mobile.
- Container max 1200px with a 24px gutter (16px on mobile). Card grids are 3-up on desktop, 1-up on mobile.
- Feature rows alternate text and glow panel. The text column is ~40% and the panel ~60%.

## Components

| Component | Spec |
|---|---|
| **Claim bar** (hero) | `paper` field, 20px radius, 88px tall on desktop. Inline it reads `[Company ▾] heavily asks [Topic ▾]` with two real `<select>`s plus a `Check claim` amber pill. While idle, example claims type themselves in; any focus stops the typing. The verdict chip appears under it. |
| **Chip** | 32px pill with `line` border and `ink` text on dark; the selected state is filled `panel-2`. |
| **Button** | `primary` is an amber pill with `paper-ink` text, 44px tall (36px sm). `secondary` is a pill with a `line` border and `ink` text. `ghost` is text with an underline on hover. |
| **Card** | `panel` fill, `line` border, 12px radius and 24px padding. Its title is the `title` role. Meta goes in a `label` or Geist Mono line, with concrete specifics (date, CGPA cut-off, rounds, n of N). |
| **Drive status** | A drive's lifecycle (`Upcoming`, `Ongoing`, `Completed`) is set in the `label` role (Geist 500, 12px, uppercase, `ink-dim`), never as a status pill and never with a dot. Status pills are reserved for evidence states: verification, verdicts and eligibility. |
| **Rumour card** | The one deliberate exception to Card, for quarantined community tips: an opaque `panel` fill (never translucent), a 1px **dashed** `line` border, 12px radius, a `Rumour · unverified` status pill, and a note that it is left out of every count. The dashed border is the visual signature of quarantine, and nothing else on the site uses it. |
| **Status pill** | An 8px glyph dot in the semantic colour plus a text label (`Verified`, `Rumour · unverified`, `Supported`, `Mixed evidence`). |
| **Nav** | At the top: full width and transparent, with the wordmark at left, links centred, and `Sign in` (secondary) and `Get started` (primary) at right. Past the hero it becomes a centred floating `paper` pill ~560px wide, with dark text, a monogram logo and a dark primary button. |
| **Footer** | Link columns, then the wordmark `BEYOND THE RUMOUR MILL` at full width in `amber`, then a legal line. |
| **Sample tag** | A small `label` chip reading `Sample data`, shown wherever seed (synthetic) experiences feed the numbers. |

## Motion (GSAP + ScrollTrigger + Lenis, one RAF)

- One easing family sitewide: `power3.out`, which is `cubic-bezier(.22,1,.36,1)` for CSS and framer-motion.
- Entrances move y 16px plus fade in, once, over 600–800ms. Staggers are 60–80ms.
- The hero h1 reveals line by line on the y axis only.
- **Nav morph:** a single ScrollTrigger-scrubbed transition from bar to pill, over 300–400ms.
- **Claim typing:** ~45ms per character, then a pause, a verdict chip fade and the next claim.
- The only loop is the claim typing (and an optional company marquee). Nothing loops behind content.
- `prefers-reduced-motion`: Lenis is off, every element shows its end state, and the typing shows one static claim.
- Only transform and opacity animate. GSAP owns scroll-linked motion; framer-motion owns hover, press and presence. No element has one property driven by both.

## Accessibility

- WCAG 2.2 AA throughout: visible 2px amber focus ring (offset 2px), keyboard operable, hit targets ≥ 44px on mobile.
- Status is never colour-only.
- Existing accessible names used by the Playwright specs are unchanged.
- Lighthouse ≥ 90 on `/`, so the motion stack loads only on the client and only for the landing page.
