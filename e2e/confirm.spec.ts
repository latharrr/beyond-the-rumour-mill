import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { serviceClient } from "./supabase";

test("email confirmation link signs the user in and lands on onboarding", async ({ page }) => {
  const svc = serviceClient();
  const email = `confirm-${randomUUID().slice(0, 8)}@e2e.test`;
  const { data, error } = await svc.auth.admin.generateLink({ type: "signup", email, password: "password123" });
  expect(error).toBeNull();

  await page.goto(`/auth/confirm?token_hash=${data.properties!.hashed_token}&type=signup&next=/onboarding`);
  await expect(page).toHaveURL("/onboarding");
  await expect(page.getByRole("heading", { name: "Complete your profile" })).toBeVisible();

  await svc.auth.admin.deleteUser(data.user!.id);
});

test("an invalid confirmation link returns to login with an explanation", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=not-a-real-token&type=signup");
  await expect(page).toHaveURL("/login?error=confirm");
  await expect(page.getByText("That confirmation link is invalid or has expired.")).toBeVisible();
});

test("confirm ignores off-site `next` targets", async ({ page }) => {
  const svc = serviceClient();
  const email = `confirm-${randomUUID().slice(0, 8)}@e2e.test`;
  const { data } = await svc.auth.admin.generateLink({ type: "signup", email, password: "password123" });
  await page.goto(`/auth/confirm?token_hash=${data.properties!.hashed_token}&type=signup&next=//evil.example`);
  await expect(page).toHaveURL("/onboarding");
  await svc.auth.admin.deleteUser(data.user!.id);
});
