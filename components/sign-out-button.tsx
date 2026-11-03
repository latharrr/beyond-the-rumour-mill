import { signOut } from "@/app/_actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="hit-44 inline-flex h-11 items-center px-1.5 text-[14px] font-medium whitespace-nowrap text-ink-muted hover:text-ink hover:underline md:h-9 md:px-2">
        Sign out
      </button>
    </form>
  );
}
