import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createE2EUser, deleteE2EUser, signIn } from "./supabase";

// §5 DoD: login → onboarding → eligible drive → generate plan → toggle item → export.
test("full flow: onboarding to exported prep plan", async ({ page }) => {
  const user = await createE2EUser("plan-flow");
  try {
    await signIn(page, user.email, "/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("No plans yet.")).toBeVisible();
    await page.getByRole("link", { name: "Complete your profile" }).click();

    await page.getByLabel("Branch").selectOption({ label: "CSE — Computer Science & Engineering" });
    await page.getByLabel("CGPA (out of 10)").fill("8.2");
    await page.getByLabel("Active backlogs").fill("0");
    await page.getByLabel("10th percentage").fill("88");
    await page.getByLabel("12th percentage").fill("84");
    await page.getByLabel("Graduation year").fill("2027");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("link", { name: "Complete your profile" })).toHaveCount(0);

    await page.goto("/drives?eligibleOnly=1");
    await page.getByRole("link", { name: "TCS NQT 2026 — Ninja & Digital" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "TCS NQT 2026 — Ninja & Digital" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Requirements" }).getByText("Eligible", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Generate my prep plan" }).click();

    await expect(page).toHaveURL(/\/dashboard\/plans\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Prep plan: TCS NQT 2026 — Ninja & Digital" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Week 1" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Built from" })).toBeVisible();

    const progress = page.getByRole("status").filter({ hasText: /of \d+ done/ });
    await expect(progress).toHaveText(/^0 of \d+ done$/);
    const first = page.getByRole("checkbox").first();
    await first.check();
    await expect(progress).toHaveText(/^1 of \d+ done$/);
    await page.reload();
    await expect(page.getByRole("checkbox").first()).toBeChecked();

    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Export as Markdown" }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("prep-plan-tcs-nqt-2026-ninja-digital.md");
    const md = await readFile((await file.path())!, "utf8");
    expect(md).toContain("# Prep plan: TCS NQT 2026 — Ninja & Digital");
    expect(md).toMatch(/- \[x\] /);

    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "TCS NQT 2026 — Ninja & Digital" })).toBeVisible();
    await expect(page.getByText(/^1 of \d+ done$/)).toBeVisible();
  } finally {
    await deleteE2EUser(user.id);
  }
});

test("another user's plan is a 404 page and a 404 export", async ({ browser }) => {
  const [owner, other] = await Promise.all([createE2EUser("plan-owner"), createE2EUser("plan-other")]);
  try {
    const ownerPage = await browser.newPage();
    await signIn(ownerPage, owner.email, "/drives");
    await ownerPage.getByRole("link", { name: "Amazon SDE-1 New Grad" }).click();
    await ownerPage.getByRole("button", { name: "Generate my prep plan" }).click();
    await expect(ownerPage).toHaveURL(/\/dashboard\/plans\//);
    const planPath = new URL(ownerPage.url()).pathname;
    await ownerPage.close();

    const otherPage = await browser.newPage();
    await signIn(otherPage, other.email, planPath);
    await expect(otherPage.getByRole("heading", { name: /Prep plan/ })).toHaveCount(0);
    await expect(otherPage.getByText(/doesn't exist/)).toBeVisible();
    const res = await otherPage.request.get(`/api/plans/${planPath.split("/").pop()}/export`);
    expect(res.status()).toBe(404);
    await otherPage.close();
  } finally {
    await deleteE2EUser(owner.id);
    await deleteE2EUser(other.id);
  }
});
