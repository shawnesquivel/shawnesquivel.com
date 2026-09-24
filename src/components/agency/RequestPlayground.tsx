"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AUDIENCES, REQUEST_TYPES, type Audience, type Priority, type RequestType } from "@/lib/agency/request-types";
import { useOrigin } from "@/lib/agency/use-origin";

const EXAMPLE_TITLES: Record<RequestType, string> = {
  blog: "How to add OAuth to your AI agent in 5 minutes",
  article: "The complete guide to running MCP servers in production",
  shortform: "Our Cursor plugin in 60 seconds",
  longform: "Build a Slack agent with Claude Code (full tutorial)",
  thread: "Launch thread: our Python SDK v2 is live",
  cookbook: "GitHub triage agent with our TypeScript SDK",
};

const TABS = ["MCP", "cURL", "TypeScript"] as const;
type Tab = (typeof TABS)[number];

type ApiResult = { status: number; body: unknown } | null;

const SAMPLE_KEY = "drk_live_xxxxxxxxxxxxxxxx";

export default function RequestPlayground() {
  const origin = useOrigin();
  const endpoint = `${origin}/api/agency/requests`;
  const [type, setType] = useState<RequestType>("cookbook");
  const [title, setTitle] = useState(EXAMPLE_TITLES.cookbook);
  const [brief, setBrief] = useState("Show devs how to triage issues with an agent. Use the latest SDK.");
  const [audience, setAudience] = useState<Audience>("intermediate");
  const [priority, setPriority] = useState<Priority>("normal");
  const [tab, setTab] = useState<Tab>("MCP");
  const [result, setResult] = useState<ApiResult>(null);
  const [loading, setLoading] = useState(false);

  const payload = useMemo(
    () => ({ type, title, ...(brief ? { brief } : {}), audience, priority }),
    [type, title, brief, audience, priority],
  );

  function selectType(next: RequestType) {
    if (title === EXAMPLE_TITLES[type]) setTitle(EXAMPLE_TITLES[next]);
    setType(next);
  }

  async function send() {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult({ status: res.status, body: await res.json() });
    } catch {
      setResult({ status: 0, body: { error: "Network error" } });
    } finally {
      setLoading(false);
    }
  }

  const json = JSON.stringify(payload, null, 2);
  const code: Record<Tab, string> = {
    MCP: `// .cursor/mcp.json (Claude Code and Codex work the same way)
{
  "mcpServers": {
    "devrel": {
      "url": "${origin}/api/agency/mcp",
      "headers": {
        "Authorization": "Bearer ${SAMPLE_KEY}" // your API key
      }
    }
  }
}

// Then ask your agent
> "File a ${REQUEST_TYPES[type].label.toLowerCase()} request: ${title}"

// It calls the tool
create_request(${json})`,
    cURL: `# drk_live_... is your API key
curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${SAMPLE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`,
    TypeScript: `const res = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${SAMPLE_KEY}", // your API key
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${json.replace(/\n/g, "\n  ")}),
});

const request = await res.json(); // { id: "req_...", status: "queued" }`,
  };

  return (
    <div className="grid overflow-hidden rounded-3xl border border-line-strong bg-surface shadow-2xl shadow-black/40 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex flex-col gap-6 border-b border-line p-6 md:p-8 lg:border-b-0 lg:border-r">
        <Field label="type">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(REQUEST_TYPES) as RequestType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectType(t)}
                aria-pressed={type === t}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-all ${
                  type === t
                    ? "border-accent/60 bg-accent-soft text-accent"
                    : "border-line text-muted hover:border-line-strong hover:text-fg"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtle">{REQUEST_TYPES[type].description}</p>
        </Field>

        <Field label="title" htmlFor="req-title">
          <input
            id="req-title"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none transition-colors placeholder:text-subtle focus:border-accent/60"
          />
        </Field>

        <Field label="brief" htmlFor="req-brief">
          <textarea
            id="req-brief"
            value={brief}
            rows={3}
            maxLength={2000}
            onChange={(e) => setBrief(e.target.value)}
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none transition-colors focus:border-accent/60"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <Field label="audience">
            <Segmented options={AUDIENCES} value={audience} onChange={setAudience} />
          </Field>
          <Field label="priority">
            <Segmented options={["normal", "rush"] as const} value={priority} onChange={setPriority} />
          </Field>
        </div>

        <div className="mt-auto space-y-2">
          <button
            type="button"
            onClick={send}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-white/5 px-4 py-3 font-mono text-sm text-fg transition-all hover:border-accent/50 hover:bg-accent-soft hover:text-accent disabled:opacity-60"
          >
            {loading ? "Sending…" : "POST /api/agency/requests"}
            <span aria-hidden>↵</span>
          </button>
          <p className="text-center text-xs text-subtle">Sandbox: nothing is stored. Real requests use your API key.</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col bg-bg/60">
        <div className="flex items-center justify-between border-b border-line px-4">
          <div role="tablist" className="flex">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative px-3 py-3 text-xs font-medium transition-colors ${
                  tab === t ? "text-fg" : "text-subtle hover:text-muted"
                }`}
              >
                {t}
                {tab === t && <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />}
              </button>
            ))}
          </div>
          <span className="font-mono text-[10px] text-subtle">sandbox</span>
        </div>

        <pre className="max-h-[28rem] min-h-64 flex-1 overflow-auto p-5 font-mono text-[12.5px] leading-relaxed text-muted">
          <code>{highlight(code[tab])}</code>
        </pre>

        <div className="border-t border-line">
          <div className="flex items-center gap-2 px-5 py-2.5 font-mono text-[11px] text-subtle">
            <span>Response</span>
            {result && (
              <span
                className={`rounded px-1.5 py-0.5 ${
                  result.status === 201 ? "bg-accent-soft text-accent" : "bg-red-500/15 text-red-300"
                }`}
              >
                {result.status || "ERR"}
              </span>
            )}
          </div>
          <pre className="max-h-64 min-h-28 overflow-auto px-5 pb-5 font-mono text-[12.5px] leading-relaxed text-muted">
            <code>
              {result ? highlight(JSON.stringify(result.body, null, 2)) : <span className="text-subtle">{"// Send the request to create a sandbox ticket"}</span>}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-subtle">
        {label}
      </label>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-bg p-0.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            value === o ? "bg-white/10 text-fg" : "text-subtle hover:text-muted"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const TOKEN = /("(?:[^"\\]|\\.)*"(?=\s*:))|("(?:[^"\\]|\\.)*"|'[^']*'|`[^`]*`)|((?<![:\w])\/\/.*$|^#.*$)|\b(const|await|true|false|null|curl)\b|(\b\d+\b)/gm;

function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(src.slice(last, i));
    const [text, key, str, comment, keyword, num] = m;
    const cls = key
      ? "text-violet"
      : str
        ? "text-amber-200"
        : comment
          ? "text-subtle italic"
          : keyword
            ? "text-accent"
            : num
              ? "text-sky-300"
              : "";
    out.push(
      <span key={i} className={cls}>
        {text}
      </span>,
    );
    last = i + text.length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}
