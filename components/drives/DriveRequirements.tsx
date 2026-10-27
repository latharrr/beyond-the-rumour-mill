import type { DriveSummary } from "@/lib/data/drives";

/** The drive's official requirements, as published by the placement cell. */
export function DriveRequirements({ drive, branchCodes }: { drive: DriveSummary; branchCodes: Record<string, string> }) {
  return (
    <dl>
      <dt>Minimum CGPA</dt>
      <dd>{drive.eligibility_cgpa != null ? drive.eligibility_cgpa.toFixed(2) : "No cutoff"}</dd>
      <dt>Active backlogs allowed</dt>
      <dd>{drive.max_backlogs}</dd>
      <dt>10th / 12th minimum</dt>
      <dd>
        {drive.min_10th_pct != null ? `${drive.min_10th_pct}%` : "None"} / {drive.min_12th_pct != null ? `${drive.min_12th_pct}%` : "None"}
      </dd>
      <dt>Branches</dt>
      <dd>{drive.branch_ids.length ? drive.branch_ids.map((id) => branchCodes[id] ?? "?").join(", ") : "All branches"}</dd>
      <dt>Batches</dt>
      <dd>{drive.grad_years.length ? drive.grad_years.join(", ") : "All batches"}</dd>
    </dl>
  );
}
