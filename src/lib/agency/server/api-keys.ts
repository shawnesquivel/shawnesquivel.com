import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX = "drk_live_";
const API_KEY_PATTERN = /^drk_live_[A-Za-z0-9_-]{32}$/;

export function generateApiKey(): string {
  return API_KEY_PREFIX + randomBytes(24).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function apiKeyPrefix(key: string): string {
  return key.slice(0, API_KEY_PREFIX.length + 4);
}

export function isWellFormedApiKey(key: string): boolean {
  return API_KEY_PATTERN.test(key);
}

export function parseBearer(header: string | null | undefined): string | undefined {
  const match = header?.trim().match(/^Bearer\s+(\S+)$/i);
  return match?.[1];
}
