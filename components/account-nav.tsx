import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const pillBase = "inline-flex h-11 items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap hit-44 md:h-10 md:px-4 md:text-[14px]";

// Reads the session, so callers must render it inside <Suspense>.
export async function AccountNav() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <Link href="/login" className={`${pillBase} border border-ink text-ink`}>
          Sign in
        </Link>
        <Link href="/login?mode=signup" className={`${pillBase} bg-accent text-on-accent transition-colors duration-150 hover:bg-accent-hover`}>
          Get started
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/dashboard" className={`${pillBase} border border-ink text-ink`}>
        Dashboard
      </Link>
      <SignOutButton />
    </>
  );
}
