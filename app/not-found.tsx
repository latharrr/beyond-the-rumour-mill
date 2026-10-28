import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { NotFoundState } from "@/components/route-states";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

// Unmatched URLs anywhere in the app. Group-level not-found.tsx files handle
// notFound() thrown inside their own segments.
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundState message="We couldn't find that page." />
    </SiteChrome>
  );
}
