"use client";

import { useMemo, useState } from "react";

export type LevelInfo = { level: number; key: string; label: string; desc: string };

export type ModelSummary = {
  id: string;
  provider: string;
  label: string;
  era: string;
  tier: string;
  perLevel: Array<{
    level: number;
    n: number;
    accuracy: number;
    meanLatencyMs: number;
    meanOutputTokens: number;
    meanReasoningTokens: number;
    parseFails: number;
  }>;
  cleanAccuracy: number;
  corruptedAccuracy: number;
  cleanCI?: { lo: number; hi: number };
  corruptedCI?: { lo: number; hi: number };
  medianTokensClean?: number;
  medianTokensCorrupted?: number;
  gibberishIndex: number;
  latencyTax: number;
  tokenTax: number;
  totalRuns: number;
};

export type GibberishSummary = {
  generatedAt: string;
  totalRecords: number;
  errorCount: number;
  taskCount?: number;
  levels: LevelInfo[];
  models: ModelSummary[];
  tasks: Array<{ taskId: string; category: string; accuracy: number; byLevel: number[] }>;
  failures: Array<{
    model: string;
    taskId: string;
    level: number;
    parsed: string | null;
    parseFail: boolean;
    expected?: string;
  }>;
};

export type DatasetItem = {
  id: string;
  taskId: string;
  category: string;
  level: number;
  levelLabel: string;
  prompt: string;
  answer: string;
};

// --- brand tokens (Agents at Work cover: dark green, neon lime, pixel blue) ----

const INK = {
  bg: "#0a1306",
  panel: "#0f1c0a",
  panelBorder: "#23391a",
  grid: "#1b2c12",
  gridFaint: "#15240e",
  neon: "#a3ff12",
  blue: "#4d6fff",
  text: "#c2d6ae",
  muted: "#7d9468",
  faint: "#5a7048",
  white: "#f2fbe8",
};

const MODEL_COLORS: Record<string, string> = {
  "gpt-5.5": "#34d399",
  "gpt-5.4-mini": "#6ee7b7",
  "gpt-5.4-nano": "#a7f3d0",
  "gpt-4o-mini": "#2dd4bf",
  "gpt-3.5-turbo": "#eab308",
  "claude-fable-5": "#fb923c",
  "claude-haiku-4-5-20251001": "#fdba74",
  "gemini-flash-lite-latest": "#60a5fa",
};

function color(id: string) {
  return MODEL_COLORS[id] ?? "#8aa37a";
}

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

const pixelFont = { fontFamily: "var(--font-pixel)" } as const;
const cursiveFont = { fontFamily: "var(--font-cursive)" } as const;

// halftone dot texture, like the cover's pixel grid
const dotTexture = {
  backgroundImage: `radial-gradient(${INK.grid} 1px, transparent 1px)`,
  backgroundSize: "14px 14px",
} as const;

// --- article building blocks ----------------------------------------------------

function Section({ kicker, title, children }: { kicker?: string; title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[720px] px-6">
      {kicker ? (
        <div className="text-[10px] tracking-widest" style={{ ...pixelFont, color: INK.neon }}>
          {kicker}
        </div>
      ) : null}
      {title ? (
        <h2 className="mt-3 text-4xl" style={{ ...cursiveFont, color: INK.white }}>
          {title}
        </h2>
      ) : null}
      <div className={`${title ? "mt-5" : ""} space-y-4 text-[15px] leading-relaxed`} style={{ color: INK.text }}>
        {children}
      </div>
    </section>
  );
}

function Figure({ n, caption, children }: { n: number; caption: string; children: React.ReactNode }) {
  return (
    <figure className="mx-auto w-full max-w-[920px] px-6">
      <div
        className="rounded-xl p-6"
        style={{ background: INK.panel, border: `1px solid ${INK.panelBorder}` }}
      >
        {children}
      </div>
      <figcaption className="mx-auto mt-4 flex max-w-[720px] gap-3 text-[13px] leading-relaxed" style={{ color: INK.muted }}>
        <span className="shrink-0 text-[9px] leading-[1.8]" style={{ ...pixelFont, color: INK.neon }}>
          FIG {n}
        </span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

// --- slop efficiency frontier (accuracy vs tokens, x reversed) -------------------

function FrontierChart({ summary }: { summary: GibberishSummary }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const models = summary.models.filter((m) => (m.medianTokensCorrupted ?? 0) > 0);

  const width = 860;
  const height = 360;
  const plot = { left: 56, right: 24, top: 28, bottom: 52 };
  const pw = width - plot.left - plot.right;
  const ph = height - plot.top - plot.bottom;

  const tokens = models.map((m) => m.medianTokensCorrupted ?? 0);
  const xMax = Math.ceil((Math.max(...tokens) * 1.15) / 20) * 20;
  const xMin = Math.max(0, Math.floor((Math.min(...tokens) * 0.7) / 20) * 20);
  const yMin = 0.55;

  const x = (t: number) => plot.left + ((xMax - t) / (xMax - xMin)) * pw;
  const y = (acc: number) => plot.top + ((1 - acc) / (1 - yMin)) * ph;

  const xTicks: number[] = [];
  for (let t = xMin; t <= xMax; t += 40) xTicks.push(t);
  const yTicks = [0.6, 0.7, 0.8, 0.9, 1.0];

  const sorted = [...models].sort((a, b) => (a.medianTokensCorrupted ?? 0) - (b.medianTokensCorrupted ?? 0));
  const labelPlacement = new Map<string, { dy: number; dx: number; anchor: "middle" | "end" | "start" }>();
  const placements: Array<{ dy: number; dx: number; anchor: "middle" | "end" | "start" }> = [
    { dy: -12, dx: 0, anchor: "middle" },
    { dy: 21, dx: 0, anchor: "middle" },
    { dy: -12, dx: -12, anchor: "end" },
    { dy: 21, dx: -12, anchor: "end" },
  ];
  let clusterIdx = 0;
  sorted.forEach((m, i) => {
    const prev = sorted[i - 1];
    const closeToPrev =
      prev &&
      Math.abs(x(m.medianTokensCorrupted ?? 0) - x(prev.medianTokensCorrupted ?? 0)) < 90 &&
      Math.abs(y(m.corruptedAccuracy) - y(prev.corruptedAccuracy)) < 26;
    clusterIdx = closeToPrev ? clusterIdx + 1 : 0;
    labelPlacement.set(m.id, placements[clusterIdx % placements.length]);
  });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={plot.left} x2={plot.left + pw} y1={y(tick)} y2={y(tick)} stroke={INK.grid} />
            <text x={plot.left - 10} y={y(tick) + 4} textAnchor="end" fill={INK.muted} fontSize="11">
              {pct(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={tick}>
            <line x1={x(tick)} x2={x(tick)} y1={plot.top} y2={plot.top + ph} stroke={INK.gridFaint} />
            <text x={x(tick)} y={height - 30} textAnchor="middle" fill={INK.muted} fontSize="11">
              {tick}
            </text>
          </g>
        ))}

        <text x={plot.left} y={height - 8} fill={INK.faint} fontSize="9" style={pixelFont}>
          ← MORE TOKENS
        </text>
        <text x={plot.left + pw} y={height - 8} textAnchor="end" fill={INK.faint} fontSize="9" style={pixelFont}>
          FEWER TOKENS →
        </text>
        {models.map((m) => {
          const px = x(m.medianTokensCorrupted ?? 0);
          const py = y(m.corruptedAccuracy);
          const ci = m.corruptedCI;
          const place = labelPlacement.get(m.id) ?? { dy: -12, dx: 0, anchor: "middle" as const };
          const dim = hovered !== null && hovered !== m.id;
          return (
            <g
              key={m.id}
              opacity={dim ? 0.2 : 1}
              style={{ transition: "opacity 150ms" }}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {ci && (
                <line
                  x1={px}
                  x2={px}
                  y1={y(Math.min(ci.hi, 1))}
                  y2={y(Math.max(ci.lo, yMin))}
                  stroke={color(m.id)}
                  strokeWidth="1.6"
                  opacity="0.45"
                />
              )}
              <circle cx={px} cy={py} r="5" fill={color(m.id)} />
              <circle cx={px} cy={py} r="14" fill="transparent" className="cursor-pointer" />
              <text
                x={px + place.dx}
                y={py + place.dy}
                textAnchor={place.anchor}
                fontSize="11.5"
                fontWeight={600}
                fill={color(m.id)}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute right-2 top-2 rounded-md px-3 py-2 text-xs shadow-lg"
          style={{ background: INK.bg, border: `1px solid ${INK.panelBorder}` }}
        >
          {(() => {
            const m = models.find((mm) => mm.id === hovered)!;
            return (
              <>
                <div className="font-medium" style={{ color: INK.white }}>
                  {m.label}
                </div>
                <div className="mt-1 tabular-nums" style={{ color: INK.text }}>
                  {pct(m.corruptedAccuracy)} on gibberish · {m.medianTokensCorrupted} median tokens
                </div>
                <div className="tabular-nums" style={{ color: INK.muted }}>
                  95% CI {pct(m.corruptedCI?.lo ?? 0)}–{pct(m.corruptedCI?.hi ?? 0)} · clean: {pct(m.cleanAccuracy)} at{" "}
                  {m.medianTokensClean} tok
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// --- accuracy-vs-corruption chart --------------------------------------------------

function DegradationChart({ summary }: { summary: GibberishSummary }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [focusModel, setFocusModel] = useState<string | null>(null);

  const width = 860;
  const height = 320;
  const plot = { left: 48, right: 16, top: 16, bottom: 44 };
  const pw = width - plot.left - plot.right;
  const ph = height - plot.top - plot.bottom;
  const levels = summary.levels;

  const yMin = 0.4;
  const x = (level: number) => plot.left + (level / (levels.length - 1)) * pw;
  const y = (acc: number) => plot.top + ((1 - Math.max(acc, yMin)) / (1 - yMin)) * ph;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {[0.4, 0.55, 0.7, 0.85, 1].map((tick) => (
          <g key={tick}>
            <line x1={plot.left} x2={plot.left + pw} y1={y(tick)} y2={y(tick)} stroke={INK.grid} />
            <text x={plot.left - 10} y={y(tick) + 4} textAnchor="end" fill={INK.muted} fontSize="11">
              {pct(tick)}
            </text>
          </g>
        ))}
        {levels.map((lv) => (
          <g key={lv.level}>
            <text x={x(lv.level)} y={height - 26} textAnchor="middle" fill={INK.neon} fontSize="9" style={pixelFont}>
              L{lv.level}
            </text>
            <text x={x(lv.level)} y={height - 9} textAnchor="middle" fill={INK.muted} fontSize="10">
              {lv.label}
            </text>
            <rect
              x={x(lv.level) - pw / (levels.length - 1) / 2}
              y={plot.top}
              width={pw / (levels.length - 1)}
              height={ph}
              fill="transparent"
              onMouseEnter={() => setHovered(lv.level)}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        ))}
        {hovered !== null && (
          <line x1={x(hovered)} x2={x(hovered)} y1={plot.top} y2={plot.top + ph} stroke={INK.faint} strokeDasharray="3 3" />
        )}
        {summary.models.map((m) => {
          const dimmed = focusModel !== null && focusModel !== m.id;
          const pts = m.perLevel.map((p) => `${x(p.level).toFixed(1)},${y(p.accuracy).toFixed(1)}`).join(" ");
          return (
            <g key={m.id} opacity={dimmed ? 0.12 : 1} style={{ transition: "opacity 150ms" }}>
              <polyline
                points={pts}
                fill="none"
                stroke={color(m.id)}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {m.perLevel.map((p) => (
                <circle key={p.level} cx={x(p.level)} cy={y(p.accuracy)} r="3.4" fill={color(m.id)} />
              ))}
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-56 rounded-md p-3 text-xs shadow-lg"
          style={{
            left: `${Math.min((x(hovered) / width) * 100, 70)}%`,
            background: INK.bg,
            border: `1px solid ${INK.panelBorder}`,
          }}
        >
          <div className="font-medium" style={{ color: INK.white }}>
            L{hovered} · {levels[hovered]?.label}
          </div>
          <div className="mt-2 space-y-1">
            {[...summary.models]
              .sort((a, b) => (b.perLevel[hovered]?.accuracy ?? 0) - (a.perLevel[hovered]?.accuracy ?? 0))
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 truncate" style={{ color: INK.text }}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color(m.id) }} />
                    {m.label}
                  </span>
                  <span className="tabular-nums font-medium" style={{ color: INK.white }}>
                    {pct(m.perLevel[hovered]?.accuracy ?? 0)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {summary.models.map((m) => (
          <button
            key={m.id}
            type="button"
            onMouseEnter={() => setFocusModel(m.id)}
            onMouseLeave={() => setFocusModel(null)}
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{ color: INK.muted }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color(m.id) }} />
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- leaderboard --------------------------------------------------------------------

function Leaderboard({ summary }: { summary: GibberishSummary }) {
  return (
    <div className="space-y-3">
      {summary.models.map((m, i) => (
        <div key={m.id} className="flex items-center gap-3">
          <div className="w-6 shrink-0 text-right text-[9px] tabular-nums" style={{ ...pixelFont, color: INK.faint }}>
            {i + 1}
          </div>
          <div className="w-36 shrink-0 truncate text-[13px] font-medium sm:w-40" style={{ color: INK.white }}>
            {m.label}
          </div>
          <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-sm" style={{ background: INK.gridFaint }}>
            <div
              className="flex h-full items-center justify-end rounded-sm pr-1.5"
              style={{ width: `${Math.max(m.gibberishIndex, 6)}%`, background: color(m.id) }}
            >
              <span className="text-[10px] font-bold tabular-nums" style={{ color: INK.bg }}>
                {m.gibberishIndex}
              </span>
            </div>
          </div>
          <div className="hidden w-44 shrink-0 text-right text-[11px] tabular-nums sm:block" style={{ color: INK.muted }}>
            clean {pct(m.cleanAccuracy)} · gibberish {pct(m.corruptedAccuracy)}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- gibberish tax ---------------------------------------------------------------------

function TaxChart({ summary }: { summary: GibberishSummary }) {
  const models = [...summary.models].sort((a, b) => b.tokenTax - a.tokenTax);
  const maxTax = Math.max(...models.map((m) => m.tokenTax), 1.5);
  return (
    <div className="space-y-3">
      {models.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <div className="w-36 shrink-0 truncate text-[13px] font-medium sm:w-40" style={{ color: INK.white }}>
            {m.label}
          </div>
          <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-sm" style={{ background: INK.gridFaint }}>
            <div
              className="h-full rounded-sm"
              style={{
                width: `${(m.tokenTax / maxTax) * 100}%`,
                background: m.tokenTax > 1.15 ? INK.neon : INK.faint,
              }}
            />
          </div>
          <div className="w-24 shrink-0 text-right text-[12px] tabular-nums" style={{ color: INK.text }}>
            {m.tokenTax}x tokens
          </div>
          <div className="hidden w-20 shrink-0 text-right text-[12px] tabular-nums sm:block" style={{ color: INK.muted }}>
            {m.latencyTax}x time
          </div>
        </div>
      ))}
    </div>
  );
}

// --- corruption level showcase ------------------------------------------------------

function LevelShowcase({ summary, items }: { summary: GibberishSummary; items: DatasetItem[] }) {
  const taskIds = useMemo(() => [...new Set(items.map((i) => i.taskId))], [items]);
  const [taskId, setTaskId] = useState("eggs-change");
  const rows = items.filter((i) => i.taskId === taskId).sort((a, b) => a.level - b.level);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {taskIds.map((t) => {
          const active = taskId === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTaskId(t)}
              className="rounded-sm px-2.5 py-1 text-[11px] font-medium transition"
              style={
                active
                  ? { background: INK.neon, color: INK.bg }
                  : { background: INK.gridFaint, color: INK.muted }
              }
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => {
          const lv = summary.levels[row.level];
          const accAtLevel =
            summary.models.length > 0
              ? summary.models.reduce((acc, m) => acc + (m.perLevel[row.level]?.accuracy ?? 0), 0) /
                summary.models.length
              : 0;
          return (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-start sm:gap-5"
              style={{ background: INK.bg, border: `1px solid ${INK.panelBorder}` }}
            >
              <div className="w-full shrink-0 sm:w-48">
                <div className="text-[9px]" style={{ ...pixelFont, color: INK.neon }}>
                  L{row.level}
                </div>
                <div className="mt-1.5 text-[13px] font-semibold" style={{ color: INK.white }}>
                  {lv?.label}
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: INK.faint }}>
                  {lv?.desc}
                </div>
                <div className="mt-1.5 text-[11px] tabular-nums" style={{ color: INK.muted }}>
                  all-model avg {pct(accAtLevel)}
                </div>
              </div>
              <pre
                className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed"
                style={{ color: INK.text }}
              >
                {row.prompt}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- failures table ------------------------------------------------------------------

function Failures({ summary }: { summary: GibberishSummary }) {
  const [showAll, setShowAll] = useState(false);
  const failures = [...summary.failures].sort((a, b) => a.level - b.level || a.model.localeCompare(b.model));
  const shown = showAll ? failures : failures.slice(0, 12);
  const labelFor = (id: string) => summary.models.find((m) => m.id === id)?.label ?? id;

  if (failures.length === 0) {
    return (
      <div className="text-sm" style={{ color: INK.muted }}>
        No failures recorded. Every model got everything right.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${INK.panelBorder}` }}>
            {["Model", "Task", "Level", "Model said", "Expected"].map((h) => (
              <th key={h} className="py-2 pr-4 text-[9px] font-normal" style={{ ...pixelFont, color: INK.faint }}>
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((f, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${INK.gridFaint}` }}>
              <td className="py-2.5 pr-4">
                <span className="inline-flex items-center gap-1.5" style={{ color: INK.text }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: color(f.model) }} />
                  {labelFor(f.model)}
                </span>
              </td>
              <td className="py-2.5 pr-4" style={{ color: INK.muted }}>
                {f.taskId}
              </td>
              <td className="py-2.5 pr-4 tabular-nums" style={{ color: INK.muted }}>
                L{f.level}
              </td>
              <td className="py-2.5 pr-4 font-mono text-[12px]" style={{ color: "#ff6b6b" }}>
                {f.parseFail ? "(no ANSWER line)" : (f.parsed ?? "—")}
              </td>
              <td className="py-2.5 font-mono text-[12px]" style={{ color: INK.neon }}>
                {f.expected}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {failures.length > 12 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-[10px] transition-colors hover:opacity-80"
          style={{ ...pixelFont, color: INK.neon }}
        >
          {showAll ? "SHOW FEWER" : `SHOW ALL ${failures.length} FAILURES`}
        </button>
      )}
    </div>
  );
}

// --- page ------------------------------------------------------------------------------

export function BoomerEvalsClient({
  summary,
  datasetItems,
}: {
  summary: GibberishSummary;
  datasetItems: DatasetItem[];
}) {
  const taskCount = summary.taskCount ?? 18;
  const runCount = summary.totalRecords - summary.errorCount;
  const frontier = summary.models.filter((m) => m.tier === "frontier");
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const frontierGI = Math.round(avg(frontier.map((m) => m.gibberishIndex)));
  const maxTokenTax = Math.max(...summary.models.map((m) => m.tokenTax));
  const gpt35 = summary.models.find((m) => m.id === "gpt-3.5-turbo");

  return (
    <div className="min-h-screen" style={{ background: INK.bg }}>
      {/* --- hero ------------------------------------------------------------------- */}
      <header className="relative overflow-hidden" style={{ borderBottom: `1px solid ${INK.panelBorder}` }}>
        <div className="absolute inset-0" style={dotTexture} aria-hidden />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 40%, transparent 30%, ${INK.bg} 95%)`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[920px] px-6 pb-16 pt-20 text-center sm:pb-20 sm:pt-24">
          <div className="text-[9px] tracking-widest" style={{ ...pixelFont, color: INK.blue }}>
            AN EVAL BY SHAWN ESQUIVEL ·{" "}
            {new Date(summary.generatedAt)
              .toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
              .toUpperCase()}
          </div>
          <h1 className="mt-8 leading-none">
            <span className="block text-7xl sm:text-8xl" style={{ ...cursiveFont, color: INK.white }}>
              Boomer
            </span>
            <span
              className="mt-4 block text-2xl tracking-wider sm:text-4xl"
              style={{ ...pixelFont, color: INK.neon, textShadow: `0 0 24px ${INK.neon}55` }}
            >
              EVALS
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-[560px] text-base leading-relaxed sm:text-lg" style={{ color: INK.text }}>
            Do you need to write clean, capitalized, typo-free prompts? We measured it. Across{" "}
            {runCount.toLocaleString()} graded responses, frontier models lost nothing to typos — but some paid for
            them in compute.
          </p>
          <div className="mx-auto mt-10 flex max-w-[560px] justify-center gap-10 sm:gap-14">
            {[
              { value: String(frontierGI), label: "FRONTIER GI", accent: true },
              { value: String(summary.models.length), label: "MODELS", accent: false },
              { value: runCount.toLocaleString(), label: "RESPONSES", accent: false },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl tabular-nums sm:text-3xl"
                  style={{ ...pixelFont, color: stat.accent ? INK.neon : INK.white }}
                >
                  {stat.value}
                </div>
                <div className="mt-2 text-[8px] tracking-widest" style={{ ...pixelFont, color: INK.faint }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="space-y-16 pb-24 pt-16 sm:space-y-20">
        {/* --- thesis ----------------------------------------------------------------- */}
        <Section kicker="01" title="Thesis">
          <p className="text-xl leading-relaxed" style={{ ...cursiveFont, color: INK.white }}>
            "only boomers fix typos in prompts. llms perfectly understand you even if you mistype."
          </p>
          <p>
            The claim is that beautifying a prompt — fixing typos, capitalizing, punctuating, writing complete
            sentences — buys you nothing. If true, time spent cleaning up prompts is wasted. If false, there should be
            a measurable accuracy gap between clean and sloppy versions of the same request.
          </p>
          <p>We designed an eval to settle it.</p>
        </Section>

        {/* --- assumptions --------------------------------------------------------------- */}
        <Section kicker="02" title="Assumptions">
          <ul className="list-disc space-y-2.5 pl-5 marker:text-[color:var(--marker,#a3ff12)]" style={{ "--marker": INK.neon } as React.CSSProperties}>
            <li>
              <strong style={{ color: INK.white }}>Typos are noise, not information loss.</strong> A fair test mangles
              prose but must preserve the facts. If corruption destroys a number the task needs, we're measuring data
              destruction, not robustness.
            </li>
            <li>
              <strong style={{ color: INK.white }}>The task must be objectively gradable.</strong> Every task has one
              exact-match answer, so grading cannot flatter sloppy or clean prompts differently.
            </li>
            <li>
              <strong style={{ color: INK.white }}>Formatting instructions don't count as part of the test.</strong>{" "}
              The answer-format instruction lives in a clean system prompt. We measure comprehension of the corrupted
              message, not parsing luck.
            </li>
            <li>
              <strong style={{ color: INK.white }}>Frontier models will probably ace it.</strong> We expected accuracy
              alone to saturate, so we also measured what sloppiness costs in tokens and latency.
            </li>
          </ul>
        </Section>

        {/* --- experiment structure ---------------------------------------------------------- */}
        <Section kicker="03" title="Experiment structure">
          <p>
            We wrote {taskCount} tasks with exact-match answers: arithmetic, relational logic, calendar math, code
            reading, fact extraction, and instruction following. A deterministic, seeded corruptor then rewrites each
            task at six escalating levels of sloppiness — L0 is the original; L5 is barely English.
          </p>
          <p>
            Digits, proper nouns, quoted strings, and code blocks are never touched. Only the prose around them
            degrades.
          </p>
        </Section>

        <Figure
          n={1}
          caption={`The corruption ladder. The same task at all six levels — every level is generated deterministically from a seed, so the dataset is reproducible. Select any of the ${taskCount} tasks.`}
        >
          <LevelShowcase summary={summary} items={datasetItems} />
        </Figure>

        <Section>
          <p>
            Each of the {summary.models.length} models answered every prompt up to 3 times at temperature 0 (where the
            API allows it), for {runCount.toLocaleString()} graded responses. Models span three generations: 2026
            frontier (GPT-5.5, Claude Fable 5, Gemini Flash Lite), current small models (GPT-5.4 Mini/Nano, Claude
            Haiku 4.5), and a 2023-era control (GPT-3.5 Turbo) — the generation the typo-fixing advice was written
            for.
          </p>
        </Section>

        {/* --- findings ----------------------------------------------------------------------- */}
        <Section kicker="04" title="Finding 1: Typos don't move accuracy">
          <p>
            Every frontier model scored 100% at every corruption level — including keyboard smash. The thesis holds
            completely at the frontier.
          </p>
          <p>
            The more surprising result is the control group. GPT-3.5 Turbo scores only {pct(gpt35?.cleanAccuracy ?? 0)}{" "}
            on <em>clean</em> prompts, but corruption barely moves it ({pct(gpt35?.corruptedAccuracy ?? 0)} on
            gibberish). Its problem was never reading your typos — it was the tasks themselves. The advice to write
            carefully was mostly superstition even when it was coined.
          </p>
        </Section>

        <Figure
          n={2}
          caption="Accuracy by corruption level. Each line is a model; L0 is the clean prompt. The frontier lines are flat at 100%. The only visible dents are small models at L5, and GPT-3.5 Turbo being uniformly bad. Y axis starts at 40%."
        >
          <DegradationChart summary={summary} />
        </Figure>

        <Section>
          <p>
            We summarize robustness as the <strong style={{ color: INK.neon }}>Gibberish Index</strong>: accuracy on
            corrupted prompts (L1–L5) as a share of clean accuracy, ×100. A score of 100 means typos cost nothing.
            Scores above 100 mean the model did marginally better on gibberish — read those as immune, within noise.
          </p>
        </Section>

        <Figure
          n={3}
          caption="The Gibberish Index leaderboard. No model drops below 96. The spread between the best and worst model on this metric is smaller than the spread you'd get from picking a different model size."
        >
          <Leaderboard summary={summary} />
        </Figure>

        <Section kicker="05" title="Finding 2: You pay for slop in tokens, not accuracy">
          <p>
            Accuracy saturates, but compute doesn't. On heavily corrupted prompts (L4–L5), GPT-5.5 spends {maxTokenTax}
            x the output and reasoning tokens it uses on the clean version of the same task. Claude Fable 5 shows the
            same pattern. The models silently absorb the decoding work — and bill you for it.
          </p>
          <p>
            This reframes the question. Cleaning up your prompt is not about getting the right answer; it's a small
            compute optimization. For most interactive use it's irrelevant. At API scale, slop has a unit cost.
          </p>
        </Section>

        <Figure
          n={4}
          caption="The gibberish tax: output+reasoning tokens on L4–L5 prompts relative to the clean prompt. Reasoning models pay the most — they appear to spend extra thinking tokens reconstructing what you meant."
        >
          <TaxChart summary={summary} />
        </Figure>

        <Section>
          <p>
            Plotting both dimensions together shows where each model sits. The frontier models cluster at 100%
            accuracy but spread widely on token cost. GPT-5.4 Mini stakes out the efficient corner: 96% accuracy on
            gibberish at roughly a fifth of GPT-5.5's tokens.
          </p>
        </Section>

        <Figure
          n={5}
          caption="The slop efficiency frontier. Accuracy on corrupted prompts vs. median completion tokens, X axis reversed so the ideal position — immune and cheap — is top right. Whiskers are 95% confidence intervals."
        >
          <FrontierChart summary={summary} />
        </Figure>

        <Section kicker="06" title="Where corruption does bite">
          <p>
            The aggregate hides a real effect. Failures concentrate in tasks where the meaning hangs on one precise
            sentence: an ambiguous age puzzle drops to 50% at L5, relational logic to 67%. When a typo lands on the
            load-bearing word, small models lose the thread. Every wrong answer in the run is below.
          </p>
        </Section>

        <Figure n={6} caption="Failure browser: every incorrect response across all models, levels, and trials.">
          <Failures summary={summary} />
        </Figure>

        {/* --- limitations -------------------------------------------------------------------- */}
        <Section kicker="07" title="What this doesn't cover">
          <ul className="list-disc space-y-2.5 pl-5" style={{ "--marker": INK.neon } as React.CSSProperties}>
            <li>
              <strong style={{ color: INK.white }}>Short, closed-form tasks only.</strong> Our tasks fit in a paragraph
              and have one right answer. Long agentic work — where an early misreading compounds over many steps —
              could behave very differently.
            </li>
            <li>
              <strong style={{ color: INK.white }}>Synthetic corruption.</strong> Our corruptor is a model of sloppy
              typing, not a sample of it. Real slop includes missing context and ambiguous referents, which may be
              harder than shuffled letters.
            </li>
            <li>
              <strong style={{ color: INK.white }}>Protected facts.</strong> We never corrupt numbers or names. In real
              typing, people typo the number — and no model can recover information that isn't there.
            </li>
            <li>
              <strong style={{ color: INK.white }}>
                English only, {taskCount} tasks, {summary.models.length} models.
              </strong>{" "}
              No Grok (no API key available), and Gemini's larger models were excluded by free-tier rate limits.
            </li>
            <li>
              <strong style={{ color: INK.white }}>Default reasoning effort.</strong> The token tax might shrink or
              grow at other effort settings.
            </li>
          </ul>
        </Section>

        {/* --- conclusion --------------------------------------------------------------------- */}
        <Section kicker="08" title="Conclusion">
          <p>
            The conclusion suggests the typo-fixing instinct is obsolete for correctness, and was probably never
            load-bearing. Don't beautify prompts to get better answers — modern models read through slop at every
            level we tested, and even 2023-era models mostly did.
          </p>
          <p>
            The real cost of sloppiness is compute: reasoning models quietly spend up to {maxTokenTax}x the tokens
            decoding heavily mangled prompts. If you're a person chatting with a model, type however you want. If
            you're a system generating millions of prompts, normalize them first — not for accuracy, but for the token
            bill.
          </p>
          <p>
            And one caveat survives: if your prompt's meaning hangs on a single word, that's the one word worth typing
            carefully.
          </p>
        </Section>

        {/* --- methodology footnote ---------------------------------------------------------- */}
        <Section kicker="" title="Methodology notes">
          <ul className="list-disc space-y-2 pl-5 text-sm" style={{ color: INK.muted }}>
            <li>
              {taskCount} tasks × 6 levels × {summary.models.length} models × up to 3 trials ={" "}
              {runCount.toLocaleString()} graded responses
              {summary.errorCount > 0 ? ` (${summary.errorCount} API errors excluded)` : ""}.
            </li>
            <li>
              Corruption is a pure function of (text, seed): lowercase, punctuation stripping, QWERTY-adjacent typos,
              filler words, txt-speak, letter shuffles, deleted spaces — escalating across L1–L5.
            </li>
            <li>
              Exact-match grading on a normalized final answer line; stored responses are re-graded when grading logic
              changes.
            </li>
            <li>Gibberish Index = mean accuracy on L1–L5 ÷ accuracy on L0, ×100. Confidence intervals are Wilson 95%.</li>
            <li>
              Last run{" "}
              {new Date(summary.generatedAt).toLocaleString("en", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </li>
          </ul>
        </Section>

        {/* --- footer sign-off ----------------------------------------------------------------- */}
        <footer className="mx-auto max-w-[720px] px-6 pt-8 text-center" style={{ borderTop: `1px solid ${INK.panelBorder}` }}>
          <div className="text-3xl" style={{ ...cursiveFont, color: INK.white }}>
            ok thanks bye
          </div>
          <div className="mt-4 text-[8px] tracking-widest" style={{ ...pixelFont, color: INK.faint }}>
            SHAWN-BUILDS.COM
          </div>
        </footer>
      </main>
    </div>
  );
}
