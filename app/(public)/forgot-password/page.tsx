import type { Metadata } from "next";
import { card, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your Beyond the Rumour Mill account.",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <div className="mx-auto max-w-xl">
        <p className="type-label text-ink-dim">Account</p>
        <h1 className="mt-4 type-section text-ink">Reset your password</h1>
        <p className="mt-5 type-body text-pretty text-ink-muted">
          Enter the email you signed up with and we&rsquo;ll send you a reset link.
        </p>
        <div className={cn(card, "mt-8 p-5 sm:p-8")}>
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
