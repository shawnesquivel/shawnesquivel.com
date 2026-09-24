import type { ReactNode } from "react";
import Reveal from "@/components/agency/Reveal";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";
import { REQUEST_TYPES, type RequestType } from "@/lib/agency/request-types";

const ICONS: Record<RequestType, ReactNode> = {
  blog: <path d="M5 3h9l5 5v13H5z M14 3v5h5 M8 12h8 M8 16h6" />,
  article: <path d="M4 5h16 M4 10h16 M4 15h10 M4 20h7" />,
  shortform: <path d="M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2z M10 9l5 3-5 3z" />,
  longform: <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2z M10 9l5 3-5 3z" />,
  thread: <path d="M4 4l7 9-7 7h2l6-6 4 6h4l-7-10 6-6h-2l-5 5-3-5z" />,
  cookbook: <path d="M8 6l-6 6 6 6 M16 6l6 6-6 6 M14 4l-4 16" />,
};

export default function Services() {
  return (
    <Section id="services" className="border-t border-line">
      <SectionHeading
        eyebrow="What you can request"
        title={
          <>
            Every format developers <Serif>actually consume.</Serif>
          </>
        }
        description="No video editor, ghostwriter, or sample-app contractor to manage. It's all one queue."
      />
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(REQUEST_TYPES) as [RequestType, (typeof REQUEST_TYPES)[RequestType]][]).map(([type, spec], i) => (
          <Reveal key={type} delay={i * 60} className="bg-bg">
            <div className="group flex h-full flex-col gap-4 p-7 transition-colors hover:bg-surface">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20 transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                    {ICONS[type]}
                  </svg>
                </span>
                <code className="font-mono text-xs text-subtle">type: &quot;{type}&quot;</code>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold">{spec.label}</h3>
                <p className="text-sm text-muted">{spec.description}</p>
              </div>
              <ul className="mt-auto space-y-1.5 pt-2 text-sm text-subtle">
                {spec.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-2">
                    <span className="text-accent">✓</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
