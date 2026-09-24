import Link from "next/link";
import Reveal from "@/components/agency/Reveal";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";
import WorkCard from "@/components/agency/WorkCard";
import { WORK } from "@/lib/agency/site";

const FEATURED = [
  "Build an AI agent with Vercel, Composio and Cursor",
  "Viral Instagram reel",
  "Composio plugins for Claude, ChatGPT, OpenClaw & Cursor",
  "Cursor hackathon: 80 people showed up to build Canada",
  "Explaining Gumloop Skills",
  "AEO technical writing for Composio",
];

export default function WorkPreview() {
  const items = FEATURED.map((t) => WORK.find((w) => w.title === t)).filter((w) => w !== undefined);
  return (
    <Section id="work" className="border-t border-line">
      <SectionHeading
        eyebrow="Selected work"
        title={
          <>
            Content that <Serif>gets developers building.</Serif>
          </>
        }
        description="Videos, launches, cookbooks, and events for the teams building the AI developer stack."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.title} delay={(i % 3) * 80}>
            <WorkCard item={item} />
          </Reveal>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link
          href="/agency/work"
          className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium ring-1 ring-line-strong transition-colors hover:bg-white/5"
        >
          View all work
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </Section>
  );
}
