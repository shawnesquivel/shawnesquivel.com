import type { ReactNode } from "react";
import Reveal from "@/components/agency/Reveal";

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-5 py-24 md:py-32 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  const alignment = align === "center" ? "mx-auto text-center items-center" : "items-start";
  return (
    <Reveal className={`mb-14 flex max-w-3xl flex-col gap-4 ${alignment}`}>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</span>
      <h2 className="ag-text-gradient text-balance text-4xl font-semibold tracking-tight md:text-5xl">{title}</h2>
      {description && <p className="max-w-2xl text-pretty text-lg text-muted">{description}</p>}
    </Reveal>
  );
}

export function Serif({ children }: { children: ReactNode }) {
  return <span className="font-serif font-normal italic tracking-normal text-fg">{children}</span>;
}
