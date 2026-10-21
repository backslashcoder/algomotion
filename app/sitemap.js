import { SITE_URL } from "@/lib/site-url";
import { listSlugs } from "@/algorithms/registry";

export default function sitemap() {
  const pages = ["", "/algorithms", "/about", ...listSlugs().map((s) => `/algorithms/${s}`)];
  return pages.map((path) => ({ url: `${SITE_URL}${path}` }));
}
