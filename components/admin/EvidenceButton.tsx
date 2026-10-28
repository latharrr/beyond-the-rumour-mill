"use client";

import { useState, useTransition } from "react";
import { getEvidenceUrl } from "@/app/_actions/experiences";
import { ExternalIcon } from "@/components/icons";
import { FormMessage } from "@/components/ui/field";
import { Button, textLink } from "@/components/ui/pill";

/** Fetches a fresh 60 s signed URL on click and opens it; nothing is cached. */
export function EvidenceButton({ experienceId }: { experienceId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div className="grid gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        className="w-full"
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
      </Button>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`${textLink} inline-flex items-center gap-1.5 type-small`}>
          Evidence link (expires in 60 s)
          <ExternalIcon className="size-3.5" />
        </a>
      )}
      {error && <FormMessage ok={false}>{error}</FormMessage>}
    </div>
  );
}
