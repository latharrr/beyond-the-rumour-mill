import { signOut } from "@/app/_actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit">Sign out</button>
    </form>
  );
}
