import { NotFoundState } from "@/components/route-states";

// Unmatched URLs anywhere in the app. Group-level not-found.tsx files handle
// notFound() thrown inside their own segments.
export default function NotFound() {
  return (
    <main>
      <NotFoundState message="We couldn't find that page." />
    </main>
  );
}
