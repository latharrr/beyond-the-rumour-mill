/** Serialises JSON-LD for a <script> tag; escapes "<" so data can never close the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/** BreadcrumbList for an inner page: [name, absolute url] pairs, home first. */
export function breadcrumbs(items: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}
