"use client";

import { useState } from "react";
import { useOrigin } from "@/lib/agency/use-origin";

const CLIENTS = ["Cursor", "Claude Code", "Codex", "Other"] as const;
type McpClient = (typeof CLIENTS)[number];

const KEY = "drk_live_xxxxxxxxxxxxxxxx";

function snippets(url: string): Record<McpClient, { file: string; code: string }> {
  return {
    Cursor: {
      file: ".cursor/mcp.json",
      code: `{
  "mcpServers": {
    "devrel": {
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${KEY}" }
    }
  }
}`,
    },
    "Claude Code": {
      file: "Terminal",
      code: `claude mcp add --transport http devrel ${url} \\
  --header "Authorization: Bearer ${KEY}"`,
    },
    Codex: {
      file: "~/.codex/config.toml",
      code: `[mcp_servers.devrel]
url = "${url}"
bearer_token_env_var = "DEVREL_API_KEY"

# then in your shell
export DEVREL_API_KEY=${KEY}`,
    },
    Other: {
      file: "Any Streamable HTTP MCP client",
      code: `URL:    ${url}
Header: Authorization: Bearer ${KEY}`,
    },
  };
}

export default function McpSetup() {
  const origin = useOrigin();
  const [client, setClient] = useState<McpClient>("Cursor");
  const [copied, setCopied] = useState(false);
  const { file, code } = snippets(`${origin}/api/agency/mcp`)[client];

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3">
        <div role="tablist" className="flex">
          {CLIENTS.map((c) => (
            <button
              key={c}
              role="tab"
              type="button"
              aria-selected={client === c}
              onClick={() => setClient(c)}
              className={`relative px-3 py-3 text-sm font-medium transition-colors ${
                client === c ? "text-fg" : "text-subtle hover:text-muted"
              }`}
            >
              {c}
              {client === c && <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="rounded-md px-2 py-1 font-mono text-xs text-subtle hover:text-fg">
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <p className="border-b border-line px-5 py-2 font-mono text-[11px] text-subtle">{file}</p>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-muted">
        <code>{code}</code>
      </pre>
    </div>
  );
}
