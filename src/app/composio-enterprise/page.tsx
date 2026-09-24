import type { Metadata } from "next";
import Link from "next/link";
import {
  providers,
  applications,
  bridgeFeatures,
  whyEnterprise,
  toolScopes,
  dataHandlingCards,
  pricingTiers,
  enterpriseFeatures,
  trustedBy,
} from "./data";

export const metadata: Metadata = {
  title: "Enterprise & Pricing | Composio Clone",
  description:
    "A recreation of the Composio enterprise and pricing pages. Enterprise-grade AI agent infrastructure with security, observability, and usage-based pricing.",
};

const ORANGE = "#FF4F00";
const INK = "#181511";
const PAPER = "#F6F3EC";
const LINE = "#E2DDD0";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-4 font-mono text-xs uppercase tracking-[0.2em]"
      style={{ color: ORANGE }}
    >
      {children}
    </p>
  );
}

function LogoMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="10" fill={ORANGE} />
      <path
        d="M15.5 8.5a4.5 4.5 0 1 0 0 7"
        stroke={PAPER}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Nav() {
  const links = ["Products", "Pricing", "Docs", "Blog", "Enterprise"];
  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ borderColor: LINE, backgroundColor: "rgba(246,243,236,0.92)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/composio-enterprise" className="flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <span className="text-lg font-semibold tracking-tight">composio</span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <a
                key={link}
                href="#"
                className={`text-sm transition-colors hover:text-black ${
                  link === "Enterprise" ? "font-medium text-black" : "text-[#6b6557]"
                }`}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-black hover:text-white sm:block"
            style={{ borderColor: INK }}
          >
            Sign in
          </a>
          <a
            href="#pricing"
            className="border px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: ORANGE, borderColor: ORANGE }}
          >
            Get a Demo
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="border-b" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <Eyebrow>Enterprise</Eyebrow>
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Give Your Agents{" "}
          <span className="italic" style={{ color: ORANGE }}>
            Security.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-[#6b6557]">
          Enterprise-grade AI agent infrastructure with the security,
          observability, and control your organization demands.
        </p>
        <a
          href="#pricing"
          className="mt-8 inline-block border px-6 py-3 font-mono text-sm uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: INK, borderColor: INK }}
        >
          Get a Demo
        </a>
      </div>
      <div className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="mb-4 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#a39d8d]">
            Trusted by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {trustedBy.map((name) => (
              <span
                key={name}
                className="font-mono text-sm font-semibold tracking-widest text-[#b5af9f]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BridgeSection() {
  return (
    <section className="border-b" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-5xl">
          Bridge the gap between
          <br />
          <span className="italic" style={{ color: ORANGE }}>
            Intelligence
          </span>{" "}
          and{" "}
          <span className="italic" style={{ color: ORANGE }}>
            Execution
          </span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr_1fr]">
          <div className="border bg-white p-5" style={{ borderColor: LINE }}>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#a39d8d]">
              Any AI Provider
            </p>
            <ul className="space-y-2">
              {providers.map((provider) => (
                <li
                  key={provider}
                  className="border px-3 py-1.5 font-mono text-xs uppercase tracking-wider"
                  style={{ borderColor: LINE }}
                >
                  {provider}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-px sm:grid-cols-2" style={{ backgroundColor: LINE }}>
            {bridgeFeatures.map((feature) => (
              <div key={feature.tag} className="p-5" style={{ backgroundColor: PAPER }}>
                <p
                  className="font-mono text-[11px] uppercase tracking-[0.2em]"
                  style={{ color: ORANGE }}
                >
                  {feature.tag}
                </p>
                <h3 className="mt-2 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b6557]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="border bg-white p-5" style={{ borderColor: LINE }}>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[#a39d8d]">
              Any Application
            </p>
            <ul className="space-y-2">
              {applications.map((app) => (
                <li
                  key={app}
                  className="border px-3 py-1.5 font-mono text-xs uppercase tracking-wider"
                  style={{ borderColor: LINE }}
                >
                  {app}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyEnterprise() {
  return (
    <section className="border-b" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Eyebrow>Why Enterprise</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for enterprise from day one
        </h2>
        <div
          className="mt-12 grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3"
          style={{ backgroundColor: LINE, borderColor: LINE }}
        >
          {whyEnterprise.map((item) => (
            <div key={item.tag} className="bg-white p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#a39d8d]">
                {item.tag}
              </p>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b6557]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolScoping() {
  return (
    <section className="border-b" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Eyebrow>Access Control</Eyebrow>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Granular Tool Scoping
            </h2>
            <p className="mt-4 max-w-md text-[#6b6557]">
              Control exactly what actions each agent can take. Disable
              dangerous operations while keeping essential functionality.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6b6557]">
              Every scope restriction is logged and auditable. Security teams
              get full visibility into what&apos;s enabled, what&apos;s blocked,
              and why — laser-precise accountability at every level.
            </p>
          </div>
          <div
            className="border p-6"
            style={{ backgroundColor: INK, borderColor: INK }}
          >
            <div
              className="mb-5 inline-block border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-white"
              style={{ borderColor: ORANGE }}
            >
              AI Agent
            </div>
            <div className="space-y-4">
              {toolScopes.map((tool) => (
                <div
                  key={tool.app}
                  className="border border-[#3a352c] p-4"
                >
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#b5af9f]">
                    {tool.app}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tool.scopes.map((scope) => (
                      <span
                        key={scope.name}
                        className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                          scope.enabled
                            ? "text-black"
                            : "text-[#6b6557] line-through"
                        }`}
                        style={{
                          backgroundColor: scope.enabled ? ORANGE : "#26221b",
                        }}
                      >
                        {scope.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DataHandling() {
  return (
    <section className="border-b" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Eyebrow>Protection</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Safe Data Handling
        </h2>
        <p className="mt-4 max-w-xl text-[#6b6557]">
          Enterprise-grade certifications, governance controls, and fine-grained
          access management — your data stays protected at every layer.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {dataHandlingCards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col border bg-white p-6"
              style={{ borderColor: LINE }}
            >
              <div className="flex flex-1 flex-wrap content-start gap-2">
                {card.chips.map((chip) => (
                  <span
                    key={chip}
                    className={`border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider ${
                      card.chipStyle === "badge" ? "font-semibold" : ""
                    }`}
                    style={{
                      borderColor: card.chipStyle === "badge" ? INK : LINE,
                      color: card.chipStyle === "role" ? "#6b6557" : INK,
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <h3 className="mt-6 font-mono text-sm font-semibold uppercase tracking-wider">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-[#6b6557]">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-b" style={{ borderColor: LINE }}>
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Usage Based Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#6b6557]">
            Composio is built to help you scale. From the birth of your first
            agent to your IPO, we&apos;re there to grow with you.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className="flex flex-col border bg-white p-6"
              style={{ borderColor: tier.highlight ? ORANGE : LINE }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
                  {tier.name}
                </h3>
                {tier.highlight && (
                  <span
                    className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white"
                    style={{ backgroundColor: ORANGE }}
                  >
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-5xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                <span className="mb-1.5 font-mono text-xs uppercase tracking-wider text-[#a39d8d]">
                  {tier.unit}
                </span>
              </div>
              <ul
                className="mt-6 flex-1 space-y-3 border-t pt-5 text-sm"
                style={{ borderColor: LINE }}
              >
                <li className="flex items-center gap-2.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0"
                    style={{ backgroundColor: ORANGE }}
                  />
                  {tier.calls}
                </li>
                <li className="flex items-center gap-2.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0"
                    style={{ backgroundColor: ORANGE }}
                  />
                  {tier.support}
                </li>
                {tier.overage && (
                  <li className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wide text-[#6b6557]">
                    <span
                      className="h-1.5 w-1.5 shrink-0"
                      style={{ backgroundColor: "#b5af9f" }}
                    />
                    {tier.overage}
                  </li>
                )}
              </ul>
              <a
                href="#"
                className={`mt-6 block border px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider transition-colors ${
                  tier.highlight
                    ? "text-white hover:opacity-85"
                    : "hover:bg-black hover:text-white"
                }`}
                style={
                  tier.highlight
                    ? { backgroundColor: ORANGE, borderColor: ORANGE }
                    : { borderColor: INK }
                }
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <div
          className="mt-6 border p-8 text-white md:p-10"
          style={{ backgroundColor: INK, borderColor: INK }}
        >
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p
                className="font-mono text-xs uppercase tracking-[0.2em]"
                style={{ color: ORANGE }}
              >
                For Enterprise
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Secure, reliable and accurate LLM integrations at scale.
              </h3>
              <ul className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {enterpriseFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0"
                      style={{ backgroundColor: ORANGE }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center lg:text-right">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#b5af9f]">
                Contact for
                <br />
                custom quote
              </p>
              <a
                href="#"
                className="mt-4 inline-block border px-6 py-3 font-mono text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: ORANGE, borderColor: ORANGE }}
              >
                Book a Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaFooter() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <Eyebrow>Join the agentic revolution</Eyebrow>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[#6b6557]">
          See how Composio can power your enterprise AI agents with a
          personalized demo.
        </p>
        <a
          href="#"
          className="mt-8 inline-block border px-6 py-3 font-mono text-sm uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          style={{ backgroundColor: INK, borderColor: INK }}
        >
          Book a Demo
        </a>
      </div>
      <footer className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#a39d8d] sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoMark className="h-5 w-5" />
            <span className="font-medium text-[#6b6557]">composio</span>
          </div>
          <p>
            Educational clone of{" "}
            <a
              href="https://composio.dev/enterprise"
              className="underline transition-colors hover:text-black"
              target="_blank"
              rel="noopener noreferrer"
            >
              composio.dev/enterprise
            </a>{" "}
            and{" "}
            <a
              href="https://composio.dev/pricing"
              className="underline transition-colors hover:text-black"
              target="_blank"
              rel="noopener noreferrer"
            >
              /pricing
            </a>
            . Not affiliated with Composio.
          </p>
        </div>
      </footer>
    </section>
  );
}

export default function ComposioEnterprisePage() {
  return (
    <main
      className="min-h-screen font-sans antialiased"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      <Nav />
      <Hero />
      <BridgeSection />
      <WhyEnterprise />
      <ToolScoping />
      <DataHandling />
      <Pricing />
      <CtaFooter />
    </main>
  );
}
