import Link from "next/link";
import { Press } from "@/components/motion/Press";
import { Tone, ToneFill } from "@/components/nav/Tone";
import { getSessionUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const pillBase = "relative inline-flex h-11 items-center rounded-full px-3.5 text-[14px] font-medium whitespace-nowrap hit-44 md:h-9 md:px-4";

// Reads the session, so callers must render it inside <Suspense>.
export async function AccountNav() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <Link href="/login" className={pillBase}>
          <ToneFill bar="border border-line" pill="border border-paper-ink/15" />
          <Tone bar="text-ink" pill="text-paper-ink" className="relative">
            Sign in
          </Tone>
        </Link>
        <Press>
          <Link href="/login" className={pillBase}>
            <ToneFill bar="bg-amber" pill="bg-paper-ink" />
            <Tone bar="text-paper-ink" pill="text-paper" className="relative">
              Get started
            </Tone>
          </Link>
        </Press>
      </>
    );
  }
  return (
    <>
      <Link href="/dashboard" className={pillBase}>
        <ToneFill bar="border border-line" pill="border border-paper-ink/15" />
        <Tone bar="text-ink" pill="text-paper-ink" className="relative">
          Dashboard
        </Tone>
      </Link>
      <SignOutButton />
    </>
  );
}
