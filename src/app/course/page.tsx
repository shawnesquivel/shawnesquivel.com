import { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Cursor Crash Course — Free on YouTube | Shawn Esquivel",
  description:
    "Learn to build and deploy AI apps with Cursor. 14 free videos: from setup to shipping. No coding experience needed.",
};

const YOUTUBE_URL = "#"; // TODO: replace with playlist link
const COMMUNITY_URL =
  "https://shawnesquivel.thinkific.com/enroll/3491521?price_id=4414098";

/* ─────────────────────────── Data ─────────────────────────── */

type Video = {
  number: number;
  title: string;
  duration: string;
  description: string;
  cursorFeature: string;
  projectState: string;
};

type Section = {
  id: string;
  level: string;
  title: string;
  subtitle: string;
  color: string;
  accentBg: string;
  dotColor: string;
  transformation: string;
  videos: Video[];
};

const sections: Section[] = [
  {
    id: "101",
    level: "101",
    title: "Build an AI Chatbot",
    subtitle: "Complete Beginner",
    color: "bg-blue",
    accentBg: "bg-blue",
    dotColor: "text-blue",
    transformation: "\"It talks to you\"",
    videos: [
      {
        number: 1,
        title: "What is Cursor + Setup",
        duration: "12 min",
        description:
          "Install Cursor, Node.js, and Git. Create a GitHub account. Your first AI-generated code.",
        cursorFeature: "Install & UI Tour",
        projectState: "Environment ready",
      },
      {
        number: 2,
        title: "Agent Mode — Build a Chatbot",
        duration: "15 min",
        description:
          "Use Agent Mode to build an AI chatbot with streaming responses. Connect OpenAI. See it work.",
        cursorFeature: "Agent Mode",
        projectState: "Working chatbot",
      },
      {
        number: 3,
        title: "Git + GitHub — Never Lose Your Work",
        duration: "10 min",
        description:
          "Save your code with Git. Push to GitHub. Never lose progress again.",
        cursorFeature: "Source Control",
        projectState: "Code backed up",
      },
      {
        number: 4,
        title: "Deploy to Vercel — Go Live",
        duration: "8 min",
        description:
          "One-click deploy. Get a real URL. Share your chatbot with anyone.",
        cursorFeature: "Vercel Deploy",
        projectState: "Live URL ✓",
      },
      {
        number: 5,
        title: "Cursor Tab + Rules — Train Your AI",
        duration: "12 min",
        description:
          "Use Tab for quick edits. Write Rules so Cursor follows your conventions every time.",
        cursorFeature: "Tab & Rules",
        projectState: "Consistent output",
      },
    ],
  },
  {
    id: "201",
    level: "201",
    title: "Turn It Into an AI Agent",
    subtitle: "Intermediate",
    color: "bg-green",
    accentBg: "bg-green",
    dotColor: "text-green",
    transformation: "\"It remembers and can do things\"",
    videos: [
      {
        number: 6,
        title: "Plan Mode — Think Before You Build",
        duration: "12 min",
        description:
          "Make Cursor plan complex features before coding. Review the blueprint, then build.",
        cursorFeature: "Plan Mode",
        projectState: "Planning workflow",
      },
      {
        number: 7,
        title: "Add Memory with Supabase",
        duration: "15 min",
        description:
          "Give your chatbot a database. Chat history persists. Conversations live in a sidebar.",
        cursorFeature: "Plan → Agent",
        projectState: "Chatbot has memory",
      },
      {
        number: 8,
        title: "Debug Mode — Fix Bugs Fast",
        duration: "12 min",
        description:
          "Stop going in circles. Debug Mode instruments your app to find the root cause.",
        cursorFeature: "Debug Mode",
        projectState: "Can fix bugs",
      },
      {
        number: 9,
        title: "MCP — Give Cursor Eyes & Hands",
        duration: "12 min",
        description:
          "Connect Cursor to your browser and database. It can see your app and fix visual bugs.",
        cursorFeature: "MCP",
        projectState: "Cursor sees the app",
      },
      {
        number: 10,
        title: "BugBot + Security",
        duration: "10 min",
        description:
          "AI code review on every PR. Catch security holes before hackers do.",
        cursorFeature: "BugBot",
        projectState: "Secure app ✓",
      },
    ],
  },
  {
    id: "301",
    level: "301",
    title: "Build Like a Team of 10",
    subtitle: "Advanced",
    color: "bg-purple",
    accentBg: "bg-purple",
    dotColor: "text-purple",
    transformation: "\"Ship 10x faster\"",
    videos: [
      {
        number: 11,
        title: "Background Agents",
        duration: "10 min",
        description:
          "AI builds features in the cloud while you sleep. Review the PR in the morning.",
        cursorFeature: "Cloud Agents",
        projectState: "Async delegation",
      },
      {
        number: 12,
        title: "Parallel Agents — Build 8 at Once",
        duration: "12 min",
        description:
          "Run multiple agents simultaneously. Cursor picks the best solution.",
        cursorFeature: "Multi-Agent",
        projectState: "Team of agents",
      },
      {
        number: 13,
        title: "Visual Browser + Design",
        duration: "12 min",
        description:
          "Click to edit. Drag to move. Screenshot a reference and Cursor matches it.",
        cursorFeature: "Browser Sidebar",
        projectState: "Polished UI ✓",
      },
      {
        number: 14,
        title: "Full Build Demo — Idea to Deployed",
        duration: "20 min",
        description:
          "Build a brand new AI app from scratch using every tool. Timed. Start to finish.",
        cursorFeature: "Everything",
        projectState: "Complete workflow ✓",
      },
    ],
  },
];

const totalVideos = sections.reduce((a, s) => a + s.videos.length, 0);
const totalMinutes = sections.reduce(
  (a, s) =>
    a + s.videos.reduce((b, v) => b + parseInt(v.duration), 0),
  0
);

/* ─────────────────────────── Components ─────────────────────────── */

function VideoCard({ video, color, index }: { video: Video; color: string; index: number }) {
  return (
    <ScrollReveal delay={index * 100} direction="up">
      <div className={`neo-shadow neo-hover ${color} p-5 group relative`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <span className="neo-shadow-sm flex h-8 w-8 shrink-0 items-center justify-center bg-foreground text-sm font-black text-surface">
              {video.number}
            </span>
            <h4 className="text-base font-black uppercase tracking-tight leading-tight">
              {video.title}
            </h4>
          </div>
          <span className="shrink-0 text-xs font-bold bg-surface border-2 border-foreground px-2 py-1">
            {video.duration}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed ml-11">
          {video.description}
        </p>
        <div className="flex gap-2 mt-3 ml-11 flex-wrap">
          <span className="text-xs font-bold bg-surface border-2 border-foreground px-2 py-0.5">
            {video.cursorFeature}
          </span>
          <span className="text-xs font-bold bg-yellow border-2 border-foreground px-2 py-0.5">
            → {video.projectState}
          </span>
        </div>
      </div>
    </ScrollReveal>
  );
}

function SectionBlock({ section, index }: { section: Section; index: number }) {
  const direction = index % 2 === 0 ? "left" : "right";

  return (
    <div className="relative">
      {/* Section header */}
      <ScrollReveal direction={direction}>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <span
              className={`neo-shadow-sm ${section.accentBg} px-4 py-2 text-sm font-black uppercase`}
            >
              {section.level}
            </span>
            <span className="text-sm font-bold text-muted uppercase">
              {section.subtitle}
            </span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight sm:text-4xl">
            {section.title}
          </h3>
          <p className="mt-1 text-base font-bold italic text-muted">
            {section.transformation}
          </p>
        </div>
      </ScrollReveal>

      {/* Video cards */}
      <div className="space-y-4">
        {section.videos.map((video, vIndex) => (
          <VideoCard
            key={video.number}
            video={video}
            color={section.color}
            index={vIndex}
          />
        ))}
      </div>

      {/* Section outcome */}
      <ScrollReveal delay={section.videos.length * 100}>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-0.5 flex-1 bg-foreground" />
          <span className="neo-shadow-sm bg-foreground px-4 py-2 text-xs font-black uppercase text-surface">
            {section.id} Complete →{" "}
            {section.videos[section.videos.length - 1].projectState}
          </span>
          <div className="h-0.5 flex-1 bg-foreground" />
        </div>
      </ScrollReveal>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function CursorCrashCoursePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ───── Nav ───── */}
      <nav className="fixed top-0 z-50 w-full border-b-3 border-foreground bg-yellow">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a
            href="/"
            className="text-lg font-black uppercase tracking-tight hover:underline decoration-3 underline-offset-4"
          >
            Build with Cursor
          </a>
          <div className="flex items-center gap-4 text-sm font-bold uppercase">
            <a
              href="#curriculum"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              Curriculum
            </a>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn rounded-full bg-accent px-4 py-2 text-xs text-white"
            >
              Watch Free
            </a>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24">
        {/* Background rays */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="hero-rays h-[150vh] w-[150vh] rounded-full" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <ScrollReveal direction="scale">
            <p className="neo-shadow-sm mb-8 inline-block bg-green px-4 py-2 text-sm font-black uppercase tracking-widest">
              Free on YouTube — {totalVideos} Videos
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl font-black leading-tight uppercase tracking-tight sm:text-5xl md:text-7xl">
              Cursor
              <br />
              Crash Course
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed font-medium">
              Go from zero to deployed AI app.{" "}
              <span className="font-black">No coding experience needed.</span>
              <br />
              {totalVideos} videos. ~{Math.round(totalMinutes / 60)} hours. One project. Completely free.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-10 flex flex-col items-center gap-3">
              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {[
                  { label: "Videos", value: String(totalVideos) },
                  { label: "Hours", value: `~${Math.round(totalMinutes / 60)}` },
                  { label: "Dependencies", value: "3" },
                  { label: "Price", value: "$0" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="neo-shadow-sm bg-surface px-4 py-2 text-center"
                  >
                    <p className="text-xl font-black">{stat.value}</p>
                    <p className="text-xs font-bold uppercase text-muted">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border-3 border-foreground bg-accent px-8 py-4 text-base font-black uppercase tracking-wide text-white shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Watch Free on YouTube
                </a>
                <a
                  href="#curriculum"
                  className="inline-block rounded-full border-3 border-foreground bg-surface px-8 py-4 text-base font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  See Curriculum
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───── The Arc ───── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="mb-12 text-center text-3xl font-black uppercase sm:text-5xl">
              One Project. Three Levels.
            </h2>
          </ScrollReveal>

          <div className="relative flex flex-col gap-8 md:flex-row md:gap-6">
            {sections.map((section, i) => (
              <ScrollReveal key={section.id} delay={i * 150} direction="up" className="flex-1">
                <div className={`neo-shadow ${section.color} p-6 h-full flex flex-col`}>
                  <span className="neo-shadow-sm inline-block self-start bg-foreground text-surface px-3 py-1 text-xs font-black uppercase mb-3">
                    {section.level}
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm font-bold italic text-muted mb-3">
                    {section.transformation}
                  </p>
                  <p className="text-sm font-medium leading-relaxed flex-1">
                    {section.videos.length} videos · {section.videos.reduce((a, v) => a + parseInt(v.duration), 0)} min
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {section.videos.map((v) => (
                      <span
                        key={v.number}
                        className="text-xs font-bold bg-surface border-2 border-foreground px-1.5 py-0.5"
                      >
                        {v.cursorFeature}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Arrow flow */}
          <ScrollReveal delay={500}>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm font-black uppercase">
              <span className="neo-shadow-sm bg-blue px-3 py-1">Chatbot</span>
              <span>→</span>
              <span className="neo-shadow-sm bg-green px-3 py-1">Agent</span>
              <span>→</span>
              <span className="neo-shadow-sm bg-purple px-3 py-1">10x Ship</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───── Divider ───── */}
      <div className="mx-auto my-4 h-1 w-full max-w-5xl bg-foreground" />

      {/* ───── Curriculum ───── */}
      <section id="curriculum" className="scroll-mt-24 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
              Full Curriculum
            </h2>
            <p className="mx-auto mb-16 max-w-xl text-center font-medium text-muted">
              {totalVideos} videos. Every one is free. Follow along and build.
            </p>
          </ScrollReveal>

          <div className="space-y-20">
            {sections.map((section, i) => (
              <SectionBlock key={section.id} section={section} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Divider ───── */}
      <div className="mx-auto my-4 h-1 w-full max-w-5xl bg-foreground" />

      {/* ───── Tech Stack ───── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <h2 className="mb-4 text-3xl font-black uppercase sm:text-5xl">
              3 Dependencies. That&apos;s It.
            </h2>
            <p className="mx-auto mb-10 max-w-lg font-medium text-muted">
              No Docker. No separate backend. No complex setup.
              Just Next.js, OpenAI, and Supabase.
            </p>
          </ScrollReveal>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Next.js", desc: "Framework", color: "bg-blue" },
              { name: "OpenAI", desc: "AI API", color: "bg-green" },
              { name: "Supabase", desc: "Database", color: "bg-purple" },
              { name: "Vercel", desc: "Hosting (free)", color: "bg-yellow" },
              { name: "Cursor", desc: "AI Editor", color: "bg-pink" },
            ].map((tech, i) => (
              <ScrollReveal key={tech.name} delay={i * 80} direction="scale">
                <div className={`neo-shadow ${tech.color} px-5 py-4 text-center`}>
                  <p className="text-sm font-black uppercase">{tech.name}</p>
                  <p className="text-xs font-medium text-muted">{tech.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Divider ───── */}
      <div className="mx-auto my-4 h-1 w-full max-w-5xl bg-foreground" />

      {/* ───── Community CTA ───── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal direction="scale">
            <div className="neo-shadow-lg bg-yellow p-10 text-center">
              <h2 className="mb-4 text-3xl font-black uppercase sm:text-4xl">
                Want Templates + Community?
              </h2>
              <p className="mb-2 font-medium">
                The videos are free. The templates, prompts, and the community
                that helps when you&apos;re stuck:
              </p>
              <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 mb-8">
                {[
                  { emoji: "🚀", text: "Web App Starter Template" },
                  { emoji: "📝", text: "20+ Cursor Rules Library" },
                  { emoji: "💬", text: "Private Community Chat" },
                  { emoji: "📞", text: "Coaching Calls" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="neo-shadow-sm bg-surface px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-sm font-bold">{item.text}</span>
                  </div>
                ))}
              </div>
              <a
                href={COMMUNITY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full border-3 border-foreground bg-accent px-8 py-4 text-base font-black uppercase tracking-wide text-white shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                Join the Community
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="mt-10 border-t-3 border-foreground bg-foreground py-10 text-sm text-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="font-black uppercase">
              &copy; {new Date().getFullYear()} Amihan Ventures Inc.
            </p>
            <p className="mt-1">
              <a
                href="mailto:shawnesquivel24@gmail.com"
                className="underline decoration-2 underline-offset-2 hover:text-yellow"
              >
                shawnesquivel24@gmail.com
              </a>
            </p>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://www.youtube.com/@shawn.builds"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-yellow"
              aria-label="YouTube"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/shawn.builds"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-yellow"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/shawnesquivel/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-yellow"
              aria-label="LinkedIn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
