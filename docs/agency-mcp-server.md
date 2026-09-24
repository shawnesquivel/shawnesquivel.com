# AI Native DevRel MCP server (v0.1)

The smallest version that proves the stack works end to end: an agent in Cursor, Claude Code, or Codex files a DevRel request, it lands in Supabase, and Shawn gets a Slack ping.

## Flow

```
Client's agent (Cursor / Claude Code / Codex)
  │  Streamable HTTP + Authorization: Bearer drk_live_…
  ▼
POST /api/agency/mcp  (Next.js route on Vercel, mcp-handler + MCP SDK v2)
  │  auth → validate → daily quota
  ▼
Supabase Postgres: clients, requests          ──►  Slack incoming webhook (Shawn's #devrel-requests)
  ▲
  └── Shawn updates status / deliverable_url in the Supabase Table Editor;
      the client's agent sees it via list_requests / get_request
```

## Tools

| Tool             | Input                                                                 | Returns                            |
| ---------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `create_request` | `type`, `title`, optional `brief`, `audience`, `priority`, `links`    | The new request (status `queued`)  |
| `list_requests`  | optional `status`, `limit` (1–50, default 20)                         | The caller's requests, newest first |
| `get_request`    | `id`                                                                  | One of the caller's requests       |

`type` is one of `blog`, `article`, `shortform`, `longform`, `thread`, `cookbook`.
Statuses: `queued`, `in_progress`, `in_review`, `shipped`, `cancelled`.

The same `create_request` logic backs `POST /api/agency/requests` for plain HTTP clients. Without an API key that endpoint stays a sandbox (validates and echoes, stores nothing) so the landing-page playground keeps working.

## Safeguards

1. **API key required.** `Authorization: Bearer drk_live_<32 chars>`. Only a SHA-256 hash is stored. Keys are issued by Shawn with `npm run agency:keys:create -- "Client name"` and revoked by setting `clients.revoked_at`.
2. **Tenant isolation.** Every query is scoped to the authenticated client. Another client's request id returns "not found".
3. **Daily quota.** Each client can create `DEVREL_DAILY_REQUEST_LIMIT` requests per rolling 24h (default 10), overridable per client with `clients.daily_request_limit`.
4. **Strict input validation.** zod schema with length limits, URL-only links (max 10), unknown fields rejected.
5. **Body size cap.** Requests over 32 KB get `413` before reaching MCP.
6. **Database locked down.** RLS is on with no policies, so only the server's secret key can read or write.

Out of scope for v0.1: OAuth, per-minute rate limiting, file uploads, client dashboard, billing.

## Environment

| Variable                     | Required | Notes                                           |
| ---------------------------- | -------- | ----------------------------------------------- |
| `SUPABASE_URL`               | yes      | Project URL                                     |
| `SUPABASE_SECRET_KEY`        | yes      | Secret (service role) key, server only          |
| `SLACK_WEBHOOK_URL`          | no       | Incoming webhook for new-request notifications  |
| `DEVREL_DAILY_REQUEST_LIMIT` | no       | Default 10                                      |

Without the Supabase variables `/api/agency/mcp` answers `503` and the rest of the site works normally.

## Tests

- `npm run test:agency`: unit tests (schema, API keys, service rules, Slack formatting) against an in-memory store.
- `npm run test:agency:e2e`: builds the app, runs it against local Supabase (`npx supabase start`), and drives it with the official MCP client over HTTP, plus a mock Slack webhook.
