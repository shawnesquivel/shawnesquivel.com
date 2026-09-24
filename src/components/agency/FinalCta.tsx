import CTAButton from "@/components/agency/CTAButton";
import Reveal from "@/components/agency/Reveal";
import { Serif } from "@/components/agency/Section";

export default function FinalCta() {
  return (
    <section className="px-5 pb-24 md:pb-32">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-line-strong bg-surface px-6 py-20 text-center md:py-28">
        <div className="ag-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-2/3 -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h2 className="ag-text-gradient text-4xl font-semibold tracking-tight md:text-6xl">
            Ship developer content <Serif>this week.</Serif>
          </h2>
          <p className="text-lg text-muted">
            One flat fee. Unlimited requests. Blogs, videos, and cookbooks from a developer who actually builds with
            your tools.
          </p>
          <CTAButton className="mt-2" />
        </div>
      </Reveal>
    </section>
  );
}
