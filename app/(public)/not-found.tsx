import { NotFoundState } from "@/components/route-states";

export default function NotFound() {
  return <NotFoundState message="That drive or experience doesn't exist, or it hasn't been verified yet." homeHref="/" homeLabel="Go home" />;
}
