"use client";

import { useState } from "react";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";
import { FAQ } from "@/lib/agency/site";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" className="border-t border-line">
      <SectionHeading
        eyebrow="FAQ"
        title={
          <>
            Questions, <Serif>answered.</Serif>
          </>
        }
      />
      <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <h3>
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium transition-colors hover:text-accent"
                >
                  {item.q}
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-all duration-300 group-hover:border-accent/50 group-hover:text-accent ${
                      isOpen ? "rotate-45 border-accent/50 text-accent" : ""
                    }`}
                  >
                    <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 1.5v9M1.5 6h9" />
                    </svg>
                  </span>
                </button>
              </h3>
              <div
                id={`faq-a-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pb-6 pr-12 leading-relaxed text-muted">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
