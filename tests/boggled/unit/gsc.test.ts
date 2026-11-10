import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const ROW = { clicks: 3, impressions: 40, ctr: 0.075, position: 8.2 };

type Call = { method: string; url: string; body: string };

function fakeGoogle({ owned }: { owned: boolean }) {
  const calls: Call[] = [];
  let verified = owned;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ method: init.method ?? "GET", url, body: String(init.body ?? "") });
      if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }));
      if (url.includes("/siteVerification/v1/token")) return new Response(JSON.stringify({ token: "google0123abcd.html" }));
      if (url.includes("/siteVerification/v1/webResource")) {
        verified = true;
        return new Response(JSON.stringify({ id: "x" }));
      }
      if (init.method === "PUT") return new Response("");
      if (!verified) return new Response("forbidden", { status: 403 });
      const dims = JSON.parse(String(init.body)).dimensions as string[];
      return new Response(JSON.stringify({ rows: [dims.length ? { keys: [dims[0] === "query" ? "boggle online" : "x"], ...ROW } : ROW] }));
    }),
  );
  return calls;
}

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("searchConsole", () => {
  it("asks for setup without credentials", async () => {
    vi.stubEnv("GSC_SERVICE_ACCOUNT_JSON", "");
    vi.stubEnv("GSC_CLIENT_EMAIL", "");
    const { searchConsole } = await import("@/lib/boggled/gsc");
    expect(await searchConsole(7)).toEqual({ error: "setup" });
  });

  it("signs a service-account JWT and reads totals, days, queries and pages", async () => {
    vi.stubEnv("GSC_CLIENT_EMAIL", "bot@proj.iam.gserviceaccount.com");
    vi.stubEnv("GSC_PRIVATE_KEY", pem.replace(/\n/g, "\\n"));
    const calls = fakeGoogle({ owned: true });
    const { searchConsole } = await import("@/lib/boggled/gsc");
    const res = await searchConsole(28);
    if (!("data" in res)) throw new Error(res.error);
    expect(res.data.site).toBe("https://wordbrawl.app/");
    expect(res.data.totals.clicks).toBe(3);
    expect(res.data.queries[0].key).toBe("boggle online");

    const [head, claims, sig] = new URLSearchParams(calls[0].body).get("assertion")!.split(".");
    expect(createVerify("RSA-SHA256").update(`${head}.${claims}`).verify(publicKey, Buffer.from(sig, "base64url"))).toBe(true);
    expect(JSON.parse(Buffer.from(claims, "base64url").toString()).scope).toContain("webmasters");
    expect(calls.filter((c) => c.url.includes("searchAnalytics")).length).toBe(4);
  });

  it("verifies the site, adds it and submits the sitemap when it isn't connected yet", async () => {
    vi.stubEnv("GSC_SERVICE_ACCOUNT_JSON", JSON.stringify({ client_email: "bot@proj.iam.gserviceaccount.com", private_key: pem }));
    vi.stubEnv("GSC_OWNER_EMAIL", "owner@example.com");
    const calls = fakeGoogle({ owned: false });
    const { searchConsole } = await import("@/lib/boggled/gsc");
    const res = await searchConsole(7);
    expect("data" in res).toBe(true);
    const verify = calls.find((c) => c.url.includes("webResource"))!;
    expect(verify.url).toContain("verificationMethod=FILE");
    expect(JSON.parse(verify.body)).toEqual({ site: { type: "SITE", identifier: "https://wordbrawl.app/" }, owners: ["owner@example.com"] });
    const puts = calls.filter((c) => c.method === "PUT").map((c) => decodeURIComponent(c.url));
    expect(puts).toEqual([
      "https://www.googleapis.com/webmasters/v3/sites/https://wordbrawl.app/",
      "https://www.googleapis.com/webmasters/v3/sites/https://wordbrawl.app//sitemaps/https://wordbrawl.app/sitemap.xml",
    ]);
  });

  it("serves only our own verification file", async () => {
    vi.stubEnv("GSC_SERVICE_ACCOUNT_JSON", JSON.stringify({ client_email: "bot@proj.iam.gserviceaccount.com", private_key: pem }));
    fakeGoogle({ owned: true });
    const { GET } = await import("@/app/boggled/gsc-verify/[file]/route");
    const ok = await GET(new Request("http://x"), { params: Promise.resolve({ file: "google0123abcd.html" }) });
    expect(await ok.text()).toBe("google-site-verification: google0123abcd.html");
    const other = await GET(new Request("http://x"), { params: Promise.resolve({ file: "googledeadbeef.html" }) });
    expect(other.status).toBe(404);
  });
});
