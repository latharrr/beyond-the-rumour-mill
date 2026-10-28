import { absoluteUrl, REPO_URL, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// llms.txt (llmstxt.org): a plain-Markdown map of the site for AI assistants and crawlers.
const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

A student course project (Group 8, INT252/257) for campus placements. It is not affiliated with or endorsed by the LPU placement cell. Seed drives and experiences are synthetic sample data until real ones are verified.

## How the evidence works

- Official drives list eligibility rules (CGPA, branches, backlogs, 10th/12th %, batch) and rounds with topics.
- Placed seniors submit interview experiences. A placement-cell admin verifies each one against evidence before it counts.
- Unverified submissions are shown as "Rumour · unverified" and are left out of every count, verdict and plan.
- TrustScore (0–100) per experience = 40% recency + 40% corroboration by other experiences for the same company + 20% completeness.
- Rumour check verdict for "{company} heavily asks {topic}": Supported if ≥ 50% of verified experiences for the company mention the topic, Not supported if ≤ 15%, otherwise Mixed evidence; fewer than 3 experiences is flagged as a low sample. Every verdict cites the experiences it counted.
- Prep plans weight topics by how often verified experiences mention them (newer ones count more) and split them into weeks up to the drive date.
- Authors appear only as "Placed senior · Batch of YYYY". No names, emails or evidence files are ever public.

## Pages

- [Home](${absoluteUrl("/")}): overview, live rumour check, upcoming drives, most-asked topics.
- [Drives](${absoluteUrl("/drives")}): every campus drive with its eligibility rules, round count and date; searchable by company, role or title.
- [Experiences](${absoluteUrl("/experiences")}): verified senior interview experiences with TrustScore, topic frequency across them, and the quarantined community-tips lane.
- [Rumour check](${absoluteUrl("/rumour-check")}): test "{company} heavily asks {topic}" against verified experiences.
- [Privacy](${absoluteUrl("/privacy")}): what is stored, what is public, evidence handling and account deletion.
- [Sitemap](${absoluteUrl("/sitemap.xml")}): every drive and verified experience page.

## Optional

- [Source code](${REPO_URL})
`;

export function GET() {
  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
