import { CheckIcon, CloseIcon } from "@/components/icons";
import type { DriveSummary } from "@/lib/data/drives";
import type { EligibilityResult, PredicateKey, PredicateResult } from "@/lib/eligibility";
import { formatCgpa } from "@/lib/format";
import type { ReactNode } from "react";

const mono = (v: ReactNode) => <span className="type-data">{v}</span>;

/**
 * The drive's official requirements, as published by the placement cell.
 * With `eligibility`, each row also shows whether the student's profile meets it
 * (glyph plus screen-reader text, never colour alone); the reasons are in the explainer.
 */
export function DriveRequirements({
  drive,
  branchCodes,
  eligibility = null,
}: {
  drive: DriveSummary;
  branchCodes: Record<string, string>;
  eligibility?: EligibilityResult | null;
}) {
  const result = new Map(eligibility?.predicates.map((p) => [p.key, p]));
  const rows: { key: PredicateKey; label: string; value: ReactNode }[] = [
    { key: "cgpa", label: "Minimum CGPA", value: drive.eligibility_cgpa != null ? mono(formatCgpa(drive.eligibility_cgpa)) : "No cutoff" },
    {
      key: "backlogs",
      label: "Active backlogs",
      value: drive.max_backlogs <= 0 ? "None allowed" : <>Up to {mono(drive.max_backlogs)}</>,
    },
    { key: "pct_10th", label: "10th minimum", value: drive.min_10th_pct != null ? mono(`${drive.min_10th_pct}%`) : "None" },
    { key: "pct_12th", label: "12th minimum", value: drive.min_12th_pct != null ? mono(`${drive.min_12th_pct}%`) : "None" },
    {
      key: "branch",
      label: "Branches",
      value: drive.branch_ids.length ? drive.branch_ids.map((id) => branchCodes[id] ?? "?").join(", ") : "All branches",
    },
    { key: "grad_year", label: "Batches", value: drive.grad_years.length ? mono(drive.grad_years.join(", ")) : "All batches" },
  ];

  return (
    <dl className="divide-y divide-line">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="type-small text-ink-muted">{r.label}</dt>
          <dd className="flex items-center gap-2.5 text-right text-[15px] text-ink">
            {r.value}
            {eligibility && <Mark result={result.get(r.key)} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Mark({ result }: { result?: PredicateResult }) {
  if (!result) return null;
  if (result.pass)
    return (
      <span className="grid size-5 place-items-center rounded-full bg-verified/15 text-verified">
        <CheckIcon className="size-3.5" strokeWidth={2.25} />
        <span className="sr-only">You meet this</span>
      </span>
    );
  if (result.incomplete)
    return (
      <span className="grid size-5 place-items-center rounded-full bg-mixed/15 text-[12px] font-medium text-mixed">
        <span aria-hidden="true">?</span>
        <span className="sr-only">Missing from your profile</span>
      </span>
    );
  return (
    <span className="grid size-5 place-items-center rounded-full bg-rumour/15 text-rumour">
      <CloseIcon className="size-3.5" strokeWidth={2.25} />
      <span className="sr-only">You don&rsquo;t meet this</span>
    </span>
  );
}
