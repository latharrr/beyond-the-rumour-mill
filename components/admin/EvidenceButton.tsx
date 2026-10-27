"use client";

import { useState, useTransition } from "react";
import { getEvidenceUrl } from "@/app/_actions/experiences";

/** Fetches a fresh 60 s signed URL on click and opens it; nothing is cached. */
export function EvidenceButton({ experienceId }: { experienceId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await getEvidenceUrl(experienceId);
            if (res.ok) {
              setUrl(res.data.url);
              window.open(res.data.url, "_blank", "noopener,noreferrer");
            } else setError(res.message);
          })
        }
      >
        {pending ? "Opening…" : "View evidence"}
      </button>
      {url && <p><a href={url} target="_blank" rel="noopener noreferrer">Evidence link (expires in 60 s)</a></p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
