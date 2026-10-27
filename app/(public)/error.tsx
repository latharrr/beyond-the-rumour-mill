"use client";

import { ErrorState } from "@/components/route-states";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/" />;
}
