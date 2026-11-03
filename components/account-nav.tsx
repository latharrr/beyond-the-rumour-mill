import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const pillBase = "inline-flex h-11 items-center rounded-full px-3.5 text-[14px] font-medium whitespace-nowrap hit-44 md:h-9 md:px-4";

// Reads the session, so callers must render it inside <Suspense>.
export async function AccountNav() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <Link href="/login" className={`${pillBase} border border-line text-ink`}>
          Sign in
        </Link>
        <Link href="/login?mode=signup" className={`${pillBase} bg-amber text-paper-ink transition-transform hover:scale-[1.03] active:scale-95`}>
          Get started
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/dashboard" className={`${pillBase} border border-line text-ink`}>
        Dashboard
      </Link>
      <SignOutButton />
    </>
  );
}
