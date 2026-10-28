import { signOut } from "@/app/_actions/auth";
import { Tone } from "@/components/nav/Tone";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="group hit-44 inline-flex h-11 items-center px-1.5 text-[14px] font-medium whitespace-nowrap md:h-9 md:px-2">
        <Tone bar="text-ink-muted group-hover:text-ink group-hover:underline" pill="text-paper-ink/70 group-hover:underline">
          Sign out
        </Tone>
      </button>
    </form>
  );
}
