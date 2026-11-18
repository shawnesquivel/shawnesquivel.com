import { verificationFile } from "@/lib/boggled/gsc";

export const dynamic = "force-dynamic";

// Google Search Console file verification, served at wordbrawl.app/google<token>.html (see next.config.ts).
// Answers only for the token Google issued to our service account, so nobody else can claim the site this way.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const expected = await verificationFile().catch(() => null);
  if (!expected || file !== expected) return new Response("Not found", { status: 404 });
  return new Response(`google-site-verification: ${file}`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
