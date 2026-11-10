// Google Search Console for /stats, server-side only. Uses a service account added as a user on the property.
// Env: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY (PEM, "\n" escapes are fine), GSC_SITE (default sc-domain:wordbrawl.app).
import { createSign } from "node:crypto";

export type GscRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type Gsc = {
  site: string;
  from: string;
  to: string;
  totals: Omit<GscRow, "key">;
  daily: GscRow[];
  queries: GscRow[];
  pages: GscRow[];
};

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

async function token(email: string, key: string) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const sig = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(key.replace(/\\n/g, "\n"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claims}.${b64url(sig)}` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google auth ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

const day = (d: Date) => d.toISOString().slice(0, 10);

export async function searchConsole(days: number): Promise<{ data: Gsc } | { error: string }> {
  const email = process.env.GSC_CLIENT_EMAIL;
  const key = process.env.GSC_PRIVATE_KEY;
  const site = process.env.GSC_SITE ?? "sc-domain:wordbrawl.app";
  if (!email || !key) return { error: "setup" };
  try {
    const access = await token(email, key);
    // Search data lands ~2 days late.
    const to = new Date(Date.now() - 2 * 86_400_000);
    const from = new Date(to.getTime() - (days - 1) * 86_400_000);
    const query = async (dimensions: string[], rowLimit = 15): Promise<GscRow[]> => {
      const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: day(from), endDate: day(to), dimensions, rowLimit }),
        next: { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`Search Console ${res.status}: ${(await res.text()).slice(0, 160)}`);
      const rows = ((await res.json()) as { rows?: (Omit<GscRow, "key"> & { keys?: string[] })[] }).rows ?? [];
      return rows.map(({ keys, ...r }) => ({ key: keys?.[0] ?? "", ...r }));
    };
    const [totals, daily, queries, pages] = await Promise.all([query([], 1), query(["date"], 500), query(["query"]), query(["page"])]);
    return {
      data: { site, from: day(from), to: day(to), totals: totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }, daily, queries, pages },
    };
  } catch (e) {
    return { error: String(e instanceof Error ? e.message : e) };
  }
}
