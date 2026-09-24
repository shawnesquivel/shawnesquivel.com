import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createSlackNotifier } from "@/lib/agency/server/notify";
import { createDevRelService, type DevRelService } from "@/lib/agency/server/service";
import { SupabaseStore } from "@/lib/agency/server/store";

let cached: DevRelService | null = null;

export function getDevRelService(): DevRelService | null {
  if (cached) return cached;
  const { SUPABASE_URL, SUPABASE_SECRET_KEY, SLACK_WEBHOOK_URL, DEVREL_DAILY_REQUEST_LIMIT } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;

  const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const limit = Number(DEVREL_DAILY_REQUEST_LIMIT);
  cached = createDevRelService({
    store: new SupabaseStore(db),
    notify: createSlackNotifier(SLACK_WEBHOOK_URL),
    defaultDailyLimit: Number.isInteger(limit) && limit > 0 ? limit : undefined,
  });
  return cached;
}

const MAX_BODY_BYTES = 32 * 1024;

export async function readLimitedText(req: Request): Promise<string | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return null;
  const body = await req.text();
  return new TextEncoder().encode(body).length > MAX_BODY_BYTES ? null : body;
}

export function tooLarge(): Response {
  return Response.json({ error: { type: "payload_too_large", messages: ["Request body too large."] } }, { status: 413 });
}
