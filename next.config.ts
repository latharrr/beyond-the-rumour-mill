import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    serverActions: {
      // Evidence ≤ 4 MB + multipart overhead; stays under Vercel's 4.5 MB cap.
      bodySizeLimit: "4.4mb",
    },
  },
  partialPrefetching: true,
  // Viva deck: /ppt opens the PDF in the browser, /ppt/download gives the editable PPTX.
  async redirects() {
    return [
      { source: "/ppt", destination: "/viva/beyond-the-rumour-mill-viva.pdf", permanent: false },
      { source: "/ppt/download", destination: "/viva/beyond-the-rumour-mill-viva.pptx", permanent: false },
    ];
  },
  // /api/ask reads the project's own source files at runtime (lib/ask/knowledge.ts);
  // make sure serverless deploys ship them.
  outputFileTracingIncludes: {
    "/api/ask": ["./*.md", "./docs/*.md", "./package.json", "./next.config.ts", "./proxy.ts", "./app/**/*", "./components/**/*", "./hooks/**/*", "./lib/**/*", "./supabase/migrations/*", "./tests/**/*", "./e2e/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
