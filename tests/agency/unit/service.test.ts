import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateApiKey, hashApiKey, apiKeyPrefix } from "@/lib/agency/server/api-keys";
import type { NewRequestEvent } from "@/lib/agency/server/notify";
import { NotFoundError, QuotaExceededError, ValidationError, createDevRelService } from "@/lib/agency/server/service";
import { MemoryStore } from "../helpers/memory-store";

const NOW = new Date("2026-03-01T12:00:00.000Z");

async function setup(opts: { dailyLimit?: number; notify?: (e: NewRequestEvent) => Promise<void> } = {}) {
  const store = new MemoryStore();
  const notify = opts.notify ?? vi.fn(async () => {});
  let now = NOW;
  const service = createDevRelService({
    store,
    notify,
    now: () => now,
    defaultDailyLimit: opts.dailyLimit ?? 3,
    log: () => {},
  });
  const key = generateApiKey();
  const client = await store.createClient({ name: "Acme", apiKeyHash: hashApiKey(key), apiKeyPrefix: apiKeyPrefix(key) });
  return { store, service, notify, key, client, advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

describe("authenticate", () => {
  it("returns the client for a valid key", async () => {
    const { service, key, client } = await setup();
    await expect(service.authenticate(key)).resolves.toEqual(client);
  });

  it("rejects missing, unknown, and malformed keys", async () => {
    const { service } = await setup();
    await expect(service.authenticate(undefined)).resolves.toBeNull();
    await expect(service.authenticate("drk_live_" + "x".repeat(32))).resolves.toBeNull();
    await expect(service.authenticate("not-a-key")).resolves.toBeNull();
  });

  it("rejects revoked keys", async () => {
    const { service, store, key, client } = await setup();
    store.revoke(client.id);
    await expect(service.authenticate(key)).resolves.toBeNull();
  });
});

describe("createRequest", () => {
  it("stores a queued request for the client and returns its public shape", async () => {
    const { service, store, client } = await setup();
    const request = await service.createRequest(client, { type: "blog", title: "OAuth for agents", priority: "rush" });

    expect(request).toMatchObject({
      object: "request",
      livemode: true,
      status: "queued",
      type: "blog",
      title: "OAuth for agents",
      priority: "rush",
      audience: "intermediate",
      deliverable_url: null,
      estimated_delivery: "2026-03-03T12:00:00.000Z",
      created_at: NOW.toISOString(),
    });
    expect(request.id).toMatch(/^req_[a-f0-9]{16}$/);
    expect(store.requests).toHaveLength(1);
    expect(store.requests[0].clientId).toBe(client.id);
  });

  it("notifies Shawn about the new request", async () => {
    const { service, notify, client } = await setup();
    const request = await service.createRequest(client, { type: "cookbook", title: "Triage agent" });
    expect(notify).toHaveBeenCalledWith({ client, request });
  });

  it("still succeeds when the notification fails", async () => {
    const { service, client } = await setup({ notify: async () => Promise.reject(new Error("slack down")) });
    await expect(service.createRequest(client, { type: "thread", title: "Launch thread" })).resolves.toMatchObject({
      status: "queued",
    });
  });

  it("rejects invalid input without storing anything", async () => {
    const { service, store, client } = await setup();
    await expect(service.createRequest(client, { type: "podcast", title: "x" })).rejects.toBeInstanceOf(ValidationError);
    expect(store.requests).toHaveLength(0);
  });

  it("enforces the daily quota over a rolling 24 hours", async () => {
    const { service, client, advance } = await setup({ dailyLimit: 2 });
    await service.createRequest(client, { type: "blog", title: "One" });
    await service.createRequest(client, { type: "blog", title: "Two" });

    const error = await service.createRequest(client, { type: "blog", title: "Three" }).catch((e) => e);
    expect(error).toBeInstanceOf(QuotaExceededError);
    expect(error.limit).toBe(2);

    advance(24 * 60 * 60 * 1000 + 1);
    await expect(service.createRequest(client, { type: "blog", title: "Three" })).resolves.toBeTruthy();
  });

  it("uses a per-client limit when one is set", async () => {
    const { service, store } = await setup({ dailyLimit: 10 });
    const key = generateApiKey();
    const vip = await store.createClient({
      name: "Tight",
      apiKeyHash: hashApiKey(key),
      apiKeyPrefix: apiKeyPrefix(key),
      dailyRequestLimit: 1,
    });
    await service.createRequest(vip, { type: "blog", title: "One" });
    await expect(service.createRequest(vip, { type: "blog", title: "Two" })).rejects.toBeInstanceOf(QuotaExceededError);
  });
});

describe("listRequests / getRequest", () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    ctx = await setup({ dailyLimit: 10 });
  });

  it("lists only the caller's requests, newest first", async () => {
    const { service, store, client, advance } = ctx;
    const key = generateApiKey();
    const other = await store.createClient({ name: "Other", apiKeyHash: hashApiKey(key), apiKeyPrefix: apiKeyPrefix(key) });

    await service.createRequest(client, { type: "blog", title: "First" });
    advance(1000);
    await service.createRequest(client, { type: "blog", title: "Second" });
    await service.createRequest(other, { type: "blog", title: "Not yours" });

    const list = await service.listRequests(client, {});
    expect(list.map((r) => r.title)).toEqual(["Second", "First"]);
  });

  it("validates list filters", async () => {
    const { service, client } = ctx;
    await expect(service.listRequests(client, { limit: 500 })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.listRequests(client, { status: "lost" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("gets one of the caller's requests and hides everyone else's", async () => {
    const { service, store, client } = ctx;
    const key = generateApiKey();
    const other = await store.createClient({ name: "Other", apiKeyHash: hashApiKey(key), apiKeyPrefix: apiKeyPrefix(key) });
    const mine = await service.createRequest(client, { type: "blog", title: "Mine" });

    await expect(service.getRequest(client, mine.id)).resolves.toMatchObject({ id: mine.id, title: "Mine" });
    await expect(service.getRequest(other, mine.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getRequest(client, "req_doesnotexist00")).rejects.toBeInstanceOf(NotFoundError);
  });
});
