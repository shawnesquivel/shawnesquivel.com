import CTAButton from "@/components/agency/CTAButton";
import Reveal from "@/components/agency/Reveal";
import { Section, SectionHeading, Serif } from "@/components/agency/Section";

type Mark = "yes" | "no" | "meh";
type Cell = { mark: Mark; text: string };

const COLUMNS = [
  { name: "AI tools alone", tag: "Slop" },
  { name: "Full-time DevRel hire", tag: "Expensive" },
  { name: "AI Native DevRel", tag: "On demand" },
] as const;

const ROWS: { feature: string; cells: [Cell, Cell, Cell] }[] = [
  {
    feature: "Cost",
    cells: [
      { mark: "meh", text: "$20–200/mo + hours of your team's time" },
      { mark: "no", text: "$150K–250K/yr + benefits & equity" },
      { mark: "yes", text: "One flat monthly fee" },
    ],
  },
  {
    feature: "Time to first deliverable",
    cells: [
      { mark: "meh", text: "Minutes, then hours of rewriting" },
      { mark: "no", text: "2–4 months to hire and ramp" },
      { mark: "yes", text: "Days" },
    ],
  },
  {
    feature: "Sounds like a real developer",
    cells: [
      { mark: "no", text: "Generic, instantly detectable" },
      { mark: "yes", text: "Yes" },
      { mark: "yes", text: "Yes, human-planned & reviewed" },
    ],
  },
  {
    feature: "Code that actually runs",
    cells: [
      { mark: "no", text: "Hallucinated APIs" },
      { mark: "yes", text: "Yes" },
      { mark: "yes", text: "Every cookbook tested on the latest SDK" },
    ],
  },
  {
    feature: "Video included (editing, thumbnails)",
    cells: [
      { mark: "no", text: "No" },
      { mark: "meh", text: "Usually needs a separate video editor" },
      { mark: "yes", text: "Included, no editor to hire" },
    ],
  },
  {
    feature: "Unlimited requests",
    cells: [
      { mark: "meh", text: "Unlimited output, you do the work" },
      { mark: "no", text: "Capped by one person's calendar" },
      { mark: "yes", text: "Unlimited queue" },
    ],
  },
  {
    feature: "Lives in the AI dev-tool ecosystem",
    cells: [
      { mark: "no", text: "Trained on last year's docs" },
      { mark: "meh", text: "Depends on who you hire" },
      { mark: "yes", text: "Ships with Cursor, Claude Code & Codex daily" },
    ],
  },
  {
    feature: "Request from your agent or Slack",
    cells: [
      { mark: "no", text: "No" },
      { mark: "no", text: "No" },
      { mark: "yes", text: "Official MCP server + private Slack channel" },
    ],
  },
  {
    feature: "Cancel anytime",
    cells: [
      { mark: "yes", text: "Yes" },
      { mark: "no", text: "Notice periods & severance" },
      { mark: "yes", text: "Yes, pause or cancel anytime" },
    ],
  },
];

function MarkIcon({ mark }: { mark: Mark }) {
  if (mark === "yes") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-black">
        <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M2.5 6.5l2 2 5-5" />
        </svg>
      </span>
    );
  }
  if (mark === "no") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-400">
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </span>
    );
  }
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-amber-400/15 text-amber-300">
      <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h6" />
      </svg>
    </span>
  );
}

export default function Comparison() {
  return (
    <Section id="compare" className="border-t border-line">
      <SectionHeading
        eyebrow="Compare"
        title={
          <>
            The quality of a hire. <Serif>The speed of AI.</Serif>
          </>
        }
        description="Pure AI gets you slop. A full-time hire gets you one person's bandwidth at a senior salary. There's a better option."
      />

      <Reveal>
        <div className="-mx-5 overflow-x-auto px-5 pb-2">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="w-[25%] pb-4 align-bottom font-normal text-subtle">&nbsp;</th>
                {COLUMNS.map((c, i) => {
                  const best = i === 2;
                  return (
                    <th
                      key={c.name}
                      className={`w-[25%] px-5 pb-4 pt-5 align-bottom font-normal ${
                        best ? "rounded-t-2xl border-x border-t border-accent/40 bg-accent/[0.06]" : ""
                      }`}
                    >
                      <span
                        className={`mb-2 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                          best ? "bg-accent text-black" : "bg-white/5 text-subtle"
                        }`}
                      >
                        {c.tag}
                      </span>
                      <p className={`text-base font-semibold ${best ? "text-fg" : "text-muted"}`}>{c.name}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, r) => {
                const last = r === ROWS.length - 1;
                return (
                  <tr key={row.feature}>
                    <th scope="row" className="border-t border-line py-4 pr-4 font-medium text-fg">
                      {row.feature}
                    </th>
                    {row.cells.map((cell, i) => {
                      const best = i === 2;
                      return (
                        <td
                          key={i}
                          className={`border-t px-5 py-4 ${
                            best ? "border-x border-x-accent/40 border-t-accent/15 bg-accent/[0.06] text-fg" : "border-line text-muted"
                          } ${best && last ? "rounded-b-2xl border-b border-b-accent/40" : ""}`}
                        >
                          <span className="flex items-start gap-2.5">
                            <MarkIcon mark={cell.mark} />
                            <span>{cell.text}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Reveal>

      <div className="mt-12 flex justify-center">
        <CTAButton />
      </div>
    </Section>
  );
}
