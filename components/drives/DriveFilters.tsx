import type { Company } from "@/lib/data/taxonomy";
import type { DriveFilters as Filters } from "@/lib/schemas";

/** Plain GET form: filters live in the URL (searchParams), so results are shareable and server-rendered. */
export function DriveFilters({ companies, filters, signedIn }: { companies: Company[]; filters: Filters; signedIn: boolean }) {
  return (
    <form method="get" action="/drives" role="search">
      <label htmlFor="q">Search</label>
      <input id="q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Company, role or drive" />

      <label htmlFor="company">Company</label>
      <select id="company" name="company" defaultValue={filters.company ?? ""}>
        <option value="">All companies</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <label>
        <input type="checkbox" name="eligibleOnly" value="1" defaultChecked={filters.eligibleOnly} disabled={!signedIn} />
        Only drives I&rsquo;m eligible for{!signedIn && " (sign in first)"}
      </label>

      <button type="submit">Apply filters</button>
    </form>
  );
}
