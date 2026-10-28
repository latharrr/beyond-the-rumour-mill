import { CheckIcon } from "@/components/icons";
import { ResourceLink } from "@/components/ui/pill";
import { cn } from "@/lib/cn";
import type { PlanItem } from "@/lib/data/plans";

/** One plan item: a checkbox whose state comes from the optimistic list in Checklist. */
export function ChecklistItem({ item, onToggle, disabled }: { item: PlanItem; onToggle: (done: boolean) => void; disabled?: boolean }) {
  return (
    <li data-done={item.done} className="px-5 py-3 md:px-6">
      <label className="group flex min-h-11 cursor-pointer items-center gap-3.5">
        <span className="relative grid size-[22px] shrink-0 place-items-center">
          <input
            type="checkbox"
            checked={item.done}
            disabled={disabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="peer size-[22px] cursor-pointer appearance-none rounded-md border border-white/25 transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-out-3)] group-hover:border-white/50 checked:border-verified checked:bg-verified active:scale-90"
          />
          <CheckIcon
            aria-hidden="true"
            className="pointer-events-none absolute size-3.5 text-paper-ink opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
            strokeWidth={2.75}
          />
        </span>
        <span className={cn("text-[15px] transition-colors duration-200", item.done ? "text-ink-dim line-through decoration-ink-dim" : "text-ink")}>
          {item.label}
        </span>
      </label>
      {item.resources.length > 0 && (
        <ul className="ml-[36px] grid">
          {item.resources.map((r) => (
            <li key={r.id}>
              <ResourceLink href={r.url} title={r.title} type={r.type} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
