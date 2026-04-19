import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio | Shawn Esquivel",
  description:
    "Awards, things I've built, and personal stories — patents, hackathon wins, open-source contributions, Matchya, and Ekona Power.",
};

const CARD_COLORS = ["bg-yellow", "bg-blue", "bg-pink", "bg-green", "bg-purple", "bg-orange"];

interface PortfolioSection {
  question: string;
  body: React.ReactNode;
}

const SECTIONS: PortfolioSection[] = [
  {
    question:
      "List any competitions / awards you have won, or papers you've published.",
    body: (
      <>
        <p>
          <strong>
            Canadian Patent{" "}
            <a
              href="https://patents.google.com/patent/CA3122554A1"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
            >
              CA3122554A1
            </a>{" "}
            (2021)
          </strong>{" "}
          — Named co-inventor on{" "}
          <em>
            &ldquo;Methods of producing one or more products using a feedstock
            gas reactor,&rdquo;
          </em>{" "}
          assigned to Ekona Power Inc. The patent covers a pulsed methane
          pyrolysis process for low-carbon hydrogen production and ammonia
          synthesis feedstock, enabling &gt;95% CO₂ emissions reduction vs.
          conventional steam methane reforming.
        </p>
        <p className="mt-4">
          <strong>Hackathon wins</strong> —{" "}
          <a
            href="https://devpost.com/shawnesquivel"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
          >
            devpost.com/shawnesquivel
          </a>
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>1st Overall</strong> at Give Back Hacks 3 —{" "}
            <em>Humankynd</em>, a full-stack crowdsourcing platform for
            charitable causes.
          </li>
          <li>
            <strong>2nd Overall</strong> at SustainHacks — <em>Decode</em>, a
            Chrome extension that rates clothing sustainability to fight
            greenwashing.
          </li>
        </ul>
      </>
    ),
  },
  {
    question:
      "Tell us about things you've built before — apps, websites, open source contributions.",
    body: (
      <>
        <p>
          <strong>Matchya</strong> —{" "}
          <a
            href="https://matchya.app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
          >
            matchya.app
          </a>
        </p>
        <p className="mt-1">
          AI for mental health app. Solo-built, 8,000+ users.
        </p>

        <p className="mt-4">
          <strong>MLH Fellowship — jupyterlab-git</strong> —{" "}
          <a
            href="https://github.com/jupyterlab/jupyterlab-git"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
          >
            github.com/jupyterlab/jupyterlab-git
          </a>
        </p>
        <p className="mt-1">
          12-week open-source fellowship contributing to the JupyterLab Git
          extension (sponsored by RBC; winner of MLH&apos;s 2022 Community Open
          Source Award). Shipped a few merged PRs.
        </p>

        <p className="mt-4">
          <strong>Teaching Cursor &amp; AI coding</strong> —{" "}
          <a
            href="https://shawn-builds.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
          >
            shawn-builds.com
          </a>
        </p>
        <p className="mt-1">
          Paid Cursor course (800+ students), plus a YouTube channel at{" "}
          <a
            href="https://www.youtube.com/@shawn.builds"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
          >
            @shawn.builds
          </a>{" "}
          (~26K subs).
        </p>
      </>
    ),
  },
  {
    question:
      "Tell us about a time you most successfully hacked some (non-computer) system to your advantage.",
    body: (
      <p>
        As a chemical engineering intern researching carbon markets, I
        cold-emailed the world&apos;s leading carbon researcher in Spain. To
        stand out, I read his full paper and led with a thoughtful critique plus
        ideas for his next one. He replied and took the meeting. That connection
        fed directly into research that became part of Canadian Patent
        CA3122554A1, a low-carbon hydrogen production process I&apos;m a named
        co-inventor on.
      </p>
    ),
  },
  {
    question:
      "In one or two sentences, the most impressive thing you've built or achieved.",
    body: (
      <p>
        I&apos;m a named co-inventor on Canadian Patent{" "}
        <strong>CA3122554A1</strong> — the IP behind Ekona Power&apos;s
        xCaliber™ methane pyrolysis reactor, which produces clean
        (&ldquo;turquoise&rdquo;) hydrogen and solid carbon from natural gas
        without CO₂ sequestration, water, or renewable electricity. Ekona raised
        a $79M Series A led by Baker Hughes and Mitsui, and is now piloting with
        ARC Resources ahead of 2026 commercial deployment.
      </p>
    ),
  },
];

export default function PortfolioPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b-3 border-foreground bg-yellow">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-black uppercase tracking-tight">
            Build with Cursor
          </Link>
          <div className="flex items-center gap-5 text-sm font-bold uppercase">
            <Link
              href="/blog"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              Blog
            </Link>
            <Link
              href="/portfolio"
              className="hover:underline decoration-3 underline-offset-4"
            >
              Portfolio
            </Link>
            <Link
              href="/#pricing"
              className="rounded-full border-2 border-foreground bg-accent px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[2px_2px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#1a1a1a]"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-12">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted">
            Shawn Esquivel
          </p>
          <h1 className="text-5xl font-black uppercase tracking-tight md:text-6xl">
            Portfolio
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-muted">
            Awards, things I&apos;ve built, and stories — patents, hackathon
            wins, open-source, Matchya, and Ekona Power.
          </p>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-8">
          {SECTIONS.map((section, i) => (
            <article
              key={section.question}
              className={`neo-shadow p-6 md:p-8 ${CARD_COLORS[i % CARD_COLORS.length]}`}
            >
              <h2 className="mb-4 text-xl font-black uppercase tracking-tight md:text-2xl">
                {section.question}
              </h2>
              <div className="text-base leading-relaxed font-medium">
                {section.body}
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16">
          <div className="neo-shadow bg-accent p-8 text-center text-white">
            <h2 className="mb-3 text-2xl font-black uppercase tracking-tight md:text-3xl">
              Want to build with me?
            </h2>
            <p className="mb-6 font-medium leading-relaxed opacity-90">
              I teach Cursor and AI coding. Go from idea to deployed app in one
              weekend.
            </p>
            <Link
              href="/"
              className="inline-block rounded-full border-3 border-white bg-white px-8 py-3 text-sm font-black uppercase tracking-wide text-accent shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
            >
              Check out the course →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-foreground bg-foreground py-8 text-center">
        <p className="text-sm font-bold uppercase text-background">
          © {new Date().getFullYear()} Shawn Esquivel
        </p>
      </footer>
    </div>
  );
}
