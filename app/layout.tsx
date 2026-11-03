import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { jsonLd } from "@/lib/json-ld";
import { REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

// Fontshare fonts (ITF Free Font License), self-hosted from app/fonts via next/font/local.
const switzer = localFont({
  src: [
    { path: "./fonts/switzer-400.woff2", weight: "400" },
    { path: "./fonts/switzer-500.woff2", weight: "500" },
    { path: "./fonts/switzer-600.woff2", weight: "600" },
  ],
  display: "swap",
  variable: "--font-switzer",
});

const zodiak = localFont({
  src: [
    { path: "./fonts/zodiak-400.woff2", weight: "400" },
    { path: "./fonts/zodiak-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/zodiak-700.woff2", weight: "700" },
    { path: "./fonts/zodiak-700-italic.woff2", weight: "700", style: "italic" },
    { path: "./fonts/zodiak-800.woff2", weight: "800" },
  ],
  display: "swap",
  variable: "--font-zodiak",
});

// Numbers only, never the LCP text: not preloaded, so it doesn't compete with the text fonts.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: placement prep from verified evidence`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "campus placement preparation",
    "placement drive eligibility",
    "interview experiences",
    "TCS NQT preparation",
    "placement prep plan",
    "LPU placements",
  ],
  authors: [{ name: "Group 8, INT252/257", url: REPO_URL }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Browser UI colour (mobile address bar) follows the OS theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#111114" },
  ],
  colorScheme: "dark light",
};

/*
 * Runs in the browser before the page paints, so the page never flashes the
 * wrong theme. Saved choice ("theme" in localStorage) wins; otherwise the OS
 * setting decides. Plain JS on purpose: React hasn't loaded yet at this point.
 */
const THEME_SCRIPT = `try {
  var t = localStorage.getItem("theme");
  if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = t;
} catch (e) {}`;

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-IN",
  isAccessibleForFree: true,
  sameAs: [REPO_URL],
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/drives?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${switzer.variable} ${zodiak.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(WEBSITE_LD) }} />
        {children}
      </body>
    </html>
  );
}
