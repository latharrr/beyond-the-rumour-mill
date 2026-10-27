export function VerifiedBadge({ verifiedAt }: { verifiedAt: string | null }) {
  return (
    <span data-badge="verified">
      Verified by placement cell{verifiedAt && <> on <time dateTime={verifiedAt}>{verifiedAt.slice(0, 10)}</time></>}
    </span>
  );
}
