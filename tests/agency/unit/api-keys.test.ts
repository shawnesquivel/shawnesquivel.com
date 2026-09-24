import { describe, expect, it } from "vitest";
import { apiKeyPrefix, generateApiKey, hashApiKey, parseBearer } from "@/lib/agency/server/api-keys";

describe("generateApiKey", () => {
  it("creates a prefixed, url-safe key with 32 random characters", () => {
    expect(generateApiKey()).toMatch(/^drk_live_[A-Za-z0-9_-]{32}$/);
  });

  it("never repeats", () => {
    const keys = new Set(Array.from({ length: 200 }, generateApiKey));
    expect(keys.size).toBe(200);
  });
});

describe("hashApiKey", () => {
  it("is a deterministic sha256 hex digest", () => {
    const key = "drk_live_abcdefghijklmnopqrstuvwxyz012345";
    expect(hashApiKey(key)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).not.toBe(hashApiKey(`${key}x`));
  });
});

describe("apiKeyPrefix", () => {
  it("keeps enough of the key to identify it without exposing it", () => {
    expect(apiKeyPrefix("drk_live_abcdefghijklmnopqrstuvwxyz012345")).toBe("drk_live_abcd");
  });
});

describe("parseBearer", () => {
  it("extracts the token from a Bearer header", () => {
    expect(parseBearer("Bearer drk_live_abc")).toBe("drk_live_abc");
    expect(parseBearer("bearer   drk_live_abc  ")).toBe("drk_live_abc");
  });

  it("returns undefined for missing or malformed headers", () => {
    expect(parseBearer(null)).toBeUndefined();
    expect(parseBearer("")).toBeUndefined();
    expect(parseBearer("Basic abc")).toBeUndefined();
    expect(parseBearer("Bearer")).toBeUndefined();
  });
});
