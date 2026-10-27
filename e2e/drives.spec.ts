import { expect, test } from "@playwright/test";
import { createE2EUser, deleteE2EUser, serviceClient, signIn } from "./supabase";

test.describe("onboarding → eligibility", () => {
  let user: { id: string; email: string };
  test.beforeEach(async () => {
    user = await createE2EUser("onb");
  });
  test.afterEach(async () => {
    await deleteE2EUser(user.id);
  });

  test("profile form validates, saves, and drives filter by eligibility", async ({ page }) => {
    await signIn(page, user.email, "/drives");
    await expect(page.getByRole("link", { name: "Complete your profile" })).toBeVisible();
    await expect(page.getByText("Complete your profile").first()).toBeVisible();

    await page.goto("/onboarding?next=/drives?eligibleOnly=1");
    await page.getByLabel("CGPA (out of 10)").fill("11");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Choose a branch")).toBeVisible();
    await expect(page.getByText("CGPA must be at most 10")).toBeVisible();

    // CSE, CGPA 6.8: eligible for TCS (6.0, CSE), not Infosys (6.5 → ok, but batch 2026 only) or Amazon (7.5).
    await page.getByLabel("Branch").selectOption({ label: "CSE — Computer Science & Engineering" });
    await page.getByLabel("CGPA (out of 10)").fill("6.8");
    await page.getByLabel("Active backlogs").fill("0");
    await page.getByLabel("10th percentage").fill("82");
    await page.getByLabel("12th percentage").fill("78");
    await page.getByLabel("Graduation year").fill("2027");
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(page).toHaveURL("/drives?eligibleOnly=1");
    await expect(page.getByRole("link", { name: "TCS NQT 2026 — Ninja & Digital" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Amazon SDE-1 New Grad" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Infosys SP/DSE Hiring 2026" })).toHaveCount(0);

    await page.goto("/drives");
    await page.getByRole("link", { name: "Amazon SDE-1 New Grad" }).click();
    await expect(page.getByRole("heading", { name: "Why you’re not eligible" })).toBeVisible();
    await expect(page.getByText("Your CGPA 6.80 is below the 7.50 minimum.")).toBeVisible();
  });
});

test("search and company filters narrow /drives via the URL", async ({ page }) => {
  await page.goto("/drives");
  await page.getByLabel("Search").fill("sde");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/q=sde/);
  await expect(page.getByRole("link", { name: "Amazon SDE-1 New Grad" })).toBeVisible();
  await expect(page.getByRole("link", { name: "TCS NQT 2026 — Ninja & Digital" })).toHaveCount(0);

  await page.goto("/drives?q=zzzz");
  await expect(page.getByText("No drives match these filters.")).toBeVisible();
});

test("signed-out drive page invites sign-in instead of guessing eligibility", async ({ page }) => {
  await page.goto("/drives");
  await page.getByRole("link", { name: "TCS NQT 2026 — Ninja & Digital" }).click();
  await expect(page.getByRole("heading", { name: "Rounds" })).toBeVisible();
  await expect(page.getByText("NQT Online Test")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).last()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Verified experiences" })).toBeVisible();

  await page.goto("/drives/not-a-uuid");
  await expect(page.getByText("That drive or experience doesn't exist")).toBeVisible();
});

test("admin creates and edits a drive through the form", async ({ page }) => {
  const admin = await createE2EUser("drv-admin", "admin");
  const title = `E2E drive ${Date.now()}`;
  try {
    await signIn(page, admin.email, "/admin/drives");
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Company").selectOption({ label: "Amazon" });
    await page.getByLabel("Role").selectOption({ label: "Data Analyst" });
    await page.getByLabel("Minimum CGPA (blank = none)").fill("7");
    await page.getByLabel("Name").fill("Aptitude test");
    await page.getByRole("button", { name: "Create drive" }).click();
    await expect(page.getByText("Drive created.")).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toBeVisible();

    await page.getByRole("row", { name: new RegExp(title) }).getByRole("link", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: `Edit: ${title}` })).toBeVisible();
    await page.getByLabel("Location").fill("Main auditorium");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Drive updated.")).toBeVisible();

    await page.getByRole("link", { name: title }).click();
    await expect(page.getByText("Main auditorium")).toBeVisible();
    await expect(page.getByText("Aptitude test")).toBeVisible();
  } finally {
    await serviceClient().from("drives").delete().eq("title", title);
    await deleteE2EUser(admin.id);
  }
});
