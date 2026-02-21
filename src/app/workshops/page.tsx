import type { Metadata } from "next";
import type { ReactNode } from "react";

import WorkshopInquiryForm from "@/components/WorkshopInquiryForm";

const GOOGLE_FORM_URL =
  process.env.NEXT_PUBLIC_WORKSHOP_GOOGLE_FORM_URL ?? "https://forms.gle/";

export const metadata: Metadata = {
  title: "Cursor Workshops Vancouver | Build with Cursor",
  description:
    "Hands-on in-person Cursor workshops in Vancouver. Go from no experience to building and deploying your first app.",
};

const FEATURE_COVERAGE_ITEMS = [
  "Agent & Plan Mode",
  "Cursor Tab & Rules",
  "Debug workflows",
  "MCP + tool usage",
  "Prompt patterns",
  "Deployment checklist",
];

function SectionDivider() {
  return (
    <div className="mx-auto my-16 h-1 w-full max-w-5xl bg-foreground md:my-20" />
  );
}

function ScrollToFormButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href="#enroll-form"
      className={`inline-block rounded-full border-3 border-foreground bg-accent px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
    >
      {children}
    </a>
  );
}

function FAQItem({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  return (
    <details className="group neo-shadow bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 text-base font-black uppercase tracking-tight">
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

function IncludedCard({
  emoji,
  title,
  description,
  color,
}: {
  emoji: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className={`neo-shadow neo-hover p-6 ${color}`}>
      <p className="mb-2 text-3xl">{emoji}</p>
      <h4 className="mb-2 text-lg font-black uppercase">{title}</h4>
      <p className="text-sm leading-relaxed font-medium">{description}</p>
    </div>
  );
}

export default function WorkshopsPage() {
  return (
    <div className="flex min-h-screen flex-col">
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
              href="#enroll-form"
              className="neo-btn rounded-full bg-accent px-4 py-2 text-xs text-white"
            >
              Enroll Now
            </a>
          </div>
        </div>
      </nav>

      <section className="flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="neo-shadow-sm mb-8 inline-block bg-pink px-4 py-2 text-sm font-black uppercase tracking-widest">
            Build Apps With Cursor · In-Person Vancouver
          </p>
          <h1 className="text-4xl font-black leading-tight uppercase tracking-tight sm:text-5xl md:text-7xl">
            Go From No Experience
            <br />
            to Using Cursor
            <br />
            <span className="inline-block bg-accent px-3 text-white">
              in One Weekend.
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed font-medium">
            A hands-on coding workshop for professionals and engineers who want
            to build and deploy real apps. You&apos;ll work live with instructors
            from 9am to 3pm and leave with a production workflow.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-black uppercase">
            <span className="neo-shadow-sm bg-green px-3 py-2">
              Cursor hands-on workshop
            </span>
            <span className="neo-shadow-sm bg-blue px-3 py-2">
              Build your first app live
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <ScrollToFormButton>Enroll Now</ScrollToFormButton>
            <a
              href="#curriculum"
              className="inline-block rounded-full border-3 border-foreground bg-surface px-8 py-4 text-sm font-black uppercase tracking-wide text-foreground shadow-[4px_4px_0_0_#1a1a1a] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#1a1a1a] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              See the Curriculum
            </a>
          </div>

          <p className="mx-auto mt-5 max-w-xl text-sm font-bold text-muted">
            Submit your details below to reserve your workshop spot.
          </p>
        </div>
      </section>

      <SectionDivider />

      <section id="problems" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            Sound Familiar?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center font-medium text-muted">
            Most attendees come in with motivation, but no reliable path to
            ship.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="neo-shadow bg-pink p-6">
              <h3 className="mb-3 text-xl font-black uppercase">
                😵 Too Many Tools
              </h3>
              <ul className="space-y-2 text-sm font-medium">
                <li>You hear Cursor, Codex, Claude Code and get stuck.</li>
                <li>You don&apos;t know what to use first or why.</li>
                <li>You need one workflow that actually works.</li>
              </ul>
            </div>

            <div className="neo-shadow bg-orange p-6">
              <h3 className="mb-3 text-xl font-black uppercase">
                🧱 Stuck Before Shipping
              </h3>
              <ul className="space-y-2 text-sm font-medium">
                <li>You can generate code, but can&apos;t finish features.</li>
                <li>Deploying still feels confusing and risky.</li>
                <li>You want guided reps, not another passive video.</li>
              </ul>
            </div>

            <div className="neo-shadow bg-purple p-6">
              <h3 className="mb-3 text-xl font-black uppercase">
                🧭 Need Real Feedback
              </h3>
              <ul className="space-y-2 text-sm font-medium">
                <li>You want in-person help when things break.</li>
                <li>You want prompt-engineering best practices, not hacks.</li>
                <li>You want to leave with a repeatable system.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section id="curriculum" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            Workshop Structure (9am - 3pm)
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-center font-medium text-muted">
            One focused day. Hands-on coding from start to finish. Tracks define
            your primary tool for the day, not breakout groups.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="neo-shadow bg-blue p-6">
              <p className="mb-2 text-xs font-black uppercase">
                9:00am - 12:00pm
              </p>
              <h3 className="mb-2 text-xl font-black uppercase">
                Crash Course + First Build
              </h3>
              <ul className="space-y-2 text-sm font-medium leading-relaxed">
                <li>
                  Cursor fundamentals, prompt engineering, and Plan Mode
                  workflows.
                </li>
                <li>
                  Guided workshop sprint to build your first app end-to-end.
                </li>
                <li>Ship a working feature before lunch.</li>
              </ul>
            </div>

            <div className="neo-shadow bg-yellow p-6">
              <p className="mb-2 text-xs font-black uppercase">
                12:00pm - 3:00pm
              </p>
              <h3 className="mb-2 text-xl font-black uppercase">
                Advanced Workflows + Deploy
              </h3>
              <ul className="space-y-2 text-sm font-medium leading-relaxed">
                <li>
                  Parallel agents, AI code review, and Debug Mode in live reps.
                </li>
                <li>
                  Apply your selected tool track (Cursor, Claude Code, or Codex)
                  to the same build workflow.
                </li>
                <li>Deploy and leave with a repeatable production workflow.</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 neo-shadow bg-surface p-6">
            <h3 className="mb-4 text-xl font-black uppercase">
              Cursor Feature Coverage
            </h3>
            <div className="space-y-3 overflow-hidden">
              <div className="flex w-max gap-3 animate-marquee text-xs font-black uppercase">
                {[...FEATURE_COVERAGE_ITEMS, ...FEATURE_COVERAGE_ITEMS].map(
                  (item, index) => (
                    <span
                      key={`left-${item}-${index}`}
                      className="neo-shadow-sm bg-blue px-3 py-2"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
              <div
                className="flex w-max gap-3 animate-marquee text-xs font-black uppercase"
                style={{ animationDirection: "reverse", animationDuration: "18s" }}
              >
                {[...FEATURE_COVERAGE_ITEMS, ...FEATURE_COVERAGE_ITEMS].map(
                  (item, index) => (
                    <span
                      key={`right-${item}-${index}`}
                      className="neo-shadow-sm bg-yellow px-3 py-2"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <ScrollToFormButton>Reserve My Spot</ScrollToFormButton>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            What It Includes
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center font-medium text-muted">
            Built for in-person attendees who want practical outcomes in one
            day.
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <IncludedCard
              emoji="📍"
              title="Vancouver In-Person Session"
              description="Learn onsite with live help and direct feedback throughout the day."
              color="bg-yellow"
            />
            <IncludedCard
              emoji="🛠️"
              title="Hands-On Coding Workshop"
              description="You build while learning. No passive watching for hours."
              color="bg-blue"
            />
            <IncludedCard
              emoji="🚀"
              title="First App Build + Deploy"
              description="Go from blank project to deployed app with a repeatable process."
              color="bg-green"
            />
            <IncludedCard
              emoji="🧠"
              title="Prompt Engineering Playbook"
              description="Use tested prompt structures that improve output quality and speed."
              color="bg-pink"
            />
            <IncludedCard
              emoji="🧩"
              title="Three Tool Tracks"
              description="Choose a focus track: Cursor, Claude Code, or Codex."
              color="bg-purple"
            />
            <IncludedCard
              emoji="📄"
              title="Templates + Post-Workshop Resources"
              description="Keep your templates, prompt patterns, and checklists after the workshop."
              color="bg-orange"
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      <section id="testimonials" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-black uppercase sm:text-5xl">
            In-Person Attendee Feedback
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="neo-shadow bg-surface p-6">
              <p className="text-sm font-medium leading-relaxed">
                &ldquo;I&apos;m a PM and finally understand how to go from product
                idea to deployed internal tool using Cursor.&rdquo;
              </p>
              <p className="mt-4 text-xs font-black uppercase">
                — Product Manager, Ekona Power
              </p>
            </div>
            <div className="neo-shadow bg-surface p-6">
              <p className="text-sm font-medium leading-relaxed">
                &ldquo;The Claude Code track helped me clean up my workflow and
                ship faster with fewer broken prompts.&rdquo;
              </p>
              <p className="mt-4 text-xs font-black uppercase">
                — Technical Lead, Shopify
              </p>
            </div>
            <div className="neo-shadow bg-surface p-6">
              <p className="text-sm font-medium leading-relaxed">
                &ldquo;As an SWE, the Codex track gave me practical patterns I
                could apply at work the next day.&rdquo;
              </p>
              <p className="mt-4 text-xs font-black uppercase">
                — Startup Founder
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <ScrollToFormButton>Join the Next Workshop</ScrollToFormButton>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section id="about" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-black uppercase sm:text-5xl">
            Who This Is For
          </h2>
          <p className="mx-auto mb-12 max-w-3xl text-center font-medium text-muted">
            Targeted at professionals who want to learn how to build and deploy
            apps to upskill in their role, plus engineers who want stronger AI
            coding workflows.
          </p>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="neo-shadow bg-surface p-6">
              <h3 className="mb-4 text-xl font-black uppercase">
                Great Fit For
              </h3>
              <ul className="space-y-2 text-sm font-medium">
                <li>• Product managers building internal tools</li>
                <li>• Technical leads upskilling their teams</li>
                <li>• Designers moving from concept to prototype</li>
                <li>• SWE teams adopting Cursor, Claude Code, or Codex</li>
              </ul>
            </div>

            <div className="neo-shadow bg-surface p-6">
              <h3 className="mb-4 text-xl font-black uppercase">
                Track Options
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="neo-shadow-sm bg-blue p-4">
                  <p className="text-xs font-black uppercase">Cursor Track</p>
                  <p className="mt-2 text-xs font-medium">
                    Best for going from no experience to working apps.
                  </p>
                </div>
                <div className="neo-shadow-sm bg-green p-4">
                  <p className="text-xs font-black uppercase">
                    Claude Code Track
                  </p>
                  <p className="mt-2 text-xs font-medium">
                    Best for structured iteration and model-driven workflows.
                  </p>
                </div>
                <div className="neo-shadow-sm bg-pink p-4">
                  <p className="text-xs font-black uppercase">Codex Track</p>
                  <p className="mt-2 text-xs font-medium">
                    Best for engineers optimizing speed and code quality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <ScrollToFormButton>Get Workshop Details</ScrollToFormButton>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section id="faq" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-black uppercase sm:text-5xl">
            FAQ
          </h2>
          <div className="space-y-5">
            <FAQItem question="📍 Is this workshop online or in-person?">
              <p>
                This page is for the in-person workshop in Vancouver, Canada.
                You&apos;ll learn live in a classroom format from 9am to 3pm.
              </p>
            </FAQItem>

            <FAQItem question="🧑‍💻 Do I need coding experience to attend?">
              <p>
                No. We have a Cursor track designed for beginners and
                non-engineers. You&apos;ll still build and deploy an app during
                the workshop.
              </p>
            </FAQItem>

            <FAQItem question="🧭 Which track should I choose: Cursor, Claude Code, or Codex?">
              <p>
                Choose based on your goal: Cursor for beginner-friendly app
                building, Claude Code for structured workflows, and Codex for
                deeper engineering speed.
              </p>
            </FAQItem>

            <FAQItem question="🕘 What is the day structure?">
              <p>
                9am-3pm with setup, guided app build, prompt-engineering best
                practices, and track-specific implementation plus deployment.
              </p>
            </FAQItem>

            <FAQItem question="🎒 What should I bring?">
              <p>
                Bring a laptop, charger, and a project idea. We&apos;ll provide
                workshop materials and templates.
              </p>
            </FAQItem>

            <FAQItem question="💼 Who is this workshop best for?">
              <p>
                Professionals and teams who want to build and deploy apps to
                upskill: PMs, technical leads, designers, and software
                engineers.
              </p>
            </FAQItem>

            <FAQItem question="👋 How do I get workshop dates and seat availability?">
              <p>
                Use the enrollment form below and we&apos;ll follow up with
                available dates.
              </p>
            </FAQItem>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section id="enroll-form" className="scroll-mt-24 px-6">
        <div className="mx-auto max-w-3xl neo-shadow-lg bg-yellow p-10">
          <h2 className="mb-3 text-center text-3xl font-black uppercase sm:text-5xl">
            Enroll Now
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center font-medium">
            Submit your interest below and we&apos;ll follow up with details.
          </p>
          <WorkshopInquiryForm googleFormUrl={GOOGLE_FORM_URL} />
        </div>
      </section>

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
          <a
            href="#enroll-form"
            className="neo-btn rounded-full bg-yellow px-5 py-2 text-xs text-foreground"
          >
            Enroll Now
          </a>
        </div>
      </footer>
    </div>
  );
}
