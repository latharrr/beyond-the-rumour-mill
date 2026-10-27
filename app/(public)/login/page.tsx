import { Suspense } from "react";
import { LoginForm } from "./login-form";

// Phase 0: functional, unstyled. Visual design comes in the UI pass.
export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
