// Google Search Console for /stats, server-side only, via a Google Cloud service account.
// Env: GSC_SERVICE_ACCOUNT_JSON (the downloaded key file), or GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY.
// Optional: GSC_SITE (default https://wordbrawl.app/), GSC_OWNER_EMAIL (also made an owner, so the
// property shows up in that person's Search Console).
// If the service account doesn't own the site yet, connect() verifies it with the FILE method (served by
// /google<token>.html), adds the property and submits the sitemap. No clicks in Search Console needed.
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

const SCOPES = "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/siteverification";
const API = "https://www.googleapis.com";

export const gscSite = () => process.env.GSC_SITE ?? "https://wordbrawl.app/";

function creds(): { email: string; key: string } | null {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const j = JSON.parse(raw) as { client_email?: string; private_key?: string };
      if (j.client_email && j.private_key) return { email: j.client_email, key: j.private_key };
    } catch {}
  }
  const email = process.env.GSC_CLIENT_EMAIL;
  const key = process.env.GSC_PRIVATE_KEY;
  return email && key ? { email, key: key.replace(/\\n/g, "\n") } : null;
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

let cached: { token: string; exp: number } | null = null;

async function accessToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const c = creds();
  if (!c) throw new Error("setup");
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: c.email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const sig = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(c.key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claims}.${b64url(sig)}` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google auth ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = (await res.json()) as { access_token: string; expires_in?: number };
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

class ApiError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new ApiError(res.status, `Google ${res.status} on ${path.split("?")[0]}: ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

const enc = encodeURIComponent;
const siteRef = () => ({ type: "SITE", identifier: gscSite() });

let fileName: { name: string; at: number } | null = null;

// The verification file name Google expects for this service account, e.g. google1234abcd.html.
export async function verificationFile(): Promise<string | null> {
  if (!creds()) return null;
  if (fileName && Date.now() - fileName.at < 3_600_000) return fileName.name;
  const { token } = await api<{ token: string }>("POST", "/siteVerification/v1/token", { site: siteRef(), verificationMethod: "FILE" });
  fileName = { name: token, at: Date.now() };
  return token;
}

export async function connect() {
  await verificationFile();
  const owner = process.env.GSC_OWNER_EMAIL;
  await api("POST", `/siteVerification/v1/webResource?verificationMethod=FILE`, { site: siteRef(), ...(owner ? { owners: [owner] } : {}) });
  await api("PUT", `/webmasters/v3/sites/${enc(gscSite())}`);
  await api("PUT", `/webmasters/v3/sites/${enc(gscSite())}/sitemaps/${enc(new URL("sitemap.xml", gscSite()).toString())}`);
}

const day = (d: Date) => d.toISOString().slice(0, 10);

async function report(days: number): Promise<Gsc> {
  // Search data lands ~2 days late.
  const to = new Date(Date.now() - 2 * 86_400_000);
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  const query = async (dimensions: string[], rowLimit = 15): Promise<GscRow[]> => {
    const r = await api<{ rows?: (Omit<GscRow, "key"> & { keys?: string[] })[] }>("POST", `/webmasters/v3/sites/${enc(gscSite())}/searchAnalytics/query`, {
      startDate: day(from),
      endDate: day(to),
      dimensions,
      rowLimit,
    });
    return (r.rows ?? []).map(({ keys, ...row }) => ({ key: keys?.[0] ?? "", ...row }));
  };
  const [totals, daily, queries, pages] = await Promise.all([query([], 1), query(["date"], 500), query(["query"]), query(["page"])]);
  return { site: gscSite(), from: day(from), to: day(to), totals: totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }, daily, queries, pages };
}

export async function searchConsole(days: number): Promise<{ data: Gsc } | { error: string }> {
  if (!creds()) return { error: "setup" };
  try {
    try {
      return { data: await report(days) };
    } catch (e) {
      if (!(e instanceof ApiError) || (e.status !== 403 && e.status !== 404)) throw e;
      await connect();
      return { data: await report(days) };
    }
  } catch (e) {
    return { error: String(e instanceof Error ? e.message : e) };
  }
}
