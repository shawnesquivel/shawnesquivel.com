// Fake Supabase RPC endpoint backed by PGlite + synthetic events, for previewing /boggled/stats.
// Usage: npx tsx tests/boggled/stats-server.mts [port]
// then run the app with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:<port> NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dev
import { createServer } from "node:http";
import { callRpc, seededDb } from "./stats-fixture.mjs";

const port = Number(process.argv[2] ?? 54329);
const db = await seededDb();

createServer(async (req, res) => {
  const m = req.url?.match(/^\/rest\/v1\/rpc\/(boggled_[a-z_]+)$/);
  if (req.method !== "POST" || !m) {
    res.writeHead(404).end();
    return;
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  try {
    const out = await callRpc(db, m[1], JSON.parse(body || "{}"));
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(out));
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(port, "127.0.0.1", () => console.log(`fake stats RPC on http://127.0.0.1:${port}`));
