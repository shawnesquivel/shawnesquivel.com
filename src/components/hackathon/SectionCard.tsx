import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
};

export default function SectionCard({
  title,
  subtitle,
  className = "",
  children,
}: SectionCardProps) {
  return (
    <section className={`neo-shadow bg-surface p-6 ${className}`}>
      <h2 className="text-xl font-black uppercase sm:text-2xl">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm font-medium text-muted">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
