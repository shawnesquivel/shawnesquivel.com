import type { Metadata } from "next";
import { Tweet } from "react-tweet";
import CTAButton from "@/components/agency/CTAButton";
import Reveal from "@/components/agency/Reveal";
import { Serif } from "@/components/agency/Section";
import WorkCard from "@/components/agency/WorkCard";
import { TWEET_IDS, WORK, type WorkCategory } from "@/lib/agency/site";

export const metadata: Metadata = {
  title: "Work",
  description: "Videos, launches, technical writing, cookbooks, courses, and developer events by Shawn Esquivel.",
};

const CATEGORIES: WorkCategory[] = ["Long-form video", "Short-form", "Writing", "Cookbooks & code", "Courses", "Community"];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");

export default function WorkPage() {
  return (
    <div className="relative">
      <div className="ag-grid ag-mask-fade-y pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <header className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 pb-12 pt-16 md:pt-24">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Portfolio</span>
        <h1 className="ag-text-gradient max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
          The work, <Serif>not the pitch.</Serif>
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          Long-form tutorials, launch posts, AEO writing, shipped plugins, and IRL events for Cursor, Composio, Claude
          Code, Codex, and more.
        </p>
        <nav className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <a
              key={c}
              href={`#${slug(c)}`}
              className="rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {c}
            </a>
          ))}
        </nav>
      </header>

      <div className="relative mx-auto max-w-6xl space-y-20 px-5 pb-24">
        {CATEGORIES.map((category) => {
          const items = WORK.filter((w) => w.category === category);
          return (
            <section key={category} id={slug(category)} className="scroll-mt-24">
              <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4">
                <h2 className="text-2xl font-semibold tracking-tight">{category}</h2>
                <span className="font-mono text-xs text-subtle">{items.length} items</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, i) => (
                  <Reveal key={item.title} delay={(i % 3) * 80}>
                    <WorkCard item={item} />
                  </Reveal>
                ))}
              </div>
            </section>
          );
        })}

        <section id="posts" className="scroll-mt-24">
          <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Posts on X</h2>
            <a href="https://x.com/shawnbuilds" target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-fg">
              @shawnbuilds ↗
            </a>
          </div>
          <div data-theme="dark" className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3 [&_.react-tweet-theme]:!my-0">
            {TWEET_IDS.map((id) => (
              <Tweet key={id} id={id} />
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center gap-5 rounded-3xl border border-line-strong bg-surface px-6 py-16 text-center">
          <h2 className="ag-text-gradient text-3xl font-semibold tracking-tight md:text-4xl">
            Want this for <Serif>your product?</Serif>
          </h2>
          <p className="max-w-xl text-muted">Unlimited requests, one flat monthly fee, cancel anytime.</p>
          <CTAButton />
        </div>
      </div>
    </div>
  );
}
