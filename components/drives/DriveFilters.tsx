import Link from "next/link";
import { Button, textLink } from "@/components/ui/pill";
import { card } from "@/components/ui/surface";
import { checkbox, input, label, select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { Company } from "@/lib/data/taxonomy";
import type { DriveFilters as Filters } from "@/lib/schemas";

/** Plain GET form: filters live in the URL (searchParams), so results are shareable and server-rendered. */
export function DriveFilters({ companies, filters, signedIn }: { companies: Company[]; filters: Filters; signedIn: boolean }) {
  const active = !!(filters.q || filters.company || filters.eligibleOnly);
  return (
    <form method="get" action="/drives" role="search" className={cn(card, "grid gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-end")}>
      <div>
        <label htmlFor="q" className={label}>
          Search
        </label>
        <input id="q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Company, role or drive" className={cn(input, "mt-2")} />
      </div>

      <div>
        <label htmlFor="company" className={label}>
          Company
        </label>
        <select id="company" name="company" defaultValue={filters.company ?? ""} className={cn(select, "mt-2")}>
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:h-11">
        <label className={cn("flex min-h-11 items-center gap-2.5 type-small text-ink", !signedIn && "text-ink-muted")}>
          <input type="checkbox" name="eligibleOnly" value="1" defaultChecked={filters.eligibleOnly} disabled={!signedIn} className={checkbox} />
          Only drives I&rsquo;m eligible for{!signedIn && " (sign in first)"}
        </label>
        <div className="flex items-center gap-4">
          <Button type="submit">Apply filters</Button>
          {active && (
            <Link href="/drives" className={cn(textLink, "type-small")}>
              Clear
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
