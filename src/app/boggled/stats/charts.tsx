import type { CSSProperties, ReactNode } from "react";

// Small server-rendered SVG / CSS charts for the stats dashboard (no client JS).

export const pct = (n: number, d: number) =>
  d > 0 ? `${Math.round((n / d) * 100)}%` : "—";
export const ratio = (n: number, d: number) => (d > 0 ? n / d : 0);

export function Card({
  title,
  why,
  children,
  className = "",
  accent,
}: {
  title?: string;
  why?: string;
  children: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <section
      className={`bg-stat-card flex flex-col gap-3 p-4 md:p-5 ${className}`}
      style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}
    >
      {title && (
        <div>
          <h2 className="bg-title text-xl">{title}</h2>
          {why && <p className="text-sm opacity-70">{why}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chapter({
  icon,
  title,
  sub,
}: {
  icon: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="bg-chapter mt-6 flex items-center gap-3">
      <span className="text-4xl leading-none">{icon}</span>
      <div>
        <h2 className="bg-title text-2xl md:text-3xl">{title}</h2>
        <p className="text-sm opacity-75">{sub}</p>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-white/20 p-4 text-center text-sm opacity-70">
      {children}
    </p>
  );
}

export function Sparkline({
  values,
  color = "var(--gold)",
  height = 36,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length < 2) return null;
  const w = 120;
  const max = Math.max(1, ...values);
  const pts = values.map(
    (v, i) =>
      [
        (i / (values.length - 1)) * w,
        height - 2 - (v / max) * (height - 4),
      ] as const,
  );
  const line = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join("");
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={`${line}L${w},${height}L0,${height}Z`}
        fill={color}
        opacity={0.18}
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hero({
  label,
  value,
  hint,
  spark,
  color,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  spark?: number[];
  color?: string;
}) {
  return (
    <div
      className="bg-stat-card bg-hero flex flex-col gap-1 p-4"
      style={color ? ({ "--accent": color } as CSSProperties) : undefined}
    >
      <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="bg-hero-value">{value}</div>
      {hint && <div className="text-xs opacity-75">{hint}</div>}
      {spark && <Sparkline values={spark} color={color} />}
    </div>
  );
}

export function Ring({
  value,
  label,
  sub,
  color = "var(--gold)",
  size = 96,
}: {
  value: number;
  label: ReactNode;
  sub?: ReactNode;
  color?: string;
  size?: number;
}) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth="11"
        />
        {v > 0 && (
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${c * v} ${c}`}
            transform="rotate(-90 50 50)"
            className="bg-ring-arc"
          />
        )}
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#fff"
        >
          {Math.round(v * 100)}%
        </text>
      </svg>
      <div className="text-sm font-semibold leading-tight">{label}</div>
      {sub && <div className="text-xs opacity-65">{sub}</div>}
    </div>
  );
}

export type BarRow = {
  label: ReactNode;
  value: number;
  display?: ReactNode;
  note?: ReactNode;
  key?: string;
  color?: string;
};

export function Bars({
  rows,
  empty = "No data yet",
  max: maxIn,
  color,
}: {
  rows: BarRow[];
  empty?: string;
  max?: number;
  color?: string;
}) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  const max = maxIn ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div
          key={r.key ?? i}
          className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-2 text-sm"
        >
          <span className="truncate">{r.label}</span>
          <span className="h-3.5 overflow-hidden rounded-full bg-white/10">
            <span
              className="bg-bar block h-full rounded-full"
              style={{
                width: `${Math.max(r.value > 0 ? 3 : 0, (r.value / max) * 100)}%`,
                background: r.color ?? color,
                animationDelay: `${i * 40}ms`,
              }}
            />
          </span>
          <span className="tabular-nums">
            {r.display ?? r.value}
            {r.note && (
              <span className="ml-1 text-xs opacity-60">{r.note}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Columns({
  rows,
  color = "var(--gold)",
  height = 140,
  unit,
}: {
  rows: { label: string; value: number; title?: string }[];
  color?: string;
  height?: number;
  unit?: string;
}) {
  if (!rows.length) return <Empty>No data yet</Empty>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const every = Math.ceil(rows.length / 16);
  return (
    <div
      className="flex items-end gap-1 overflow-x-auto"
      style={{ height: height + 34 }}
    >
      {rows.map((r, i) => (
        <div
          key={r.label + i}
          className="flex min-w-5 flex-1 flex-col items-center gap-1"
          title={r.title ?? `${r.label}: ${r.value}${unit ? ` ${unit}` : ""}`}
        >
          <span className="text-[10px] tabular-nums opacity-80">
            {r.value || ""}
          </span>
          <span
            className="bg-col w-full rounded-t-md"
            style={{
              height: `${Math.max(r.value ? 4 : 1, (r.value / max) * height)}px`,
              background: color,
              animationDelay: `${i * 25}ms`,
            }}
          />
          <span className="whitespace-nowrap text-[10px] opacity-60">
            {i % every === 0 ? r.label : "\u00a0"}
          </span>
        </div>
      ))}
    </div>
  );
}

// Two series side by side per label, e.g. unique visitors vs visits per day.
export function PairColumns({
  rows,
  colors,
  names,
  height = 140,
}: {
  rows: { label: string; a: number; b: number }[];
  colors: [string, string];
  names: [string, string];
  height?: number;
}) {
  if (!rows.length) return <Empty>No data yet</Empty>;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)));
  const every = Math.ceil(rows.length / 16);
  return (
    <div>
      <div className="mb-2 flex gap-4 text-xs opacity-80">
        {names.map((n, i) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: colors[i] }} />
            {n}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-1.5 overflow-x-auto" style={{ height: height + 34 }}>
        {rows.map((r, i) => (
          <div key={r.label + i} className="flex min-w-5 flex-1 flex-col items-center gap-1" title={`${r.label}: ${r.a} ${names[0]}, ${r.b} ${names[1]}`}>
            <span className="text-[10px] tabular-nums opacity-80">{r.b ? `${r.a}/${r.b}` : ""}</span>
            <span className="flex w-full items-end gap-px">
              {[r.a, r.b].map((v, k) => (
                <span
                  key={k}
                  className="bg-col flex-1 rounded-t-sm"
                  style={{ height: `${Math.max(v ? 4 : 1, (v / max) * height)}px`, background: colors[k], animationDelay: `${i * 25}ms` }}
                />
              ))}
            </span>
            <span className="whitespace-nowrap text-[10px] opacity-60">{i % every === 0 ? r.label : "\u00a0"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line + area for "came back within N days" with labelled points.
export function Curve({
  points,
  color = "#3ddc84",
}: {
  points: { label: string; value: number; sub?: string }[];
  color?: string;
}) {
  if (!points.length) return <Empty>Needs at least a day of history.</Empty>;
  const w = 520;
  const h = 190;
  const pad = { l: 34, r: 24, t: 26, b: 34 };
  const max = Math.max(0.1, ...points.map((p) => p.value));
  const top = Math.min(1, Math.ceil(max * 10) / 10);
  const x = (i: number) =>
    pad.l +
    (points.length === 1
      ? (w - pad.l - pad.r) / 2
      : (i / (points.length - 1)) * (w - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / top) * (h - pad.t - pad.b);
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`)
    .join("");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label="Return rate curve"
    >
      <defs>
        <linearGradient id="curve-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={y(top * g)}
            y2={y(top * g)}
            stroke="rgb(255 255 255 / 0.1)"
          />
          <text
            x={pad.l - 6}
            y={y(top * g) + 4}
            fontSize="11"
            textAnchor="end"
            fill="rgb(255 255 255 / 0.55)"
          >
            {Math.round(top * g * 100)}%
          </text>
        </g>
      ))}
      <path
        d={`${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`}
        fill="url(#curve-fill)"
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="bg-curve-line"
      />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle
            cx={x(i)}
            cy={y(p.value)}
            r="6"
            fill="#1b0c57"
            stroke={color}
            strokeWidth="3"
          />
          <text
            x={x(i)}
            y={y(p.value) - 12}
            fontSize="14"
            fontWeight="700"
            textAnchor="middle"
            fill="#fff"
          >
            {Math.round(p.value * 100)}%
          </text>
          <text
            x={x(i)}
            y={h - 14}
            fontSize="12"
            textAnchor="middle"
            fill="rgb(255 255 255 / 0.8)"
          >
            {p.label}
          </text>
          {p.sub && (
            <text
              x={x(i)}
              y={h - 1}
              fontSize="10"
              textAnchor="middle"
              fill="rgb(255 255 255 / 0.45)"
            >
              {p.sub}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({
  cells,
}: {
  cells: { dow: number; hour: number; rounds: number }[];
}) {
  if (!cells.length) return <Empty>No rounds yet</Empty>;
  const grid = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.rounds]));
  const max = Math.max(1, ...cells.map((c) => c.rounds));
  const peak = cells.reduce((a, b) => (b.rounds > a.rounds ? b : a));
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[560px] gap-[3px]"
          style={{ gridTemplateColumns: "2.4rem repeat(24, minmax(0, 1fr))" }}
        >
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[9px] opacity-55">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
          {DOW.map((d, i) => (
            <div key={d} className="contents">
              <span className="text-[11px] leading-[18px] opacity-70">{d}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const n = grid.get(`${i + 1}-${h}`) ?? 0;
                return (
                  <span
                    key={h}
                    className="h-[18px] rounded-[4px]"
                    title={`${d} ${String(h).padStart(2, "0")}:00 — ${n} rounds`}
                    style={{
                      background: n
                        ? `rgb(255 210 63 / ${(0.18 + 0.82 * Math.sqrt(n / max)).toFixed(2)})`
                        : "rgb(255 255 255 / 0.05)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs opacity-70">
        Busiest:{" "}
        <b>
          {DOW[peak.dow - 1]} {String(peak.hour).padStart(2, "0")}:00
        </b>{" "}
        ({peak.rounds} rounds)
      </p>
    </div>
  );
}

export function People({ n, max = 10 }: { n: number; max?: number }) {
  return (
    <span className="tracking-[-0.15em]" aria-label={`${n} players`}>
      {"🧑".repeat(Math.min(n, max))}
      {n > max ? (
        <span className="ml-1 text-xs tracking-normal opacity-70">
          +{n - max}
        </span>
      ) : null}
    </span>
  );
}

export function Funnel({
  steps,
}: {
  steps: { label: ReactNode; value: number }[];
}) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((s, i) => (
        <div key={i} className="relative">
          <div
            className="bg-funnel-step mx-auto flex items-center justify-between rounded-xl px-3 py-2 text-sm"
            style={{
              width: `${Math.min(100, Math.max(38, (s.value / top) * 100))}%`,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <span className="truncate font-semibold">{s.label}</span>
            <span className="ml-2 tabular-nums">
              {s.value}
              {i > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  {pct(s.value, top)}
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
