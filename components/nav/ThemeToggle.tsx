"use client";

/**
 * Light / dark switch.
 *
 * The current theme lives on <html data-theme="...">, not in React state:
 * the script in app/layout.tsx sets it before React loads, and globals.css
 * reads it. So this button only has to flip that attribute and remember the
 * choice. Which icon shows is pure CSS (the `light:` variant), so the server
 * and browser render the same markup and there is no hydration mismatch.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next); // remembered for the next visit
    } catch {
      // Private mode can block storage; the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="grid size-11 place-items-center rounded-full text-ink-muted transition-colors hover:bg-panel-2 hover:text-ink"
    >
      {/* Moon in dark mode, sun in light mode. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 light:hidden" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden size-5 light:block" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
