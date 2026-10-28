import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Public pages are open to every crawler, AI crawlers included; signed-in
// areas, auth and APIs are not worth indexing (and need a session anyway).
const PRIVATE = ["/dashboard", "/onboarding", "/admin", "/api/", "/auth/", "/login", "/experiences/new"];
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
