import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { STATUS_LABEL } from "@/components/drives/DriveCard";
import { DriveForm } from "@/components/drives/DriveForm";
import { FormMessage } from "@/components/ui/field";
import { ArrowLink, textLink } from "@/components/ui/pill";
import { card, EmptyState, PageHeader, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { getDrive, listDrives } from "@/lib/data/drives";
import { listBranches, listCompanies, listResources, listRoles, listTopics } from "@/lib/data/taxonomy";
import { formatDriveDate } from "@/lib/format";

export const metadata: Metadata = { title: "Manage drives" };

// Drive CRUD (§3.1). ?edit=<id> switches the form to edit mode.
export default function AdminDrivesPage({ searchParams }: PageProps<"/admin/drives">) {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <PageHeader title="Manage drives" lede="Publish a drive with its eligibility rules and rounds. Students see it on /drives straight away." />
      <Suspense fallback={<div role="status" aria-label="Loading drives" className={cn(card, "h-[600px] animate-pulse")} />}>
        <DriveAdmin searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function DriveAdmin({ searchParams }: Pick<PageProps<"/admin/drives">, "searchParams">) {
  const { edit } = await searchParams;
  const [drives, companies, roles, branches, topics, resources, editing] = await Promise.all([
    listDrives(),
    listCompanies(),
    listRoles(),
    listBranches(),
    listTopics(),
    listResources(),
    typeof edit === "string" ? getDrive(edit) : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-12">
      <section aria-labelledby="all-drives" className="min-w-0">
        <h2 id="all-drives" className="type-title text-ink">
          All drives <span className="type-data text-ink-dim">({drives.length})</span>
        </h2>
        {drives.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No drives yet.">Create the first one with the form.</EmptyState>
          </div>
        ) : (
          <div className={cn(card, "mt-4 overflow-x-auto")}>
            <table className="w-full min-w-[520px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-line">
                  {["Title", "Company", "Date", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 type-label font-medium text-ink-dim">
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {drives.map((d) => (
                  <tr key={d.id} className={cn("transition-colors duration-150 hover:bg-panel-2", editing?.id === d.id && "bg-panel-2")}>
                    <td className="px-4 py-3">
                      <Link href={`/drives/${d.id}`} className="text-ink underline-offset-4 hover:underline">
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{d.company.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {d.drive_date ? <span className="type-data">{formatDriveDate(d.drive_date)}</span> : "TBA"}
                    </td>
                    <td className="px-4 py-3 type-label text-ink-dim">{STATUS_LABEL[d.status]}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/drives?edit=${d.id}#drive-form`} className={cn(textLink, "hit-44")}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div id="drive-form" className="grid max-w-[860px] min-w-0 scroll-mt-24 gap-4">
        {edit && !editing && <FormMessage ok={false}>That drive no longer exists.</FormMessage>}
        {editing && <ArrowLink href="/admin/drives#drive-form">Create a new drive instead</ArrowLink>}
        <DriveForm drive={editing ?? undefined} companies={companies} roles={roles} branches={branches} topics={topics} resources={resources} />
      </div>
    </div>
  );
}
