import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { searchConsole } from "@/lib/boggled/gsc";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("searchConsole", () => {
  it("asks for setup without credentials", async () => {
    vi.stubEnv("GSC_CLIENT_EMAIL", "");
    expect(await searchConsole(7)).toEqual({ error: "setup" });
  });

  it("signs a service-account JWT and queries totals, days, queries and pages", async () => {
    vi.stubEnv("GSC_CLIENT_EMAIL", "bot@proj.iam.gserviceaccount.com");
    vi.stubEnv("GSC_PRIVATE_KEY", pem.replace(/\n/g, "\\n"));
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, body: String(init.body) });
        if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "tok" }));
        const dims = JSON.parse(String(init.body)).dimensions as string[];
        const row = { clicks: 3, impressions: 40, ctr: 0.075, position: 8.2 };
        return new Response(JSON.stringify({ rows: [dims.length ? { keys: [dims[0] === "query" ? "boggle online" : "x"], ...row } : row] }));
      }),
    );
    const res = await searchConsole(28);
    if (!("data" in res)) throw new Error(res.error);
    expect(res.data.site).toBe("sc-domain:wordbrawl.app");
    expect(res.data.totals.clicks).toBe(3);
    expect(res.data.queries[0].key).toBe("boggle online");

    const assertion = new URLSearchParams(calls[0].body).get("assertion")!;
    const [head, claims, sig] = assertion.split(".");
    expect(createVerify("RSA-SHA256").update(`${head}.${claims}`).verify(publicKey, Buffer.from(sig, "base64url"))).toBe(true);
    expect(JSON.parse(Buffer.from(claims, "base64url").toString()).scope).toContain("webmasters.readonly");
    expect(calls.filter((c) => c.url.includes("searchAnalytics")).length).toBe(4);
    expect(calls[1].url).toContain(encodeURIComponent("sc-domain:wordbrawl.app"));
  });
});
