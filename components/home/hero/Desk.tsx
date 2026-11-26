"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { StickyNote, type DeskRumour, type Paper } from "@/components/home/hero/StickyNote";
import { cn } from "@/lib/cn";

export type DeskBrief = { company: string; role: string; date: string; cgpa: string; backlogs: string; rounds: string };

// Three spots on the desk: paper, resting angle, position. The third note is desktop only.
const SLOTS: { paper: Paper; tilt: string; pos: string }[] = [
  { paper: "sticky", tilt: "-rotate-4", pos: "left-0 top-[18%] md:top-[16%]" },
  { paper: "kraft", tilt: "rotate-3", pos: "right-0 top-[48%] md:top-[30%]" },
  { paper: "white", tilt: "-rotate-2", pos: "hidden md:block md:left-[22%] md:bottom-[2%]" },
];
const BEAT = 2.4; // seconds between stamps

/**
 * "The desk": rumour notes lying on top of a prep brief. Every 2.4s the next
 * note lifts, its verdict stamp slams down and the desk jolts 2px; after the
 * last one the stamps fade and the next rumours are dealt. Hover pauses it.
 * The notes and the brief drift against the cursor (10px and 4px). Under
 * reduced motion: the first notes, already stamped, and nothing moves.
 */
export function Desk({ sets, brief }: { sets: DeskRumour[][]; brief: DeskBrief | null }) {
  const root = useRef<HTMLDivElement>(null);
  const loop = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const off: (() => void)[] = [];

    const ctx = gsap.context(() => {
      // Only the slots shown at this width (the third is hidden on phones).
      const slots = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-slot]")).filter((s) => s.offsetParent !== null);
      const notesOf = (set: number) => slots.map((s) => s.querySelectorAll<HTMLElement>("[data-note]")[set]).filter(Boolean);
      const tl = gsap.timeline({ repeat: -1, delay: 1.2 }); // first stamp lands as the entrance ends
      let top = 10;

      sets.forEach((_, set) => {
        const notes = notesOf(set);
        notes.forEach((note) => {
          const start = tl.duration();
          // The lifted note comes to the front, so its stamp is never under a neighbour.
          tl.set(note.closest("[data-slot]"), { zIndex: () => ++top }, start)
            .to(note, { y: -8, duration: 0.25, ease: "power2.out" }, start)
            .fromTo(note.querySelector("[data-stamp]"), { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power3.in", immediateRender: false }, start + 0.25)
            .to(el, { keyframes: { x: [0, 2, -2, 1, 0] }, duration: 0.16, ease: "none" }, start + 0.37)
            .to(note, { y: 0, duration: 0.45, ease: "back.out(2)" }, start + 0.37)
            .set({}, {}, start + BEAT);
        });
        // All stamped: lift the stamps off, deal the next rumours.
        tl.to(notes.map((n) => n.querySelector("[data-stamp]")), { opacity: 0, duration: 0.3 }, ">-1.2");
        if (sets.length > 1) {
          const next = notesOf((set + 1) % sets.length);
          tl.to(notes, { autoAlpha: 0, y: -12, duration: 0.25, stagger: 0.05 })
            .fromTo(next, { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "back.out(1.8)", stagger: 0.07, immediateRender: false })
            .set({}, {}, "+=0.4");
        }
      });
      loop.current = tl;

      // Parallax, fine pointers only: layers drift against the cursor by their data-depth in px.
      if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const layers = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-depth]")).map((l) => ({
          d: Number(l.dataset.depth),
          x: gsap.quickTo(l, "x", { duration: 0.7, ease: "power3" }),
          y: gsap.quickTo(l, "y", { duration: 0.7, ease: "power3" }),
        }));
        const move = (e: PointerEvent) => {
          const nx = e.clientX / innerWidth - 0.5;
          const ny = e.clientY / innerHeight - 0.5;
          for (const l of layers) {
            l.x(-nx * 2 * l.d);
            l.y(-ny * 2 * l.d);
          }
        };
        window.addEventListener("pointermove", move);
        off.push(() => window.removeEventListener("pointermove", move));
      }
    }, el);

    return () => {
      off.forEach((f) => f());
      loop.current = null;
      ctx.revert();
    };
  }, [sets]);

  return (
    <div ref={root} className="relative h-full min-h-0" onPointerEnter={() => loop.current?.pause()} onPointerLeave={() => loop.current?.resume()}>
      {brief && (
        <div data-depth="4" className="absolute top-0 right-0 w-[88%] md:right-[6%] md:w-[80%]">
          <BriefSheet brief={brief} />
        </div>
      )}
      {SLOTS.map((slot, i) => (
        <div key={i} data-slot data-depth="10" className={cn("absolute md:[@media(max-height:800px)]:scale-[0.86]", slot.pos)}>
          <div className={cn("relative", slot.tilt, "motion-safe:desk-drop")} style={{ "--d": `${0.6 + i * 0.07}s` } as CSSProperties}>
            {sets.map((set, s) =>
              set[i] ? <StickyNote key={s} rumour={set[i]} paper={slot.paper} className={s > 0 ? "invisible absolute! inset-x-0 top-0 opacity-0" : undefined} /> : null,
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The white prep-brief form peeking out from under the notes: real fields from the next drive. */
function BriefSheet({ brief }: { brief: DeskBrief }) {
  const fields = [
    ["Date", brief.date],
    ["CGPA", brief.cgpa],
    ["Backlogs", brief.backlogs],
    ["Rounds", brief.rounds],
  ];
  return (
    <div aria-hidden="true" className="rotate-[1.5deg] rounded-[2px] border border-line bg-surface shadow-[var(--shadow-object)] motion-safe:hero-fade [--d:0.45s]">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
        <span className="type-label text-ink">Prep brief</span>
        <span className="type-label text-ink-2">{brief.role}</span>
      </div>
      <div className="px-5 pt-4 pb-24">
        <p className="font-serif text-[40px] leading-none tracking-[-0.02em] text-ink">{brief.company}</p>
        <dl className="mt-4 grid grid-cols-4 border-t border-l border-line">
          {fields.map(([label, value]) => (
            <div key={label} className="border-r border-b border-line px-2.5 py-2">
              <dt className="type-label text-ink-2">{label}</dt>
              <dd className="mt-1 font-serif text-[17px] leading-tight whitespace-nowrap text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-2.5">
          <span className="type-label text-ink-2">What verified experiences mention</span>
          <span className="h-px w-full bg-line" />
          <span className="h-px w-full bg-line" />
          <span className="h-px w-full bg-line" />
        </div>
      </div>
    </div>
  );
}
