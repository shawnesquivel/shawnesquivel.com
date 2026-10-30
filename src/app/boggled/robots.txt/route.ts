import { SITE_URL } from "@/lib/boggled/site";

// Served at /robots.txt on the Word Brawl domain (see next.config.ts).
export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /stats\nDisallow: /boggled/stats\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain" },
  });
}
