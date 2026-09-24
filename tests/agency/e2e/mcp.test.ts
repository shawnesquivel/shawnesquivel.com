import { createServer, type Server } from "node:http";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { apiKeyPrefix, generateApiKey, hashApiKey } from "@/lib/agency/server/api-keys";

const baseUrl = inject("baseUrl");
const dailyLimit = inject("dailyLimit");
const mcpUrl = new URL("/api/agency/mcp", baseUrl);

let db: SupabaseClient;
let slack: Server;
const slackMessages: { text: string }[] = [];
const keys = { acme: "", globex: "", tight: "", revoked: "" };

async function createApiClient(name: string, extra: Record<string, unknown> = {}) {
  const key = generateApiKey();
  const { error } = await db
    .from("clients")
    .insert({ name, api_key_hash: hashApiKey(key), api_key_prefix: apiKeyPrefix(key), ...extra });
  if (error) throw error;
  return key;
}

async function connect(key: string) {
  const client = new Client({ name: "e2e", version: "0.0.0" });
  const transport = new StreamableHTTPClientTransport(mcpUrl, {
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  });
  await client.connect(transport);
  return client;
}

function structured<T = Record<string, unknown>>(result: { structuredContent?: unknown }) {
  return result.structuredContent as T;
}

async function callExpectingError(client: Client, name: string, args: Record<string, unknown>) {
  try {
    const result = await client.callTool({ name, arguments: args });
    expect(result.isError).toBe(true);
    return JSON.stringify(result.content);
  } catch (error) {
    return String(error);
  }
}

beforeAll(async () => {
  db = createSupabase(inject("supabaseUrl"), inject("supabaseSecretKey"), { auth: { persistSession: false } });

  slack = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      slackMessages.push(JSON.parse(body));
      res.end("ok");
    });
  });
  await new Promise<void>((resolve) => slack.listen(inject("slackPort"), "127.0.0.1", resolve));

  keys.acme = await createApiClient("Acme");
  keys.globex = await createApiClient("Globex");
  keys.tight = await createApiClient("Tight Budget Co", { daily_request_limit: 2 });
  keys.revoked = await createApiClient("Churned Inc", { revoked_at: new Date().toISOString() });
});

afterAll(async () => {
  await new Promise((resolve) => slack.close(resolve));
});

describe("auth", () => {
  it("rejects requests without an API key", async () => {
    const res = await fetch(mcpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects unknown and revoked keys", async () => {
    await expect(connect(generateApiKey())).rejects.toThrow();
    await expect(connect(keys.revoked)).rejects.toThrow();
  });

  it("rejects oversized bodies before they reach MCP", async () => {
    const res = await fetch(mcpUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${keys.acme}`, "Content-Type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(40_000) }),
    });
    expect(res.status).toBe(413);
  });
});

describe("MCP tools", () => {
  let acme: Client;
  let globex: Client;
  let createdId = "";

  beforeAll(async () => {
    acme = await connect(keys.acme);
    globex = await connect(keys.globex);
  });

  afterAll(async () => {
    await acme?.close();
    await globex?.close();
  });

  it("lists the three tools", async () => {
    const { tools } = await acme.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["create_request", "get_request", "list_requests"]);
    const create = tools.find((t) => t.name === "create_request");
    expect(create?.inputSchema.required).toEqual(expect.arrayContaining(["type", "title"]));
  });

  it("creates a request, stores it for the right client, and pings Slack", async () => {
    const result = await acme.callTool({
      name: "create_request",
      arguments: { type: "cookbook", title: "GitHub triage agent", brief: "Use the latest SDK", priority: "rush" },
    });
    expect(result.isError).toBeFalsy();

    const request = structured<{ id: string; status: string; livemode: boolean }>(result);
    expect(request.id).toMatch(/^req_/);
    expect(request.status).toBe("queued");
    expect(request.livemode).toBe(true);
    createdId = request.id;

    const { data: row } = await db.from("requests").select("*, clients(name)").eq("id", createdId).single();
    expect(row).toMatchObject({ title: "GitHub triage agent", type: "cookbook", priority: "rush", status: "queued" });
    expect(row.clients.name).toBe("Acme");

    const message = slackMessages.find((m) => m.text.includes(createdId));
    expect(message?.text).toContain("Acme");
    expect(message?.text).toContain("GitHub triage agent");
  });

  it("returns the request from list_requests and get_request", async () => {
    const list = structured<{ requests: { id: string }[] }>(await acme.callTool({ name: "list_requests", arguments: {} }));
    expect(list.requests.map((r) => r.id)).toContain(createdId);

    const one = structured<{ id: string; title: string }>(
      await acme.callTool({ name: "get_request", arguments: { id: createdId } }),
    );
    expect(one).toMatchObject({ id: createdId, title: "GitHub triage agent" });
  });

  it("reflects status changes Shawn makes in Supabase", async () => {
    await db
      .from("requests")
      .update({ status: "shipped", deliverable_url: "https://github.com/acme/triage-agent" })
      .eq("id", createdId);

    const one = structured<{ status: string; deliverable_url: string }>(
      await acme.callTool({ name: "get_request", arguments: { id: createdId } }),
    );
    expect(one).toMatchObject({ status: "shipped", deliverable_url: "https://github.com/acme/triage-agent" });
  });

  it("keeps clients isolated from each other", async () => {
    const text = await callExpectingError(globex, "get_request", { id: createdId });
    expect(text).toMatch(/not found/i);

    const list = structured<{ requests: unknown[] }>(await globex.callTool({ name: "list_requests", arguments: {} }));
    expect(list.requests).toEqual([]);
  });

  it("rejects invalid input", async () => {
    const text = await callExpectingError(acme, "create_request", { type: "podcast", title: "x" });
    expect(text).toMatch(/type|title|invalid/i);
  });

  it("enforces the per-client daily quota", async () => {
    const tight = await connect(keys.tight);
    try {
      for (const title of ["First post", "Second post"]) {
        const ok = await tight.callTool({ name: "create_request", arguments: { type: "blog", title } });
        expect(ok.isError).toBeFalsy();
      }
      const text = await callExpectingError(tight, "create_request", { type: "blog", title: "Third post" });
      expect(text).toMatch(/limit/i);
    } finally {
      await tight.close();
    }
  });

  it("enforces the default daily quota from the environment", async () => {
    const key = await createApiClient("Default Limit Co");
    const client = await connect(key);
    try {
      for (let i = 0; i < dailyLimit; i++) {
        const ok = await client.callTool({ name: "create_request", arguments: { type: "thread", title: `Thread ${i}` } });
        expect(ok.isError).toBeFalsy();
      }
      const text = await callExpectingError(client, "create_request", { type: "thread", title: "One too many" });
      expect(text).toMatch(/limit/i);
    } finally {
      await client.close();
    }
  });
});

describe("REST endpoint", () => {
  const url = new URL("/api/agency/requests", baseUrl);
  const body = JSON.stringify({ type: "blog", title: "REST request" });

  async function countRows() {
    const { count } = await db.from("requests").select("*", { count: "exact", head: true }).eq("title", "REST request");
    return count ?? 0;
  }

  it("stays a sandbox without an API key", async () => {
    const before = await countRows();
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    expect(res.status).toBe(201);
    expect((await res.json()).livemode).toBe(false);
    expect(await countRows()).toBe(before);
  });

  it("creates a real request with an API key", async () => {
    const before = await countRows();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${keys.globex}` },
      body,
    });
    expect(res.status).toBe(201);
    expect((await res.json()).livemode).toBe(true);
    expect(await countRows()).toBe(before + 1);
  });

  it("rejects a bad API key instead of silently falling back to the sandbox", async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer drk_live_nope" },
      body,
    });
    expect(res.status).toBe(401);
  });
});
