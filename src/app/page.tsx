import ImageCarousel from "@/components/ImageCarousel";
import CopyCode from "@/components/CopyCode";
import CountdownTimer from "@/components/CountdownTimer";
import PainCard from "@/components/PainCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import ZoomableImage from "@/components/ZoomableImage";

const COURSE_URL =
  "https://shawnesquivel.thinkific.com/enroll/3491521?price_id=4414098&coupon=save30";

function SectionDivider() {
  return (
    <div className="mx-auto my-16 h-1 w-full max-w-5xl bg-foreground md:my-20" />
  );
}

function CTAButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={COURSE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-full border-3 border-foreground bg-accent px-8 py-4 text-base font-black uppercase tracking-wide text-white shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
    >
      Enroll Now — Use Code SAVE30 for 30% Off
    </a>
  );
}

/* ───────────────────────────── Pain Point Card ───────────────────────────── */
// Moved to @/components/PainCard.tsx

/* ──────────────────────────── Testimonial Card ──────────────────────────── */
// Moved to @/components/TestimonialCard.tsx

/* ──────────────────────────── Included Card ──────────────────────────── */

function IncludedCard({
  emoji,
  title,
  description,
  bonus,
  color,
}: {
  emoji: string;
  title: string;
  description: string;
  bonus?: boolean;
  color: string;
}) {
  return (
    <div className={`neo-shadow neo-hover p-6 relative ${color}`}>
      {bonus && (
        <span className="neo-shadow-sm absolute -top-4 -right-2 bg-accent px-3 py-1 text-xs font-black text-white uppercase">
          Bonus
        </span>
      )}
      <p className="mb-2 text-3xl">{emoji}</p>
      <h4 className="mb-2 text-lg font-black uppercase">{title}</h4>
      <p className="text-sm leading-relaxed font-medium">{description}</p>
    </div>
  );
}

/* ──────────────────────────────── FAQ Item ──────────────────────────────── */

function FAQItem({
  id,
  question,
  children,
  defaultOpen,
}: {
  id?: string;
  question: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      id={id}
      className="group neo-shadow bg-surface scroll-mt-24"
      open={defaultOpen}
    >
      <summary className="cursor-pointer px-6 py-5 text-base font-black uppercase tracking-tight list-none flex items-center justify-between">
        {question}
        <span className="ml-4 text-xl font-black transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="border-t-3 border-foreground px-6 pb-5 pt-4 text-sm leading-relaxed font-medium">
        {children}
      </div>
    </details>
  );
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ───── Nav ───── */}
      <nav className="fixed top-0 z-50 w-full border-b-3 border-foreground bg-yellow">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-black uppercase tracking-tight">
            Build with Cursor
          </span>
          <div className="flex items-center gap-5 text-sm font-bold uppercase">
            <a
              href="#problems"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              Problems
            </a>
            <a
              href="#curriculum"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              Curriculum
            </a>
            <a
              href="#testimonials"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              Testimonials
            </a>
            <a
              href="#about"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              About
            </a>
            <a
              href="#faq"
              className="hidden hover:underline decoration-3 underline-offset-4 sm:inline"
            >
              FAQ
            </a>
            <a
              href={COURSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn rounded-full bg-accent px-4 py-2 text-xs text-white"
            >
              Enroll Now
            </a>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="neo-shadow-sm mb-8 inline-block bg-pink px-4 py-2 text-sm font-black uppercase tracking-widest">
            Build Apps With Cursor
          </p>
          <h1 className="text-4xl font-black leading-tight uppercase tracking-tight sm:text-5xl md:text-7xl">
            Go From Idea
            <br />
            to Deployed App
            <br />
            <span className="inline-block bg-accent px-3 text-white">
              In One Weekend.
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed font-medium">
            The hands-on Cursor course that 800 students have used to build and
            ship production-ready apps — without writing a single line of code.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="neo-shadow-sm inline-block bg-green px-4 py-2 text-xs font-black uppercase">
              🔓 100% Satisfaction Guarantee · 30-day refund policy
            </p>
            <p className="flex items-center gap-2 text-xs font-black uppercase">
              30% off ends in <CountdownTimer variant="compact" />
            </p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            <CTAButton />
            <a
              href="#curriculum"
              className="inline-block rounded-full border-3 border-foreground bg-surface px-8 py-4 text-base font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              See the Curriculum
            </a>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── Problems ───── */}
      <section id="problems" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            Sound Familiar?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center font-medium text-muted">
            After talking to 800 vibe coders, the same 3 problems keep coming
            up:
          </p>
          <div className="space-y-8">
            <PainCard
              emoji="🐞"
              title="Endless Bugs"
              color="bg-pink"
              items={[
                "You fix one thing and AI breaks something else.",
                "You spend hours going in circles with the same error.",
              ]}
              imageSrc="/reddit-cursor-complaint.png"
              imageCaptionAlt="AI keeps breaking the code and going in circles"
              imageCaption="A frustrated Cursor user on Reddit."
            />
            <PainCard
              emoji="⚠️"
              title="Security Risks"
              color="bg-orange"
              reverse
              items={[
                "AI writes code full of security holes you can't see.",
                "Hackers drain your cloud bill overnight.",
                "Your users' data gets exposed. Then come the lawsuits.",
              ]}
              imageSrc="/vibe-coders-getting-hacked-tweet.png"
              imageCaptionAlt="Vibe coders are getting hacked"
              imageCaption="Vibe coder gets hacked after deploying his app."
            />
            <PainCard
              emoji="🤮"
              title="Ugly Designs"
              color="bg-purple"
              items={[
                "Every AI-generated app looks the same.",
                "You paste a design and AI ignores half of it.",
                "You burn hours tweaking the styling and it still looks off.",
              ]}
              imageSrc="/ugly-ai-designs.png"
              imageCaptionAlt="AI designs are generic and easy to spot"
              imageCaption="Without a proper system, AI generates sloppy designs."
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── Solution ───── */}
      <section className="px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-black uppercase sm:text-5xl">
            There&apos;s a Better Way
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-lg font-medium leading-relaxed">
            Most people use one AI agent for everything. This course teaches you
            to build a team of specialized agents.
          </p>

          {/* Old Way / New Way */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-4">
            {/* Old Way */}
            <div className="neo-shadow bg-surface p-6 md:flex-1">
              <ZoomableImage
                src="/Old%20Way%20Diagram.png"
                alt="How most people use AI: one prompt, one coding agent, one app"
                className="w-full"
              />
            </div>

            {/* Arrow */}
            <div className="flex shrink-0 items-center justify-center">
              {/* Down arrow on mobile */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="md:hidden"
              >
                <path d="m12 5 0 14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
              {/* Right arrow on desktop */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hidden md:block"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>

            {/* New Way */}
            <div className="neo-shadow bg-surface p-6 md:flex-1">
              <ZoomableImage
                src="/New%20Way%20Diagram.png"
                alt="How to actually use AI: planning agent, research agent, coding agent, bug scanning agent, bug fix agent"
                className="w-full"
              />
            </div>
          </div>

          <p className="mt-8 text-sm font-bold">
            This is the exact workflow you&apos;ll build. A team of AI agents,
            working for you.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ───── Curriculum ───── */}
      <section id="curriculum" className="scroll-mt-24">
        <div className="px-6">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            What You&apos;ll Learn
          </h2>
          <p className="mx-auto mb-2 max-w-xl text-center font-medium">
            4 modules. Hands-on builds. No passive watching.
          </p>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm font-medium text-muted">
            Swipe to explore each module &rarr;
          </p>
        </div>

        {/* Horizontal scroll container */}
        <div className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory px-6 pb-6 -mx-0 scrollbar-hide">
          {/* Left spacer for centering on large screens */}
          <div className="hidden shrink-0 lg:block lg:w-[calc((100vw-64rem)/2)]" />

          {/* Module 1 */}
          <div className="neo-shadow bg-blue p-8 shrink-0 snap-center w-[85vw] max-w-md flex flex-col">
            <span className="neo-shadow-sm inline-block self-start bg-foreground text-surface px-3 py-1 text-xs font-black uppercase mb-4">
              Module 1
            </span>
            <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">
              Getting Started
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex gap-2">
                <span className="shrink-0">1.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Cursor Agent
                  </code>{" "}
                  — turn ideas into step-by-step plans
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">2.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Cursor Tab
                  </code>{" "}
                  — let AI write the code for you
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">3.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Cursor Rules
                  </code>{" "}
                  — get features right on the first try
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">4.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Plan Mode
                  </code>{" "}
                  — plan before you build so AI doesn&apos;t go off the rails
                </span>
              </li>
            </ul>
          </div>

          {/* Module 2 */}
          <div className="neo-shadow bg-green p-8 shrink-0 snap-center w-[85vw] max-w-md flex flex-col">
            <span className="neo-shadow-sm inline-block self-start bg-foreground text-surface px-3 py-1 text-xs font-black uppercase mb-4">
              Module 2
            </span>
            <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">
              Fix Bugs &amp; Stay Secure
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex gap-2">
                <span className="shrink-0">1.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Debug Mode
                  </code>{" "}
                  — fix bugs without going in circles
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">2.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    MCP
                  </code>{" "}
                  — connect AI to your browser &amp; other tools
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">3.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    BugBot
                  </code>{" "}
                  — catch security holes before hackers do
                </span>
              </li>
            </ul>
          </div>

          {/* Module 3 */}
          <div className="neo-shadow bg-pink p-8 shrink-0 snap-center w-[85vw] max-w-md flex flex-col">
            <span className="neo-shadow-sm inline-block self-start bg-foreground text-surface px-3 py-1 text-xs font-black uppercase mb-4">
              Module 3
            </span>
            <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">
              Make It Look Great
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex gap-2">
                <span className="shrink-0">1.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Visual Browser
                  </code>{" "}
                  — tweak designs by clicking, not coding
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">2.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Figma to Code
                  </code>{" "}
                  — turn any design into a real app
                </span>
              </li>
            </ul>
          </div>

          {/* Module 4 */}
          <div className="neo-shadow bg-purple p-8 shrink-0 snap-center w-[85vw] max-w-md flex flex-col">
            <span className="neo-shadow-sm inline-block self-start bg-foreground text-surface px-3 py-1 text-xs font-black uppercase mb-4">
              Module 4
            </span>
            <h3 className="mb-2 text-2xl font-black uppercase tracking-tight">
              Build 10x Faster
            </h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex gap-2">
                <span className="shrink-0">1.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Agent Review
                  </code>{" "}
                  — automatically catch problems before your users do
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">2.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Background Agents
                  </code>{" "}
                  — AI builds features while you sleep
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0">3.</span>
                <span>
                  <code className="bg-surface border-2 border-foreground px-1.5 py-0.5 text-xs font-bold">
                    Parallel Agents
                  </code>{" "}
                  — build multiple features at once
                </span>
              </li>
            </ul>
          </div>

          {/* Right spacer */}
          <div className="shrink-0 w-6 lg:w-[calc((100vw-64rem)/2)]" />
        </div>
      </section>

      <SectionDivider />

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-black uppercase sm:text-5xl">
            800 Students. Real Results.
          </h2>
          <TestimonialCarousel />
          <div className="mt-10 text-center">
            <CTAButton />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── About ───── */}
      <section id="about" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            Your Instructor
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center font-medium text-muted">
            You&apos;re learning from a verified Cursor Ambassador and SaaS
            Founder.
          </p>
          {/* ── About Image Carousel ── */}
          <ImageCarousel />

          <div className="mt-10 text-center">
            <CTAButton />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── What's Included ───── */}
      <section className="px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            Everything You Get
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center font-medium text-muted">
            Not just videos — you get templates, prompts, and direct access to
            help you ship faster.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <IncludedCard
              emoji="🎓"
              title="Lifetime Access"
              description="You get 3+ hours of video content with 2 years of updates."
              color="bg-yellow"
            />
            <IncludedCard
              emoji="🚀"
              title="Web App Template"
              description="You get a ready-to-deploy web app. This alone pays for the course."
              color="bg-blue"
            />
            <IncludedCard
              emoji="📝"
              title="Cursor Prompt Library"
              description="You get 20+ Cursor Rules for every workflow — copy, paste, and ship."
              color="bg-green"
            />
            <IncludedCard
              emoji="📞"
              title="Coaching Call"
              description="You get a 30-min call for advice on startups, marketing, anything. Typically a $200 value."
              bonus
              color="bg-pink"
            />
            <IncludedCard
              emoji="💬"
              title="Community Discord"
              description="Build and share projects with fellow AI builders."
              bonus
              color="bg-purple"
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── Tech Stack ───── */}
      <section className="px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-8 text-3xl font-black uppercase sm:text-5xl">
            Your Tech Stack
          </h2>
          <p className="mb-8 font-medium">
            Chosen so you ship fast and keep costs low.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://img-c.udemycdn.com/course/750x422/6609805_3dcb_3.jpg"
            alt="Tech stack: Cursor, OpenAI, Supabase, and NextJS"
            className="mx-auto mb-10 w-full max-w-md neo-shadow-lg"
          />
          <div className="grid gap-6 text-left sm:grid-cols-2">
            <div className="neo-shadow bg-yellow p-5">
              <p className="text-sm font-black uppercase">Cursor</p>
              <p className="mt-1 text-xs font-medium">
                AI powered code editor, 1M+ users worldwide
              </p>
            </div>
            <div className="neo-shadow bg-blue p-5">
              <p className="text-sm font-black uppercase">
                Next.js + TypeScript + Tailwind
              </p>
              <p className="mt-1 text-xs font-medium">
                <a
                  href="https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide#frontend-app-development"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2 hover:bg-accent hover:text-white"
                >
                  OpenAI recommends
                </a>{" "}
                these — AI excels at writing in these languages
              </p>
            </div>
            <div className="neo-shadow bg-green p-5">
              <p className="text-sm font-black uppercase">Max IQ AI Models</p>
              <p className="mt-1 text-xs font-medium">
                Like Claude 4.6 Opus, GPT Codex 5.3, and Gemini 3
              </p>
            </div>
            <div className="neo-shadow bg-pink p-5">
              <p className="text-sm font-black uppercase">
                Fast + Affordable AI Models
              </p>
              <p className="mt-1 text-xs font-medium">
                Like Cursor Auto Mode and Composer-1.5i
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ───── CTA ───── */}
      <section className="px-6">
        <div className="mx-auto max-w-2xl neo-shadow-lg bg-yellow p-10 text-center">
          <h2 className="mb-2 text-3xl font-black uppercase sm:text-5xl">
            Start Building Today
          </h2>
          <p className="mb-4 text-lg font-bold">
            🚀 Launch pricing — 30% off while the course is new.
          </p>
          <p className="mb-6 text-base font-medium">
            Use code <CopyCode code="SAVE30" /> at checkout.
            <br />
            Price goes up as new modules drop.
          </p>
          <div className="mb-6">
            <p className="mb-3 text-xs font-black uppercase tracking-widest">
              Offer expires in
            </p>
            <CountdownTimer />
          </div>
          <CTAButton />
          <p className="mt-8 text-sm font-bold">
            🔓 You&apos;re covered by a{" "}
            <a
              href="#guarantee"
              className="underline decoration-3 underline-offset-2 hover:bg-foreground hover:text-surface"
            >
              100% Satisfaction Guarantee
            </a>
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ───── FAQ ───── */}
      <section id="faq" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-black uppercase sm:text-5xl">
            FAQ
          </h2>
          <div className="space-y-5">
            <FAQItem question="🤖 What level of coding experience do I need?">
              <p>
                None. Most students start with zero coding experience. The
                system you&apos;ll build lets Cursor handle the code and the
                troubleshooting. At most, you&apos;ll learn basics like
                &ldquo;why do we need a database?&rdquo; — AI implements
                everything.
              </p>
            </FAQItem>

            <FAQItem id="guarantee" question="🔓 100% Satisfaction Guarantee">
              <p>
                Hundreds of students have already built their first AI app with
                this course. If you feel it wasn&apos;t worth the money, you get
                a <strong>100% Money Back Guarantee</strong>.
              </p>
              <p className="mt-2">
                Email{" "}
                <a
                  href="mailto:shawnesquivel24@gmail.com"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  shawnesquivel24@gmail.com
                </a>{" "}
                within 30 days of purchase for a full refund.
              </p>
            </FAQItem>

            <FAQItem question="❌ Who is this course NOT for?">
              <p className="mb-2">This course probably is NOT for you if:</p>
              <ul className="mb-4 list-inside list-disc space-y-1">
                <li>You want to learn how to code</li>
                <li>
                  You want to &ldquo;watch&rdquo; instead of &ldquo;apply&rdquo;
                </li>
                <li>You expect AI to do ALL the work</li>
              </ul>
              <p className="mb-2">This course IS for you if:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>
                  ✅ You&apos;re interested in launching projects, not writing
                  Python
                </li>
                <li>
                  ✅ You&apos;re excited to build things, not drown in boring
                  theory videos
                </li>
                <li>✅ You know that AI is not perfect</li>
              </ul>
            </FAQItem>

            <FAQItem question="👨‍💻 I know how to code. Should I take this course?">
              <p>
                Yes! Engineers with 30+ years of experience have taken this
                course and leveled up their Cursor workflow.
              </p>
            </FAQItem>

            <FAQItem question="📲 Will I learn how to build Mobile Apps?">
              <p>
                No. The frameworks applied can be used for any output — mobile
                apps, web apps, or data analysis. Mobile apps can be hard to set
                up, even with AI.
              </p>
            </FAQItem>

            <FAQItem question="💰 Does Cursor cost money to use?">
              <p>
                Yes. Each call to Cursor will spend a bit of your monthly usage.
                More information in their{" "}
                <a
                  href="https://cursor.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  Pricing
                </a>{" "}
                and{" "}
                <a
                  href="https://cursor.com/docs/account/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  Billing
                </a>{" "}
                docs.
              </p>
              <p className="mt-2">
                ✅ You&apos;ll learn how to reduce your monthly Cursor spending
                and avoid expensive bills.
              </p>
              <p className="mt-2">
                P.S. Eligible students can get 1 year free of Cursor Pro.{" "}
                <a
                  href="https://cursor.com/students"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  cursor.com/students
                </a>
              </p>
            </FAQItem>

            <FAQItem question="🧑‍🎓 I'm a student. How can I afford your course?">
              <p>
                Email us at{" "}
                <a
                  href="mailto:shawnesquivel24@gmail.com"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  shawnesquivel24@gmail.com
                </a>{" "}
                from your verified student email (.edu or .alumni) to get{" "}
                <strong>50% off</strong> student pricing.
              </p>
              <p className="mt-2">
                You can also find free resources on{" "}
                <a
                  href="https://www.youtube.com/@shawn.builds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  YouTube
                </a>
                . Your purchase helps fund more free Cursor content for
                everyone.
              </p>
            </FAQItem>

            <FAQItem question="👋🏽 How can I contact you?">
              <p>
                Reach out at{" "}
                <a
                  href="mailto:shawnesquivel24@gmail.com"
                  className="underline decoration-2 underline-offset-2 font-bold hover:bg-accent hover:text-white"
                >
                  shawnesquivel24@gmail.com
                </a>{" "}
                or find me on social media (links in the footer).
              </p>
            </FAQItem>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="mt-20 border-t-3 border-foreground bg-foreground py-10 text-sm text-surface">
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
          </div>
        </div>
      </footer>
    </div>
  );
}
