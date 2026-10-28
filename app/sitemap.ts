import type { MetadataRoute } from "next";
import { listDrives } from "@/lib/data/drives";
import { listVerifiedExperiences } from "@/lib/data/experiences";
import { absoluteUrl } from "@/lib/site";

// Public pages plus every drive and verified experience. Reads go through the
// same RLS-limited public views the pages use, so nothing private is listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [drives, { experiences }] = await Promise.all([listDrives(), listVerifiedExperiences()]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/drives"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/experiences"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/rumour-check"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    ...drives.map((d) => ({ url: absoluteUrl(`/drives/${d.id}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...experiences.map((e) => ({ url: absoluteUrl(`/experiences/${e.id}`), lastModified: e.verified_at ?? e.created_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
