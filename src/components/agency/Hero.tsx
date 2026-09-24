import Link from "next/link";
import CTAButton from "@/components/agency/CTAButton";
import HeroGraphic from "@/components/agency/HeroGraphic";
import { Serif } from "@/components/agency/Section";
import { STATS } from "@/lib/agency/site";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 md:pb-24 md:pt-20">
      <div className="ag-grid ag-mask-fade-y pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col items-start gap-7">
          <a
            href="#api"
            className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/60 py-1 pl-1 pr-3 text-xs text-muted backdrop-blur transition-colors hover:text-fg"
          >
            <span className="rounded-full bg-violet/20 px-2 py-0.5 font-mono text-[10px] text-violet">NEW</span>
            Official MCP server: request content from your agent
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>

          <h1 className="ag-text-gradient text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Your DevRel team, <Serif>as an API.</Serif>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted">
            Send a request in Slack or let your agent file one over MCP. Get blogs, long-form YouTube, X content, and
            cookbooks built by a developer who ships with Cursor, Claude Code, and Codex every day.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <CTAButton />
            <Link
              href="/agency/work"
              className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-fg ring-1 ring-line-strong transition-colors hover:bg-white/5"
            >
              See the work
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-subtle">
            {["Unlimited requests", "One flat monthly fee", "Cancel anytime"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <HeroGraphic />
      </div>

      <dl className="relative mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4 [&>div]:bg-bg">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 px-6 py-5">
            <dt className="order-2 text-sm text-subtle">{s.label}</dt>
            <dd className="text-3xl font-semibold tracking-tight">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
