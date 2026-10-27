import { Suspense } from "react";
import { SubmitWizard } from "@/components/experiences/SubmitWizard";
import { LoadingState } from "@/components/route-states";
import { listDrives } from "@/lib/data/drives";
import { listCompanies, listResources, listRoles, listTopics } from "@/lib/data/taxonomy";

// Auth required (proxy). Submissions go to the verification queue.
export default function NewExperiencePage() {
  return (
    <main>
      <h1>Share your experience</h1>
      <p>
        Juniors&rsquo; prep plans are built from verified experiences like yours. Your name is never shown; verified
        experiences appear as &ldquo;Placed senior · Batch of &lt;year&gt;&rdquo;.
      </p>
      <Suspense fallback={<LoadingState label="Loading form…" />}>
        <Form />
      </Suspense>
    </main>
  );
}

async function Form() {
  const [companies, roles, drives, topics, resources] = await Promise.all([
    listCompanies(),
    listRoles(),
    listDrives(),
    listTopics(),
    listResources(),
  ]);
  return (
    <SubmitWizard
      companies={companies}
      roles={roles}
      drives={drives.map(({ id, title, company_id, role_id }) => ({ id, title, company_id, role_id }))}
      topics={topics}
      resources={resources}
    />
  );
}
