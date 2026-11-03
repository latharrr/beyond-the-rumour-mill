"use client";

import { type FormEvent, useState } from "react";
import { pillPrimary } from "@/components/ui/pill";
import { card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";

// Questions a teacher is likely to ask; one click sends them.
const SUGGESTIONS = [
  "Explain the folder structure and how it maps to the three P08 modules.",
  "How does the rumour check decide Supported, Mixed or Not supported?",
  "Where do we use useOptimistic, useContext and React.memo?",
  "How are routes protected and how does role-based access work?",
  "Where is SSG, caching and revalidation used?",
  "How is a prep plan generated from a drive and verified experiences?",
];

type Status = "idle" | "loading" | "error";

/** Question box for /ask: POSTs to /api/ask and shows the answer as it streams in. */
export function AskBox() {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function ask(q: string) {
    if (status === "loading") return;
    setAsked(q);
    setAnswer("");
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }
      // Read the streamed text chunk by chunk and append it, so the answer types itself out.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (question.trim().length >= 3) ask(question.trim());
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={onSubmit} className={cn(card, "grid gap-4 p-5 md:p-6")}>
        <label htmlFor="question" className="type-small text-ink-muted">
          Ask anything about this project&rsquo;s code, design or syllabus mapping
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a new line.
            if (e.key === "Enter" && !e.shiftKey) onSubmit(e);
          }}
          rows={3}
          maxLength={1000}
          placeholder="e.g. Where is the Proxy and what does it protect?"
          className="w-full resize-y text-[16px] text-ink"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="type-small text-ink-dim">Enter to send · Shift+Enter for a new line</span>
          <button type="submit" disabled={status === "loading" || question.trim().length < 3} className={pillPrimary}>
            {status === "loading" ? "Thinking…" : "Ask"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={status === "loading"}
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
            className="rounded-full border border-line px-3 py-1.5 text-left text-[13px] text-ink-muted transition-colors hover:bg-panel-2 hover:text-ink disabled:opacity-60"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Answer area: loading, error and answer states. aria-live reads new text to screen readers. */}
      {(asked || error) && (
        <section aria-live="polite" className={cn(card, "p-5 md:p-6")}>
          {asked && <p className="type-small text-ink-dim">Q: {asked}</p>}
          {error ? (
            <p role="alert" className="mt-3 type-body text-rumour">
              {error}
            </p>
          ) : (
            <p className="mt-3 type-body whitespace-pre-wrap text-ink">
              {answer || (status === "loading" && <span className="text-ink-dim motion-safe:animate-pulse">Reading the code…</span>)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
