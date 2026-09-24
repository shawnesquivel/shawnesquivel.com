import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/agency/Reveal";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";
import { IMAGES, SOCIALS } from "@/lib/agency/site";

const CREDENTIALS = [
  { k: "Cursor Ambassador", v: "Hosted Cursor meetups for 200+ devs in Vancouver and 100+ in Thailand" },
  { k: "DevRel at Composio", v: "Shipped Claude, ChatGPT, OpenClaw & Cursor plugins, plus AEO content" },
  { k: "Educator", v: "26K YouTube subs, 4K+ Udemy students, featured on freeCodeCamp" },
  { k: "Builder", v: "Founding engineer at a $79M Series A startup; solo-built an AI app to 8,000+ users" },
];

export default function About() {
  return (
    <Section id="about" className="border-t border-line">
      <div className="grid items-start gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Who's behind it"
            title={
              <>
                Hi, I&apos;m Shawn.
                <br />
                <Serif>I build, then I teach.</Serif>
              </>
            }
          />
          <Reveal className="space-y-5 text-lg leading-relaxed text-muted">
            <p>
              I&apos;m a developer first. I started in chemical engineering (I&apos;m a named co-inventor on a
              hydrogen-reactor patent), became a founding engineer, and now spend my days building with AI coding
              agents and teaching thousands of developers to do the same.
            </p>
            <p>
              At Composio I learned what great DevRel looks like: ship the integration, write the guide, record the
              video, and host the event that gets people building. AI Native DevRel packages that playbook into a
              subscription, so your team gets it on demand, without a six-figure hire.
            </p>
          </Reveal>

          <Reveal className="mt-8 flex flex-wrap gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                {s.label} ↗
              </a>
            ))}
            <Link
              href="/agency/work"
              className="rounded-full border border-accent/40 px-3 py-1 text-sm text-accent transition-colors hover:bg-accent-soft"
            >
              Full portfolio →
            </Link>
          </Reveal>
        </div>

        <div className="space-y-4">
          <Reveal className="grid grid-cols-5 gap-4">
            <div className="relative col-span-3 aspect-[4/3] overflow-hidden rounded-2xl border border-line">
              <Image
                src={IMAGES.cursorVancouver}
                alt="Shawn hosting a 200+ attendee Cursor event in Vancouver"
                fill
                sizes="(min-width: 1024px) 320px, 60vw"
                className="object-cover"
              />
            </div>
            <div className="relative col-span-2 aspect-[3/4] overflow-hidden rounded-2xl border border-line">
              <Image
                src={IMAGES.cursorThailand}
                alt="Shawn speaking at a 100-guest Cursor meetup in Thailand"
                fill
                sizes="(min-width: 1024px) 220px, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal>
            <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {CREDENTIALS.map((c) => (
                <div key={c.k} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
                  <dt className="shrink-0 font-mono text-xs uppercase tracking-wider text-accent sm:w-40 sm:pt-0.5">{c.k}</dt>
                  <dd className="text-sm text-muted">{c.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
