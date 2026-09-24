import { CTA } from "@/lib/agency/site";

export default function CTAButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={CTA.href}
      target="_blank"
      rel="noreferrer"
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgb(198_255_74/0.4),0_8px_30px_-8px_rgb(198_255_74/0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(198_255_74/0.7),0_12px_40px_-6px_rgb(198_255_74/0.75)] active:translate-y-0 ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/50 opacity-0 blur-md transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
      />
      <span className="relative">{CTA.label}</span>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="relative size-4 transition-transform duration-300 group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </a>
  );
}
