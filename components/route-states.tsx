"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

// Shared loading / error / not-found screens used by each route group's
// special files and by in-page <Suspense> fallbacks.

const pill = "inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-medium whitespace-nowrap";

/** Inline status line for a <Suspense> fallback. */
export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("flex items-center gap-2.5 py-6 type-small text-ink-muted", className)}>
      <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-ink-dim" />
      {label}
    </p>
  );
}

/** Whole-page skeleton for a group's loading.tsx: header, then a card grid. */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="container-page pt-10 pb-24 md:pt-16">
      <p role="status" aria-live="polite" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-3 w-28 rounded-full bg-panel-2" />
        <div className="mt-5 h-10 w-2/3 max-w-[520px] rounded-lg bg-panel md:h-12" />
        <div className="mt-6 h-4 w-full max-w-[560px] rounded-full bg-panel" />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[220px] rounded-[var(--radius-card)] border border-line bg-panel" />
          ))}
        </div>
      </div>
    </main>
  );
}

function StateScreen({ label, title, children, actions }: { label: string; title: string; children: React.ReactNode; actions: React.ReactNode }) {
  return (
    <main className="container-page flex min-h-[56svh] flex-col justify-center py-20 motion-safe:animate-rise md:py-28">
      <p className="type-label text-ink-dim">{label}</p>
      <h1 className="mt-4 max-w-[16ch] type-section text-balance text-ink">{title}</h1>
      <div className="mt-5 max-w-[56ch] type-body text-pretty text-ink-muted">{children}</div>
      <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
    </main>
  );
}

export function ErrorState({ error, retry, homeHref = "/" }: { error: unknown; retry: () => void; homeHref?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert">
      <StateScreen
        label="Error"
        title="Something went wrong"
        actions={
          <>
            <button type="button" onClick={() => retry()} className={cn(pill, "bg-amber text-paper-ink")}>
              Try again
            </button>
            <Link href={homeHref} className={cn(pill, "border border-line text-ink transition-colors duration-200 hover:bg-panel")}>
              Go back
            </Link>
          </>
        }
      >
        <p>Please try again. If it keeps happening, come back in a few minutes.</p>
      </StateScreen>
    </div>
  );
}

export function NotFoundState({ message, homeHref = "/", homeLabel = "Go home" }: { message: string; homeHref?: string; homeLabel?: string }) {
  return (
    <StateScreen
      label="404"
      title="Not found"
      actions={
        <>
          <Link href={homeHref} className={cn(pill, "bg-amber text-paper-ink")}>
            {homeLabel}
          </Link>
          {homeHref !== "/drives" && (
            <Link href="/drives" className={cn(pill, "border border-line text-ink transition-colors duration-200 hover:bg-panel")}>
              Browse drives
            </Link>
          )}
        </>
      }
    >
      <p>{message}</p>
    </StateScreen>
  );
}
