import { NotFoundState } from "@/components/route-states";

export default function NotFound() {
  return <NotFoundState message="That item doesn't exist." homeHref="/admin" homeLabel="Back to admin" />;
}
