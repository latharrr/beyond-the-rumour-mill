import { StatusPill } from "@/components/ui/status";
import { formatDriveDate } from "@/lib/format";

/** "Verified" status pill, with the verification date when `long`. */
export function VerifiedBadge({ verifiedAt, long = false }: { verifiedAt: string | null; long?: boolean }) {
  return (
    <span data-badge="verified" className="inline-flex">
      <StatusPill tone="verified">
        {long ? "Verified by project admin" : "Verified"}
        {long && verifiedAt && (
          <>
            {" "}
            <span className="font-normal text-ink-muted">
              on{" "}
              <time dateTime={verifiedAt} className="type-data">
                {formatDriveDate(verifiedAt.slice(0, 10))}
              </time>
            </span>
          </>
        )}
      </StatusPill>
    </span>
  );
}
