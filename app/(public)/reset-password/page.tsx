import type { Metadata } from "next";
import { card, pageMain } from "@/components/ui/surface";
import { PillLink } from "@/components/ui/pill";
import { cn } from "@/lib/cn";
import { getSessionUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your Beyond the Rumour Mill account.",
  robots: { index: false, follow: true },
};

export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <div className="mx-auto max-w-xl">
        <p className="type-label text-ink-dim">Account</p>
        <h1 className="mt-4 type-section text-ink">Choose a new password</h1>
        {user ? (
          <>
            <p className="mt-5 type-body text-pretty text-ink-muted">
              Signed in as {user.email ?? "your account"}. Set a new password below.
            </p>
            <div className={cn(card, "mt-8 p-5 sm:p-8")}>
              <ResetPasswordForm />
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 type-body text-pretty text-ink-muted">
              That reset link is invalid or has expired. Request a new one to continue.
            </p>
            <div className="mt-8">
              <PillLink href="/forgot-password" variant="primary">
                Request a new link
              </PillLink>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
