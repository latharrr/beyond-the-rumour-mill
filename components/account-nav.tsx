import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

// Reads the session, so callers must render it inside <Suspense>.
export async function AccountNav() {
  const user = await getSessionUser();
  if (!user) return <Link href="/login">Sign in</Link>;
  return (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <SignOutButton />
    </>
  );
}
