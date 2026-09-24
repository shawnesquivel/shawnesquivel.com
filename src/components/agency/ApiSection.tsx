import Link from "next/link";
import CTAButton from "@/components/agency/CTAButton";
import Reveal from "@/components/agency/Reveal";
import RequestPlayground from "@/components/agency/RequestPlayground";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";

export default function ApiSection() {
  return (
    <Section id="api" className="relative border-t border-line">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-80 max-w-3xl rounded-full bg-violet/10 blur-[120px]" />
      <SectionHeading
        eyebrow="Agent-native requests"
        title={
          <>
            Request content like you <Serif>call an API.</Serif>
          </>
        }
        description="Every request is a structured ticket, so your team or your agent can file one from anywhere. Connect the official MCP server to Cursor, Claude Code, or Codex, or just message your private Slack channel."
      />
      <Reveal>
        <RequestPlayground />
      </Reveal>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Reveal>
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface p-7">
            <span className="w-fit rounded-full bg-violet/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet">
              MCP server
            </span>
            <h3 className="text-xl font-semibold">Let your agent file it</h3>
            <p className="text-muted">
              Add one config block and your agent can create requests, check status, and pull the finished link.
              Every team gets its own API key.
            </p>
            <Link
              href="/agency/mcp"
              className="group mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg hover:text-accent"
            >
              Setup for Cursor, Claude Code & Codex
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface p-7">
            <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
              Slack
            </span>
            <h3 className="text-xl font-semibold">Or just send it in Slack</h3>
            <p className="text-muted">
              Not using agents? You get a private Slack channel for requests, updates, feedback, and drafts. One
              thread per piece, no new tools to learn.
            </p>
            <CTAButton className="mt-auto w-fit" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
