"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const COUNT = 12;
const src = (n: number) => `/viva/slide-${String(n).padStart(2, "0")}.png`;
const BTN =
  "rounded border border-line px-4 py-2 type-label text-ink hover:bg-panel disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2";

// Slide viewer for the viva deck: prev/next, arrow keys, fullscreen.
export function SlideViewer() {
  const [i, setI] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const go = useCallback((d: number) => setI((n) => Math.min(COUNT, Math.max(1, n + d))), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen?.();
  };

  return (
    <div ref={box} className="flex flex-col gap-4 bg-panel p-0">
      <div className="relative aspect-video w-full overflow-hidden rounded border border-line bg-white">
        <Image
          key={i}
          src={src(i)}
          alt={`Slide ${i} of ${COUNT}`}
          fill
          unoptimized
          priority
          sizes="100vw"
          className="object-contain"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className={BTN} onClick={() => go(-1)} disabled={i === 1} aria-label="Previous slide">
            Previous
          </button>
          <span className="type-label text-ink-dim" aria-live="polite">
            {i} / {COUNT}
          </span>
          <button type="button" className={BTN} onClick={() => go(1)} disabled={i === COUNT} aria-label="Next slide">
            Next
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className={BTN} onClick={fullscreen}>
            Fullscreen
          </button>
          <a className={BTN} href="/ppt/download">
            Download PPTX
          </a>
        </div>
      </div>
      <link rel="preload" as="image" href={src(Math.min(COUNT, i + 1))} />
    </div>
  );
}
