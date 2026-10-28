// Canonical site identity for metadata, sitemap, robots, llms.txt and JSON-LD.

/** Absolute origin: NEXT_PUBLIC_SITE_URL, else Vercel's production domain, else local dev. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Beyond the Rumour Mill";
export const SITE_DESCRIPTION =
  "Campus placement prep from official drive rules and verified senior experiences: check your eligibility, see what each company really asks, test a rumour against the evidence, and get a week-by-week prep plan.";
export const REPO_URL = "https://github.com/latharrr/beyond-the-rumour-mill";

/** Pages a visitor (or crawler) can read without signing in. */
export const PUBLIC_PATHS = ["/", "/companies", "/drives", "/experiences", "/rumour-check", "/privacy"] as const;

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
