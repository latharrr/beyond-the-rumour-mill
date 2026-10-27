"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shared, unstyled loading / error / not-found fallbacks used by each route
// group's special files. Visual design comes in the UI pass.

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" aria-live="polite">
      {label}
    </p>
  );
}

export function ErrorState({ error, retry, homeHref = "/" }: { error: unknown; retry: () => void; homeHref?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>Please try again. If it keeps happening, come back in a few minutes.</p>
      <button type="button" onClick={() => retry()}>
        Try again
      </button>
      <Link href={homeHref}>Go back</Link>
    </div>
  );
}

export function NotFoundState({ message, homeHref = "/", homeLabel = "Go home" }: { message: string; homeHref?: string; homeLabel?: string }) {
  return (
    <div>
      <h2>Not found</h2>
      <p>{message}</p>
      <Link href={homeHref}>{homeLabel}</Link>
    </div>
  );
}
