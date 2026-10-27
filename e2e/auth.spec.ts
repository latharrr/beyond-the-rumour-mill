import { expect, test, type Page } from "@playwright/test";

// Uses the local seed users (supabase/seed.sql). Requires `supabase start`.
const PASSWORD = "password123";

async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("protected routes redirect to /login without a session", async ({ page }) => {
  for (const path of ["/dashboard", "/onboarding", "/experiences/new", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
  }
});

test("public routes are reachable without a session", async ({ page }) => {
  for (const path of ["/", "/drives", "/experiences", "/rumour-check"]) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(path);
  }
});

test("login form shows validation and wrong-password errors", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

  await page.getByLabel("Email").fill("student@seed.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
});

test("student signs in, returns to `next`, and is bounced from /admin", async ({ page }) => {
  await signIn(page, "student@seed.test", "/dashboard");
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});

test("admin can open /admin", async ({ page }) => {
  await signIn(page, "admin@seed.test", "/admin");
  await expect(page).toHaveURL("/admin");
  await expect(page.getByRole("heading", { name: "Verification queue" })).toBeVisible();
});
