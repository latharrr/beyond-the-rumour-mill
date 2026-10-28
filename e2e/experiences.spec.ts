import { expect, test } from "@playwright/test";
import { createE2EUser, deleteE2EUser, serviceClient, signIn } from "./supabase";

test("alumni submits → tip lane → admin verifies → appears in the verified list", async ({ browser }) => {
  const [alumni, admin] = await Promise.all([createE2EUser("exp-alumni", "alumni"), createE2EUser("exp-admin", "admin")]);
  const summary = `E2E ${Date.now()}: NQT online test with pseudocode, then a technical round on OOP and DBMS.`;
  try {
    const student = await browser.newPage();
    await signIn(student, alumni.email, "/experiences/new");
    await expect(student.getByRole("heading", { name: "Share your experience" })).toBeVisible();

    // Client-side validation before anything is sent.
    await student.getByRole("button", { name: "Submit for verification" }).click();
    await expect(student.getByText("Choose a company")).toHaveCount(2); // option + error
    await student.getByLabel("Company", { exact: true }).selectOption({ label: "TCS" });
    await student.getByLabel("Role").selectOption({ label: "Systems Engineer (SE, Ninja)" });
    await student.getByLabel("What happened in each round?").fill(summary);
    await student.getByLabel("Search topics").fill("pseudo");
    await student.getByRole("checkbox", { name: /Pseudocode/ }).check();
    await student.getByLabel("Evidence: offer letter").setInputFiles({
      name: "offer.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%e2e\n"),
    });
    await student.getByRole("button", { name: "Submit for verification" }).click();
    await expect(student.getByRole("heading", { name: "Thanks for sharing" })).toBeVisible();

    await student.goto("/experiences");
    const tips = student.getByRole("region", { name: "Community tips" });
    await expect(tips.getByText("Unverified — treat as rumour")).toBeVisible();
    await expect(tips.getByText(summary)).toBeVisible();
    await expect(student.getByRole("region", { name: "Verified experiences" }).getByText(summary)).toHaveCount(0);
    await student.close();

    const adminPage = await browser.newPage();
    await signIn(adminPage, admin.email, "/admin");
    const item = adminPage.getByRole("article").filter({ hasText: summary });
    await expect(item.getByRole("button", { name: "View evidence" })).toBeVisible();
    await item.getByRole("button", { name: "View evidence" }).click();
    await expect(item.getByRole("link", { name: "Evidence link (expires in 60 s)" })).toHaveAttribute("href", /token=/);
    await item.getByRole("button", { name: "Verify" }).click();
    // revalidatePath("/admin") re-renders the queue without the reviewed item.
    await expect(item).toHaveCount(0);

    await adminPage.goto("/experiences");
    const verified = adminPage.getByRole("region", { name: "Verified experiences" });
    await expect(verified.getByText(summary)).toBeVisible();
    await expect(adminPage.getByRole("region", { name: "Community tips" }).getByText(summary)).toHaveCount(0);
    await adminPage.close();
  } finally {
    const svc = serviceClient();
    const objs = (await svc.storage.from("evidence").list(alumni.id)).data ?? [];
    if (objs.length) await svc.storage.from("evidence").remove(objs.map((o) => `${alumni.id}/${o.name}`));
    await deleteE2EUser(alumni.id);
    await deleteE2EUser(admin.id);
  }
});

test("non-admin is kept out of the verification queue", async ({ page }) => {
  const user = await createE2EUser("exp-nonadmin");
  try {
    await signIn(page, user.email, "/admin");
    await expect(page.getByRole("heading", { name: "Verification queue" })).toHaveCount(0);
  } finally {
    await deleteE2EUser(user.id);
  }
});

test("rumour check returns a cited verdict", async ({ page }) => {
  await page.goto("/rumour-check");
  await page.getByRole("button", { name: "Check claim" }).click();
  await expect(page.getByText("Choose a company").last()).toBeVisible();

  await page.getByLabel("Company", { exact: true }).selectOption({ label: "TCS" });
  await page.getByLabel("Search topics").fill("pseudo");
  await page.getByRole("radio", { name: /Pseudocode/ }).check();
  await page.getByRole("button", { name: "Check claim" }).click();

  const verdict = page.getByRole("region", { name: /Supported|Mixed|Not supported/ });
  await expect(verdict).toBeVisible();
  await expect(verdict.getByText(/Claim: “TCS heavily asks Pseudocode”/)).toBeVisible();
  await expect(verdict.getByRole("heading", { name: "Cited experiences" })).toBeVisible();
  const cite = verdict.getByRole("listitem").getByRole("link").first();
  await cite.click();
  await expect(page).toHaveURL(/\/experiences\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: /^TCS · / })).toBeVisible();
});
