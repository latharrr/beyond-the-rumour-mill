import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckIcon } from "@/components/icons";
import { card, pageMain } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to check your eligibility for every drive and build a dated prep plan.",
  robots: { index: false, follow: true },
};

const PERKS = [
  "Every drive checked against your CGPA, branch, backlogs and batch, with the reason when you miss one.",
  "A week-by-week prep plan up to the drive date, built from verified senior experiences.",
  "Share your own placement experience; it is credited by batch, never by name.",
];

export default function LoginPage() {
  return (
    <main className={cn(pageMain, "pb-20 md:pb-28")}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-16">
        <div className="lg:pt-6">
          <p className="type-label text-ink-dim">Account</p>
          <h1 className="mt-4 max-w-[12ch] type-section text-ink">Sign in</h1>
          <p className="mt-5 max-w-[48ch] type-body text-pretty text-ink-muted">
            Browsing drives, experiences and the rumour check needs no account. Signing in adds the parts that are about you.
          </p>
          <ul className="mt-8 hidden gap-4 md:grid">
            {PERKS.map((p) => (
              <li key={p} className="flex max-w-[52ch] gap-3 type-small text-ink-muted">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-line text-ink">
                  <CheckIcon className="size-3" strokeWidth={2.25} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={cn(card, "p-5 sm:p-8")}>
          <Suspense fallback={<div aria-hidden="true" className="h-[340px]" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
