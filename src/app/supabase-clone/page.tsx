import type { Metadata } from "next";
import Link from "next/link";
import {
  plans,
  computeRows,
  diskTiers,
  addons,
  comparison,
  faqs,
  type Cell,
} from "./pricing-data";

export const metadata: Metadata = {
  title: "Pricing & Fees | Supabase Clone",
  description:
    "A recreation of the Supabase pricing page. Start building for free, collaborate with a team, then scale to millions of users.",
};

const BRAND = "#3ECF8E";

function BoltMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M13.5 2 4 14h6.5L10.5 22 20 10h-6.5L13.5 2Z"
        fill={BRAND}
        stroke={BRAND}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Included">
      <circle cx="12" cy="12" r="11" fill="rgba(62,207,142,0.15)" />
      <path
        d="M7 12.5 10.5 16 17 8.5"
        stroke={BRAND}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Not included">
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="#4d4d4d"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Nav() {
  const links = ["Product", "Developers", "Enterprise", "Pricing", "Docs", "Blog"];
  return (
    <nav className="sticky top-0 z-50 border-b border-[#2e2e2e] bg-[#121212]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/supabase-clone" className="flex items-center gap-2">
            <BoltMark className="h-6 w-6" />
            <span className="text-lg font-semibold tracking-tight text-white">
              supabase
            </span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <a
                key={link}
                href="#"
                className={`rounded px-3 py-2 text-sm transition-colors hover:text-white ${
                  link === "Pricing" ? "text-white" : "text-[#b4b4b4]"
                }`}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="hidden rounded-md border border-[#3e3e3e] bg-[#1c1c1c] px-3 py-1.5 text-sm text-white transition-colors hover:border-[#5e5e5e] sm:block"
          >
            Sign in
          </a>
          <a
            href="#plans"
            className="rounded-md border border-[#34b27b] bg-[#2e9e6b] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#34b27b]"
          >
            Start your project
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12 pt-16 text-center sm:pt-24">
      <p className="mb-4 text-base font-medium" style={{ color: BRAND }}>
        Pricing
      </p>
      <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Predictable pricing,
        <br className="hidden sm:block" /> designed to scale
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg text-[#b4b4b4]">
        Start building for free, collaborate with your team, then scale to
        millions of users.
      </p>
    </section>
  );
}

function PlanCards() {
  return (
    <section id="plans" className="mx-auto max-w-7xl px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border bg-[#1c1c1c] ${
              plan.highlight ? "border-[#3ECF8E]" : "border-[#2e2e2e]"
            }`}
          >
            <div className="border-b border-[#2e2e2e] px-6 pb-6 pt-6">
              <div className="flex items-center justify-between">
                <h3
                  className="text-xl font-medium"
                  style={{ color: plan.highlight ? BRAND : "#fff" }}
                >
                  {plan.name}
                </h3>
                {plan.highlight && (
                  <span className="rounded-md bg-[#3ECF8E]/10 px-2.5 py-1 text-xs font-medium leading-4 text-[#3ECF8E]">
                    Most Popular
                  </span>
                )}
              </div>
              <p className="mt-3 min-h-[60px] text-sm text-[#b4b4b4]">
                {plan.description}
              </p>
              <div className="mt-4 flex items-end gap-2">
                <div>
                  {plan.priceLabel && (
                    <p className="text-xs uppercase tracking-wide text-[#707070]">
                      {plan.priceLabel}
                    </p>
                  )}
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-medium text-white">
                      {plan.price}
                    </span>
                    {plan.priceUnit && (
                      <span className="mb-1.5 text-sm text-[#707070]">
                        {plan.priceUnit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <a
                href="#"
                className={`mt-5 block w-full rounded-md border px-4 py-2 text-center text-sm transition-colors ${
                  plan.ctaVariant === "brand"
                    ? "border-[#34b27b] bg-[#2e9e6b] text-white hover:bg-[#34b27b]"
                    : "border-[#3e3e3e] bg-[#262626] text-white hover:border-[#5e5e5e]"
                }`}
              >
                {plan.cta}
              </a>
            </div>
            <div className="flex flex-1 flex-col px-6 py-6">
              {plan.featuresIntro && (
                <p className="mb-4 text-sm text-[#b4b4b4]">{plan.featuresIntro}</p>
              )}
              <ul className="flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-sm text-[#e0e0e0]">{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.footer && (
                <p className="mt-6 border-t border-[#2e2e2e] pt-4 text-xs leading-relaxed text-[#707070]">
                  {plan.footer}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BillingExplainer() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid grid-cols-1 gap-10 rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] p-8 lg:grid-cols-2 lg:p-12">
        <div>
          <p className="mb-3 text-sm font-medium" style={{ color: BRAND }}>
            Usage-based billing
          </p>
          <h2 className="text-2xl font-medium text-white sm:text-3xl">
            How billing works
          </h2>
          <p className="mt-4 text-[#b4b4b4]">
            Supabase uses organization-based billing. Choose a plan for your
            organization; each project inside it runs on its own compute
            instance, billed separately and hourly.
          </p>
          <p className="mt-4 text-[#b4b4b4]">
            Pro and Team plans include{" "}
            <span className="text-white">$10/month in compute credits</span>,
            enough to cover one Micro instance. Additional projects each add
            their own compute cost.
          </p>
        </div>
        <div className="rounded-lg border border-[#2e2e2e] bg-[#121212] p-6">
          <p className="mb-4 text-sm font-medium text-white">
            Example: Pro org, 2 projects on Micro compute
          </p>
          <dl className="space-y-3 text-sm">
            {[
              ["Pro Plan", "$25"],
              ["Compute — Project 1 (Micro)", "$10"],
              ["Compute — Project 2 (Micro)", "$10"],
              ["Compute credits", "-$10"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-[#2e2e2e] pb-3"
              >
                <dt className="text-[#b4b4b4]">{label}</dt>
                <dd className="font-mono text-white">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <dt className="font-medium text-white">Total per month</dt>
              <dd className="font-mono text-lg font-medium" style={{ color: BRAND }}>
                $35
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function ComputeSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-sm font-medium" style={{ color: BRAND }}>
          Compute
        </p>
        <h2 className="text-2xl font-medium text-white sm:text-3xl">
          Scalable compute add-ons
        </h2>
        <p className="mt-4 text-[#b4b4b4]">
          Every project runs on a dedicated compute instance, billed hourly. Pro
          and Team plans include $10/month in compute credits — enough for one
          Micro instance.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#2e2e2e]">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#1c1c1c] text-left text-xs uppercase tracking-wide text-[#707070]">
              {["Size", "$ / Month", "CPU", "Dedicated", "RAM", "Direct Connections", "Pooler Connections"].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {computeRows.map((row) => (
              <tr
                key={row.size}
                className="border-t border-[#2e2e2e] transition-colors hover:bg-[#1c1c1c]"
              >
                <td className="px-4 py-3 font-medium text-white">{row.size}</td>
                <td className="px-4 py-3 font-mono" style={{ color: BRAND }}>
                  {row.price}
                </td>
                <td className="px-4 py-3 text-[#b4b4b4]">{row.cpu}</td>
                <td className="px-4 py-3">
                  {row.dedicated === null ? (
                    <span className="text-[#b4b4b4]">Custom</span>
                  ) : row.dedicated ? (
                    <CheckIcon />
                  ) : (
                    <CrossIcon />
                  )}
                </td>
                <td className="px-4 py-3 text-[#b4b4b4]">{row.ram}</td>
                <td className="px-4 py-3 text-[#b4b4b4]">{row.direct}</td>
                <td className="px-4 py-3 text-[#b4b4b4]">{row.pooler}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DiskSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-sm font-medium" style={{ color: BRAND }}>
          Disk
        </p>
        <h2 className="text-2xl font-medium text-white sm:text-3xl">
          Scalable disk storage
        </h2>
        <p className="mt-4 text-[#b4b4b4]">
          Choose the disk that fits your workload — from general purpose to high
          performance for mission critical applications.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {diskTiers.map((tier) => (
          <div
            key={tier.name}
            className="rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">{tier.name}</h3>
              <span className="rounded-md bg-[#262626] px-2.5 py-1 text-xs text-[#b4b4b4]">
                Max size: {tier.maxSize}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#707070]">{tier.description}</p>
            <dl className="mt-5 space-y-3 text-sm">
              {tier.rows.map(([label, value, extra]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-t border-[#2e2e2e] pt-3"
                >
                  <dt className="text-[#707070]">{label}</dt>
                  <dd className="text-right text-[#e0e0e0]">
                    {value}
                    {extra && (
                      <span className="block text-xs text-[#707070]">{extra}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function AddonsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-sm font-medium" style={{ color: BRAND }}>
          Add-ons
        </p>
        <h2 className="text-2xl font-medium text-white sm:text-3xl">
          Fine-tune your project
        </h2>
        <p className="mt-4 text-[#b4b4b4]">
          Level up your Supabase experience with add-ons, available on paid plans.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addons.map((addon) => (
          <div
            key={addon.name}
            className="rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] p-6 transition-colors hover:border-[#3e3e3e]"
          >
            <h3 className="font-medium text-white">{addon.name}</h3>
            <p className="mt-1 text-sm text-[#707070]">{addon.description}</p>
            <p className="mt-4 text-sm" style={{ color: BRAND }}>
              {addon.price}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CellContent({ cell }: { cell: Cell }) {
  if (cell.type === "check") return <CheckIcon className="h-5 w-5" />;
  if (cell.type === "cross") return <CrossIcon className="h-5 w-5" />;
  return (
    <div>
      <span className="text-[#e0e0e0]">{cell.value}</span>
      {cell.sub && <span className="block text-xs text-[#707070]">{cell.sub}</span>}
    </div>
  );
}

function ComparisonSectionTables() {
  const planMeta = [
    { name: "Free", price: "$0", cta: "Start for Free" },
    { name: "Pro", price: "$25", cta: "Get Started" },
    { name: "Team", price: "$599", cta: "Get Started" },
    { name: "Enterprise", price: "Custom", cta: "Contact Us" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-medium text-white">Compare Plans</h2>
        <p className="mt-3 text-[#b4b4b4]">
          Start with a hobby project, collaborate with a team, and scale to
          millions of users.
        </p>
      </div>

      <div className="sticky top-16 z-40 hidden border-b border-[#2e2e2e] bg-[#121212]/95 backdrop-blur-md lg:block">
        <div className="grid grid-cols-5 py-4">
          <div />
          {planMeta.map((plan) => (
            <div key={plan.name} className="px-4">
              <p
                className="text-lg font-medium"
                style={{ color: plan.name === "Pro" ? BRAND : "#fff" }}
              >
                {plan.name}
              </p>
              <p className="mt-0.5 text-sm text-[#707070]">
                {plan.price === "Custom" ? "Custom" : `From ${plan.price} /month`}
              </p>
              <a
                href="#"
                className={`mt-2 inline-block rounded-md border px-3 py-1 text-xs transition-colors ${
                  plan.name === "Pro"
                    ? "border-[#34b27b] bg-[#2e9e6b] text-white hover:bg-[#34b27b]"
                    : "border-[#3e3e3e] bg-[#262626] text-white hover:border-[#5e5e5e]"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>

      {comparison.map((section) => (
        <div key={section.category} className="mt-12">
          <h3
            className="mb-4 flex items-center gap-2 text-lg font-medium text-white"
            id={`compare-${section.category.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <BoltMark className="h-4 w-4" />
            {section.category}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[#2e2e2e]">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead className="lg:sr-only">
                <tr className="bg-[#1c1c1c] text-left text-xs uppercase tracking-wide text-[#707070]">
                  <th className="w-1/5 px-4 py-3 font-medium">Feature</th>
                  {planMeta.map((plan) => (
                    <th key={plan.name} className="w-1/5 px-4 py-3 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-t border-[#2e2e2e] transition-colors first:border-t-0 hover:bg-[#1c1c1c]"
                  >
                    <td className="w-1/5 px-4 py-4 align-top text-[#b4b4b4]">
                      {row.feature}
                    </td>
                    {row.cells.map((cell, i) => (
                      <td key={i} className="w-1/5 px-4 py-4 align-top">
                        <CellContent cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-[#2e2e2e] bg-[#1c1c1c]/50">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-medium text-white">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-center text-[#b4b4b4]">
          Can&apos;t find the answer to your question? You can always{" "}
          <a href="#" className="underline transition-colors hover:text-white">
            contact support
          </a>
          .
        </p>
        <div className="mt-10 divide-y divide-[#2e2e2e] rounded-xl border border-[#2e2e2e] bg-[#1c1c1c]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
                {faq.q}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-[#707070] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#b4b4b4]">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFooter() {
  return (
    <section className="border-t border-[#2e2e2e]">
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h2 className="text-3xl font-medium text-white">
          Build in a weekend, scale to millions
        </h2>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="#plans"
            className="rounded-md border border-[#34b27b] bg-[#2e9e6b] px-4 py-2 text-sm text-white transition-colors hover:bg-[#34b27b]"
          >
            Start your project
          </a>
          <a
            href="#"
            className="rounded-md border border-[#3e3e3e] bg-[#262626] px-4 py-2 text-sm text-white transition-colors hover:border-[#5e5e5e]"
          >
            Request a demo
          </a>
        </div>
      </div>
      <footer className="border-t border-[#2e2e2e]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#707070] sm:flex-row">
          <div className="flex items-center gap-2">
            <BoltMark className="h-5 w-5" />
            <span className="font-medium text-[#b4b4b4]">supabase</span>
          </div>
          <p>
            Educational clone of{" "}
            <a
              href="https://supabase.com/pricing"
              className="underline transition-colors hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              supabase.com/pricing
            </a>
            . Not affiliated with Supabase.
          </p>
        </div>
      </footer>
    </section>
  );
}

export default function SupabaseClonePage() {
  return (
    <main className="min-h-screen bg-[#121212] font-sans text-white antialiased">
      <Nav />
      <Hero />
      <PlanCards />
      <BillingExplainer />
      <ComputeSection />
      <DiskSection />
      <AddonsSection />
      <ComparisonSectionTables />
      <FaqSection />
      <CtaFooter />
    </main>
  );
}
