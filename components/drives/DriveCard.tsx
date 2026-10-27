import Link from "next/link";
import type { DriveSummary } from "@/lib/data/drives";
import type { EligibilityResult } from "@/lib/eligibility";
import { EligibilityBadge } from "./EligibilityBadge";

export function DriveCard({ drive, eligibility }: { drive: DriveSummary; eligibility: EligibilityResult | null }) {
  return (
    <article>
      <h2>
        <Link href={`/drives/${drive.id}`}>{drive.title}</Link>
      </h2>
      <p>
        {drive.company.name} · {drive.role.label}
      </p>
      <p>
        {drive.drive_date ? <time dateTime={drive.drive_date}>{drive.drive_date}</time> : "Date to be announced"}
        {drive.location ? ` · ${drive.location}` : ""} · {drive.status}
      </p>
      <EligibilityBadge eligibility={eligibility} />
    </article>
  );
}
