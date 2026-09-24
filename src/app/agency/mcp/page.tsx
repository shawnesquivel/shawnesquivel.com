import type { Metadata } from "next";
import type { ReactNode } from "react";
import CTAButton from "@/components/agency/CTAButton";
import McpSetup from "@/components/agency/McpSetup";
import { Serif } from "@/components/agency/Section";

export const metadata: Metadata = {
  title: "Connect your agent",
  description: "Connect Cursor, Claude Code, or Codex to the AI Native DevRel MCP server and file DevRel requests from your editor.",
};

const TOOLS = [
  { name: "create_request", body: "File a blog, article, short-form or long-form video, thread, or cookbook." },
  { name: "list_requests", body: "See everything you've requested, newest first, optionally filtered by status." },
  { name: "get_request", body: "Check one request's status and grab the deliverable link once it ships." },
];

const PROMPTS = [
  "File a cookbook request: build a GitHub triage agent with our TypeScript SDK. Rush it.",
  "Turn the launch notes in CHANGELOG.md into a long-form video request for developers.",
  "What's the status of my DevRel requests? Link anything that shipped.",
];

const STATUSES = ["queued", "in_progress", "in_review", "shipped"];

const SAFEGUARDS = [
  "One API key per team. Only a hash is stored, and keys can be revoked instantly.",
  "Your agent only ever sees your own requests.",
  "Every request is validated, size-limited, and capped per day to stop runaway agents.",
];

export default function McpPage() {
  return (
    <div className="relative">
      <div className="ag-grid ag-mask-fade-y pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
      <div className="relative mx-auto max-w-4xl px-5 pb-24 pt-16 md:pt-24">
        <header className="mb-14 space-y-5">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">MCP server</span>
          <h1 className="ag-text-gradient text-5xl font-semibold tracking-tight md:text-6xl">
            Connect your agent. <Serif>Request from your editor.</Serif>
          </h1>
          <p className="max-w-2xl text-lg text-muted">
            The official AI Native DevRel MCP server lets Cursor, Claude Code, and Codex file requests and track them
            for you. Setup takes one config block.
          </p>
        </header>

        <ol className="space-y-14">
          <Step n="01" title="Get your API key">
            <p className="text-muted">
              Every team gets its own key after the intro call. It identifies your team, so keep it out of git.
            </p>
            <CTAButton className="mt-5" />
          </Step>

          <Step n="02" title="Add the server">
            <McpSetup />
          </Step>

          <Step n="03" title="Ask your agent">
            <ul className="space-y-2">
              {PROMPTS.map((p) => (
                <li key={p} className="rounded-xl border border-line bg-surface px-4 py-3 font-mono text-sm text-muted">
                  <span className="text-accent">&gt;</span> {p}
                </li>
              ))}
            </ul>
          </Step>
        </ol>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {TOOLS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-line bg-surface p-5">
              <code className="font-mono text-sm text-accent">{t.name}</code>
              <p className="mt-2 text-sm text-muted">{t.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 font-semibold">What happens next</h2>
            <p className="mb-4 text-sm text-muted">
              Shawn is notified the moment you file. Status updates show up in your agent as work moves along.
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {STATUSES.map((s, i) => (
                <span key={s} className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-1 ${s === "shipped" ? "bg-accent text-black" : "bg-white/5 text-muted"}`}>
                    {s}
                  </span>
                  {i < STATUSES.length - 1 && <span className="text-subtle">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 font-semibold">Safeguards</h2>
            <ul className="space-y-2 text-sm text-muted">
              {SAFEGUARDS.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-4 flex flex-col items-start gap-4 rounded-2xl border border-line-strong bg-surface p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Not using agents?</h2>
            <p className="text-sm text-muted">
              Send requests, updates, and feedback in your private Slack channel instead. Same queue, same turnaround.
            </p>
          </div>
          <CTAButton className="shrink-0" />
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="grid gap-4 md:grid-cols-[120px_1fr]">
      <div>
        <span className="font-mono text-sm text-accent">{n}</span>
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      </div>
      <div className="min-w-0">{children}</div>
    </li>
  );
}
