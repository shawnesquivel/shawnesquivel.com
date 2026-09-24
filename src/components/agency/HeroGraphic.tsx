import Image from "next/image";
import { IMAGES } from "@/lib/agency/site";

const OUTPUT_PATHS = [
  "M250 362 C250 420, 90 400, 90 462",
  "M250 362 L250 462",
  "M250 362 C250 420, 410 400, 410 462",
];
const INPUT_PATH = "M250 118 L250 238";

// One shared timeline: the request travels into the core, then all three deliverables leave together.
const CYCLE = "3.2s";

const OUTPUTS = [
  { x: 90, label: "Blog post", meta: "2,140 words", icon: <DocIcon /> },
  { x: 250, label: "YouTube", meta: "18:42 · edited", icon: <PlayIcon /> },
  { x: 410, label: "Cookbook", meta: "repo · tested", icon: <CodeIcon /> },
];

// Coordinates live in a 500×600 space; the wrapper keeps that aspect ratio so % positions line up with the SVG.
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export default function HeroGraphic() {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[500px] select-none" aria-hidden>
      <div className="absolute left-1/2 top-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/20 blur-[90px]" />
      <div className="absolute left-1/2 top-1/2 size-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[60px]" />

      <svg viewBox="0 0 500 600" className="absolute inset-0 size-full" fill="none">
        <defs>
          {/* userSpaceOnUse: the straight vertical paths have a zero-width bbox, which breaks objectBoundingBox gradients. */}
          <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="0" y1="118" x2="0" y2="462">
            <stop offset="0%" stopColor="#8b7bff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c6ff4a" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[INPUT_PATH, ...OUTPUT_PATHS].map((d) => (
          <g key={d}>
            <path d={d} stroke="rgb(255 255 255 / 0.08)" strokeWidth="1.5" />
            <path d={d} stroke="url(#beam)" strokeWidth="1.5" strokeOpacity="0.6" className="ag-dash" />
          </g>
        ))}

        <circle r="3.5" fill="#8b7bff" filter="url(#glow)" opacity="0">
          <animateMotion dur={CYCLE} repeatCount="indefinite" path={INPUT_PATH} keyPoints="0;1;1" keyTimes="0;0.4;1" calcMode="linear" />
          <animate attributeName="opacity" dur={CYCLE} repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;0.05;0.35;0.4;1" />
        </circle>

        {OUTPUT_PATHS.map((d) => (
          <circle key={`p-${d}`} r="3.5" fill="#c6ff4a" filter="url(#glow)" opacity="0">
            <animateMotion dur={CYCLE} repeatCount="indefinite" path={d} keyPoints="0;0;1;1" keyTimes="0;0.45;0.95;1" calcMode="linear" />
            <animate attributeName="opacity" dur={CYCLE} repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.45;0.52;0.88;0.95;1" />
          </circle>
        ))}
      </svg>

      <div
        className="absolute -translate-x-1/2 rounded-2xl border border-line-strong bg-surface/90 p-4 shadow-2xl shadow-black/60 backdrop-blur"
        style={{ left: "50%", top: pct(22, 600), width: pct(330, 500) }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-white/5 ring-1 ring-line">
              <Image src="/agency/logos/cursor-icon.svg" alt="" width={13} height={14} className="h-3.5 w-auto" />
            </span>
            <span className="grid size-6 place-items-center rounded-md bg-white/5 ring-1 ring-line">
              <Image src="/agency/logos/claude.svg" alt="" width={14} height={14} className="size-3.5" />
            </span>
            <span className="grid size-6 place-items-center rounded-md bg-white/5 ring-1 ring-line">
              <Image src="/agency/logos/codex.svg" alt="" width={14} height={14} className="size-3.5" />
            </span>
            <span className="ml-1 text-xs text-muted">Your agent</span>
          </div>
          <span className="rounded-full bg-violet/15 px-2 py-0.5 font-mono text-[10px] text-violet">MCP</span>
        </div>
        <p className="truncate font-mono text-[11px] leading-relaxed text-muted sm:text-xs">
          <span className="text-violet">devrel</span>.<span className="text-fg">create_request</span>({"{ "}
          <span className="text-accent">type</span>: <span className="text-amber-300">&quot;cookbook&quot;</span>
          {" }"})<span className="ag-blink ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-accent" />
        </p>
      </div>

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "50%", top: pct(300, 600), width: pct(128, 500), aspectRatio: "1" }}
      >
        <div className="ag-spin-slow absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#8b7bff,#c6ff4a,transparent_60%,#8b7bff)] p-[2px]">
          <div className="size-full rounded-full bg-bg" />
        </div>
        <div className="absolute inset-[7px] overflow-hidden rounded-full ring-1 ring-line-strong">
          <Image src={IMAGES.avatar} alt="" fill sizes="128px" className="object-cover" priority />
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line-strong bg-surface px-2.5 py-1 text-[10px] font-medium text-fg">
          Shawn + agents
        </div>
      </div>

      <div
        className="ag-float absolute hidden rounded-xl border border-line bg-surface/80 px-3 py-2 backdrop-blur sm:block"
        style={{ left: 0, top: pct(250, 600) }}
      >
        <p className="font-mono text-[10px] text-subtle">req_0142</p>
        <p className="flex items-center gap-1.5 text-xs text-fg">
          <span className="size-1.5 rounded-full bg-amber-400" /> In review
        </p>
      </div>
      <div
        className="ag-float absolute hidden rounded-xl border border-line bg-surface/80 px-3 py-2 backdrop-blur [animation-delay:-3s] sm:block"
        style={{ right: 0, top: pct(290, 600) }}
      >
        <p className="font-mono text-[10px] text-subtle">queue</p>
        <p className="text-xs text-fg">
          <span className="text-accent">∞</span> requests
        </p>
      </div>

      {OUTPUTS.map((o) => (
        <div
          key={o.label}
          className="absolute -translate-x-1/2 rounded-xl border border-line-strong bg-surface/90 p-3 shadow-xl shadow-black/50 backdrop-blur"
          style={{ left: pct(o.x, 500), top: pct(466, 600), width: pct(146, 500) }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent">{o.icon}</span>
            <span className="grid size-4 place-items-center rounded-full bg-accent text-black">
              <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2.5 6.5l2 2 5-5" />
              </svg>
            </span>
          </div>
          <p className="text-xs font-medium text-fg sm:text-sm">{o.label}</p>
          <p className="font-mono text-[10px] text-subtle">{o.meta}</p>
        </div>
      ))}
    </div>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2h5l3 3v9H4z M9 2v3h3 M6 8h4 M6 11h4" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
      <path d="M5 3.5v9l7-4.5z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" />
    </svg>
  );
}
