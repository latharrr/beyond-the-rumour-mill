---
version: 1
slug: "app-public-page-tsx"
primary_target: "app/(public)/page.tsx"
related_targets: []
---

# Surface: landing (`/`)

- **Mode:** Persuade.
- **Audience:** LPU juniors before a campus drive.
- **Job:** make them believe this replaces rumours with evidence, then start them on it: check a claim, browse drives, get a plan.
- **Proof:** live DB numbers, tagged "Sample data" while the seed is synthetic, with a clean empty state on prod.
- **Constraints:** Lighthouse ≥ 90, existing routes and accessible names, no invented testimonials, user counts or endorsements.

## Direction contract

THESIS: Turn the rumour itself into the interface. The hero is a claim being checked live against verified experiences. This refuses the category default of a gradient headline, a purple CTA, a logo wall and a feature-icon grid.

OWN-WORLD: An ember/rust/oxblood glow cools into a #111114 evidence desk. Display is condensed Archivo 800 in all caps; Geist carries the text and Geist Mono the data. The one accent is an amber pill. Content sits on hairline 12px dark cards that carry real drive and topic specifics. Status uses dot-plus-label pills (Verified / Rumour). The footer is a full-width amber wordmark.

STORY: The visitor learns that the claims they've heard can be checked. They come to believe that the numbers come from verified seniors, with rumours quarantined. They then act: check a claim, open a drive, or sign up for a plan.

FIRST VIEWPORT: At 1440, a transparent nav, then a centred two-line poster h1 (~96px). One supporting line sits under it. Below that is the paper claim bar, ~920×88, reading `[TCS ▾] heavily asks [Topic ▾]` with an amber Check claim pill. Example claims type in, and a verdict chip shows beneath. A chip row offers TCS, Infosys and Amazon. Behind everything, the ember glow fades to the ground at the edges.

FORM: Pinned by the user. The structure follows the Handshake homepage bar (docs/design/bar.md); concept-seed key 56cb8753 was overridden by the user's pinned reference.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
