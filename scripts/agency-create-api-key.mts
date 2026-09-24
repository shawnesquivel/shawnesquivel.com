import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { apiKeyPrefix, generateApiKey, hashApiKey } from "../src/lib/agency/server/api-keys";
import { SupabaseStore } from "../src/lib/agency/server/store";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    limit: { type: "string" },
    url: { type: "string", default: process.env.DEVREL_PUBLIC_URL ?? "https://www.shawn-builds.com" },
  },
});

const name = positionals.join(" ").trim();
if (!name) {
  console.error('Usage: npm run agency:keys:create -- "Client name" [--limit 20] [--url https://your-domain]');
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (e.g. in .env.local).");
  process.exit(1);
}

const store = new SupabaseStore(createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } }));
const key = generateApiKey();
const client = await store.createClient({
  name,
  apiKeyHash: hashApiKey(key),
  apiKeyPrefix: apiKeyPrefix(key),
  dailyRequestLimit: values.limit ? Number(values.limit) : null,
});

const mcpUrl = `${values.url.replace(/\/$/, "")}/api/agency/mcp`;

console.log(`
Created client "${client.name}" (${client.id}).

API key (shown once, send it privately):
  ${key}

Cursor (.cursor/mcp.json):
  {
    "mcpServers": {
      "devrel": {
        "url": "${mcpUrl}",
        "headers": { "Authorization": "Bearer ${key}" }
      }
    }
  }

Claude Code:
  claude mcp add --transport http devrel ${mcpUrl} --header "Authorization: Bearer ${key}"

Codex (~/.codex/config.toml, then export DEVREL_API_KEY=${key}):
  [mcp_servers.devrel]
  url = "${mcpUrl}"
  bearer_token_env_var = "DEVREL_API_KEY"
`);
