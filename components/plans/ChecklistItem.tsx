import type { PlanItem } from "@/lib/data/plans";

/** One plan item: a checkbox whose state comes from the optimistic list in Checklist. */
export function ChecklistItem({ item, onToggle, disabled }: { item: PlanItem; onToggle: (done: boolean) => void; disabled?: boolean }) {
  return (
    <li data-done={item.done}>
      <label>
        <input type="checkbox" checked={item.done} disabled={disabled} onChange={(e) => onToggle(e.target.checked)} />
        {item.label}
      </label>
      {item.resources.length > 0 && (
        <ul>
          {item.resources.map((r) => (
            <li key={r.id}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> ({r.type})
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
