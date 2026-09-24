import CTAButton from "@/components/agency/CTAButton";
import Reveal from "@/components/agency/Reveal";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";

const STEPS = [
  {
    n: "01",
    title: "Subscribe",
    body: "One flat monthly fee. No hiring loop, no contracts, no agency retainers. Pause or cancel anytime.",
    visual: (
      <div className="flex items-baseline gap-1 font-mono">
        <span className="text-3xl font-semibold text-fg">1</span>
        <span className="text-sm text-subtle">plan · unlimited queue</span>
      </div>
    ),
  },
  {
    n: "02",
    title: "Request anything",
    body: "Drop it in your private Slack channel, or let your agent file it through MCP. Blogs, videos, threads, cookbooks.",
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {["blog", "longform", "shortform", "thread", "cookbook"].map((t) => (
          <span key={t} className="rounded-md border border-line bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-muted">
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    n: "03",
    title: "Ship it",
    body: "Get publish-ready deliverables in days: tested code, edited video, thumbnails, and copy. Revise until it's right.",
    visual: (
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-black">shipped</span>
        <span className="text-subtle">req_0142 · 3 days</span>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title={
          <>
            A DevRel team <Serif>without the headcount.</Serif>
          </>
        }
        description="The way design subscriptions changed design, for developer content. You bring the product; we turn it into content developers actually finish."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 100}>
            <article className="group relative flex h-full flex-col gap-6 overflow-hidden rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/5 blur-2xl transition-opacity group-hover:bg-accent/10" />
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="text-muted">{s.body}</p>
              </div>
              <div className="mt-auto border-t border-line pt-5">{s.visual}</div>
            </article>
          </Reveal>
        ))}
      </div>
      <div className="mt-12 flex justify-center">
        <CTAButton />
      </div>
    </Section>
  );
}
