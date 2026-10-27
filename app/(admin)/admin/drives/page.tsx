import Link from "next/link";
import { Suspense } from "react";
import { DriveForm } from "@/components/drives/DriveForm";
import { LoadingState } from "@/components/route-states";
import { getDrive, listDrives } from "@/lib/data/drives";
import { listBranches, listCompanies, listResources, listRoles, listTopics } from "@/lib/data/taxonomy";

// Drive CRUD (§3.1). ?edit=<id> switches the form to edit mode.
export default function AdminDrivesPage({ searchParams }: PageProps<"/admin/drives">) {
  return (
    <main>
      <h1>Manage drives</h1>
      <Suspense fallback={<LoadingState label="Loading drives…" />}>
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
    <>
      {edit && !editing && <p role="alert">That drive no longer exists.</p>}
      {editing && <p><Link href="/admin/drives">Create a new drive instead</Link></p>}
      <DriveForm drive={editing ?? undefined} companies={companies} roles={roles} branches={branches} topics={topics} resources={resources} />

      <h2>All drives</h2>
      {drives.length === 0 ? (
        <p>No drives yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Title</th><th>Company</th><th>Date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody>
            {drives.map((d) => (
              <tr key={d.id}>
                <td><Link href={`/drives/${d.id}`}>{d.title}</Link></td>
                <td>{d.company.name}</td>
                <td>{d.drive_date ?? "TBA"}</td>
                <td>{d.status}</td>
                <td><Link href={`/admin/drives?edit=${d.id}`}>Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
