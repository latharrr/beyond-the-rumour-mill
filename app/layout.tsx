import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Reenie_Beanie } from "next/font/google";
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

// Body and UI: Switzer (Fontshare, ITF Free Font License), self-hosted from app/fonts.
const switzer = localFont({
  src: [
    { path: "./fonts/switzer-400.woff2", weight: "400" },
    { path: "./fonts/switzer-500.woff2", weight: "500" },
    { path: "./fonts/switzer-600.woff2", weight: "600" },
  ],
  display: "swap",
  variable: "--font-switzer",
});

/*
 * Display serif: Gambarino (Fontshare, ITF Free Font License) for upright 400.
 * Gambarino has no italic or bold, so the same family borrows Zodiak's for
 * those (rumour quotes are italic). Self-hosted from app/fonts.
 */
const display = localFont({
  src: [
    { path: "./fonts/gambarino-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/zodiak-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/zodiak-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/zodiak-700-italic.woff2", weight: "700", style: "italic" },
    { path: "./fonts/zodiak-800.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-display-serif",
});

// Handwriting: the struck-out rumour words in the hero and small annotations.
const hand = Reenie_Beanie({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-reenie",
});

// Meta labels, stamps, dates. Never the LCP text, so not preloaded.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-jetbrains",
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
  // Light paper is the only default; dark is opt-in from the toggle, never from the OS.
  themeColor: "#f4f1ea",
  colorScheme: "light",
};

/*
 * Runs in the browser before the page paints, so the page never flashes the
 * wrong theme. Light unless the visitor picked dark with the toggle; the OS
 * setting is ignored. The key was bumped to "btrm-theme" (keep in sync with
 * components/nav/ThemeToggle.tsx): older builds saved "dark" under "theme",
 * which is cleared here so nobody is stuck on it. Plain JS: React hasn't loaded.
 */
const THEME_SCRIPT = `try {
  localStorage.removeItem("theme");
  document.documentElement.dataset.theme = localStorage.getItem("btrm-theme") === "dark" ? "dark" : "light";
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
    <html lang="en" data-theme="light" className={`${archivo.variable} ${switzer.variable} ${display.variable} ${hand.variable} ${mono.variable}`} suppressHydrationWarning>
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
