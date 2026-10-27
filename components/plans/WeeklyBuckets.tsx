import type { ReactNode } from "react";
import { weeksOf } from "@/lib/export";

/** Groups items into "Week n" sections; the caller renders each item. */
export function WeeklyBuckets<T extends { id: string; week: number; position: number }>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <>
      {weeksOf(items).map(([week, inWeek]) => (
        <section key={week} aria-labelledby={`week-${week}`}>
          <h3 id={`week-${week}`}>Week {week}</h3>
          <ul>{inWeek.map(renderItem)}</ul>
        </section>
      ))}
    </>
  );
}
