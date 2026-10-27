import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beyond the Rumour Mill",
  description: "Placement prep from official drives and verified senior experiences.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
