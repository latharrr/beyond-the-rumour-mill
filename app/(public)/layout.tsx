import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";

// Nav + footer for public pages (§3.1).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
