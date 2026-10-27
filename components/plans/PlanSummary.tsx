import Link from "next/link";
import type { PlanDetail, PlanSummary as PlanSummaryData } from "@/lib/data/plans";

/** Dashboard card: drive, date, progress derived from plan_items. */
export function PlanSummary({ plan }: { plan: PlanSummaryData }) {
  return (
    <article>
      <h3>
        <Link href={`/dashboard/plans/${plan.id}`}>{plan.drive.title}</Link>
      </h3>
      <p>
        {plan.drive.company}
        {plan.drive.drive_date && <> · drive on <time dateTime={plan.drive.drive_date}>{plan.drive.drive_date}</time></>}
      </p>
      <p>{plan.done} of {plan.total} done</p>
      <progress value={plan.done} max={plan.total || 1} aria-label={`${plan.drive.title} progress`} />
    </article>
  );
}

/** Plan page header: provenance and export. */
export function PlanHeader({ plan }: { plan: PlanDetail }) {
  const weeks = new Set(plan.items.map((i) => i.week)).size;
  return (
    <header>
      <h1>Prep plan: {plan.drive.title}</h1>
      <p>
        {plan.drive.company} · {plan.drive.role} ·{" "}
        {plan.drive.drive_date ? <>drive on <time dateTime={plan.drive.drive_date}>{plan.drive.drive_date}</time></> : "drive date not announced"}
        {" "}· {plan.items.length} topics over {weeks} week{weeks === 1 ? "" : "s"}
      </p>
      <p>
        <a href={`/api/plans/${plan.id}/export`} download>Export as Markdown</a>
        {" · "}
        <Link href={`/drives/${plan.drive.id}`}>Back to the drive</Link>
      </p>
    </header>
  );
}
