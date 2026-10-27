import { NotFoundState } from "@/components/route-states";

export default function NotFound() {
  return <NotFoundState message="That plan doesn't exist or isn't yours." homeHref="/dashboard" homeLabel="Back to dashboard" />;
}
