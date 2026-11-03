import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";

// Nav + footer for public pages.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
