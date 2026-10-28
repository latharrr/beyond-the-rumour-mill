import type { ReactNode } from "react";

/** Hero content is visible immediately, without a hydration or animation gate. */
export function HeroStage({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-[var(--nav-h)] overflow-hidden md:-mt-[var(--nav-h-md)]">
      <div aria-hidden="true" className="glow-field pointer-events-none absolute inset-x-0 -top-24 bottom-0 -z-10" />
      <div className="container-page flex flex-col items-center pt-[calc(var(--nav-h)+72px)] pb-24 text-center md:pt-[calc(var(--nav-h-md)+104px)] md:pb-32">
        {children}
      </div>
    </section>
  );
}
