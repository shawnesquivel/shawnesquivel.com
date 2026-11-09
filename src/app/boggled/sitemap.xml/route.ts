import { GUIDE_SLUG, SITE_URL } from "@/lib/boggled/site";

// Served at /sitemap.xml on the Word Brawl domain (see next.config.ts).
export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/${GUIDE_SLUG}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
