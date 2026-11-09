import { memo, type ReactNode } from "react";
import { LEVELS, MAX_LEVEL } from "@/lib/boggled/quest";
import { mulberry32 } from "@/lib/boggled/rng";

// One tall, hand-drawn world for the whole quest: meadow → woods → desert → snowy peaks, level 1 at the bottom.
// Everything is in a 400-wide coordinate space; the map scales to the column width.

export const W = 400;
const SPACING = 128;
const REGION_GAP = 96;
const BOTTOM = 190;
const TOP = 460;
const SKY = 400;
export const H = BOTTOM + (MAX_LEVEL - 1) * SPACING + 3 * REGION_GAP + TOP;

type P = { x: number; y: number };

export const NODE_POS: P[] = LEVELS.map((l) => ({
  x: Math.round(200 + 108 * Math.sin((l.level - 1) * 0.95 + 0.3)),
  y: H - BOTTOM - (l.level - 1) * SPACING - l.region * REGION_GAP,
}));
const ENTRY = { x: NODE_POS[0].x - 40, y: H + 20 };
export const CASTLE = { x: 200, y: 260 };
const GATE = { x: CASTLE.x, y: CASTLE.y + 70 };

// y where region r ends and r + 1 begins (between levels 5r+5 and 5r+6)
export const BOUNDARIES = [0, 1, 2].map((r) => (NODE_POS[r * 5 + 4].y + NODE_POS[r * 5 + 5].y) / 2);
const regionAt = (y: number) => BOUNDARIES.filter((b) => y < b).length;

type Seg = { d: string; pts: P[] };

// Catmull-Rom through the points as one cubic Bézier per segment, plus samples for spacing checks.
function segments(pts: P[]): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const samples: P[] = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const u = 1 - t;
      samples.push({
        x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
        y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
      });
    }
    out.push({ d: `M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`, pts: samples });
  }
  return out;
}

// Segment i leads into level i + 1 (the last one leads to the castle).
export const SEGMENTS = segments([ENTRY, ...NODE_POS, GATE]);
const PATH_PTS = SEGMENTS.flatMap((s) => s.pts);

const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const nearPath = (p: P, r: number) => PATH_PTS.some((q) => dist(p, q) < r);

// x of the path where it crosses height y (for the bridge)
function pathXAt(y: number) {
  let best = PATH_PTS[0];
  for (const q of PATH_PTS) if (Math.abs(q.y - y) < Math.abs(best.y - y)) best = q;
  return best.x;
}

const GROUND: [string, string][] = [
  ["#8fdc5c", "#6cc94f"],
  ["#3fa86a", "#2b8a59"],
  ["#f3c770", "#e7a957"],
  ["#c9c4f2", "#eef0ff"],
];
const BLEND = 70;

type Kind =
  | "tree"
  | "bush"
  | "flowers"
  | "pine"
  | "mushroom"
  | "log"
  | "rock"
  | "cactus"
  | "dune"
  | "palm"
  | "mesa"
  | "mountain"
  | "snowpine"
  | "crystal";

const SIZE: Record<Kind, number> = {
  tree: 26,
  bush: 16,
  flowers: 10,
  pine: 22,
  mushroom: 9,
  log: 14,
  rock: 12,
  cactus: 16,
  dune: 30,
  palm: 22,
  mesa: 40,
  mountain: 60,
  snowpine: 22,
  crystal: 12,
};

const KINDS: Kind[][] = [
  ["tree", "tree", "bush", "flowers", "flowers", "rock", "tree"],
  ["pine", "pine", "pine", "mushroom", "log", "bush", "pine"],
  ["cactus", "cactus", "dune", "rock", "palm", "mesa", "dune"],
  ["mountain", "snowpine", "snowpine", "crystal", "rock", "mountain", "snowpine"],
];

type Thing = { kind: Kind; x: number; y: number; s: number; flip: boolean };

function scatter(): { things: Thing[]; details: { region: number; x: number; y: number; r: number }[] } {
  const rnd = mulberry32(20261109);
  const things: Thing[] = [];
  const nodes = NODE_POS;
  for (let i = 0; i < 900 && things.length < 230; i++) {
    const p = { x: rnd() * W, y: SKY - 50 + rnd() * (H - SKY + 50) };
    if (Math.abs(p.x - CASTLE.x) < 110 && p.y < CASTLE.y + 100) continue;
    const region = Math.min(3, Math.max(0, regionAt(p.y + (rnd() - 0.5) * 140)));
    const kinds = KINDS[region];
    let kind = kinds[Math.floor(rnd() * kinds.length)];
    // big landforms only near the edges
    if ((kind === "mountain" || kind === "mesa") && p.x > 90 && p.x < 310) kind = region === 3 ? "snowpine" : "cactus";
    const s = 0.8 + rnd() * 0.55;
    const r = SIZE[kind] * s;
    if (nearPath(p, 26 + r)) continue;
    if (nodes.some((n) => dist(n, p) < 52 + r)) continue;
    if (things.some((t) => dist(t, p) < (SIZE[t.kind] * t.s + r) * 0.75)) continue;
    things.push({ kind, x: p.x, y: p.y, s, flip: rnd() < 0.5 });
  }
  things.sort((a, b) => a.y - b.y);
  const details = [];
  for (let i = 0; i < 260; i++) {
    const p = { x: rnd() * W, y: SKY + rnd() * (H - SKY) };
    details.push({ region: regionAt(p.y), x: p.x, y: p.y, r: 0.6 + rnd() * 0.8 });
  }
  return { things, details };
}

const shadow = (rx: number) => <ellipse cx={0} cy={0} rx={rx} ry={rx * 0.32} fill="rgb(0 0 0 / 0.18)" />;

function draw(kind: Kind): ReactNode {
  switch (kind) {
    case "tree":
      return (
        <>
          {shadow(15)}
          <rect x={-2.5} y={-15} width={5} height={15} rx={2} fill="#8a5a2b" />
          <circle cx={0} cy={-26} r={14} fill="#2f9a43" />
          <circle cx={-5} cy={-29} r={9} fill="#4fbf55" />
          <circle cx={-7} cy={-32} r={3.5} fill="#8be27a" />
        </>
      );
    case "bush":
      return (
        <>
          {shadow(12)}
          <circle cx={-6} cy={-6} r={7} fill="#2f9a43" />
          <circle cx={6} cy={-6} r={7} fill="#2f9a43" />
          <circle cx={0} cy={-10} r={8} fill="#45b553" />
          <circle cx={-3} cy={-13} r={3} fill="#86dd78" />
        </>
      );
    case "flowers":
      return (
        <>
          {[
            [-6, -2, "#ff6b9a"],
            [2, -5, "#fff"],
            [7, 0, "#ffd23f"],
            [-1, 2, "#ff9ed1"],
            [-9, -7, "#fff"],
          ].map(([x, y, c], i) => (
            <g key={i}>
              <circle cx={x as number} cy={y as number} r={2.6} fill={c as string} />
              <circle cx={x as number} cy={y as number} r={1} fill="#f5a623" />
            </g>
          ))}
        </>
      );
    case "pine":
      return (
        <>
          {shadow(13)}
          <rect x={-2.5} y={-10} width={5} height={10} fill="#6b4423" />
          <polygon points="0,-46 -12,-24 12,-24" fill="#1d6b40" />
          <polygon points="0,-38 -15,-14 15,-14" fill="#1f7a48" />
          <polygon points="0,-30 -17,-6 17,-6" fill="#238a50" />
          <polygon points="0,-46 0,-6 -17,-6" fill="rgb(255 255 255 / 0.08)" />
        </>
      );
    case "snowpine":
      return (
        <>
          {shadow(13)}
          <rect x={-2.5} y={-10} width={5} height={10} fill="#6b4423" />
          <polygon points="0,-46 -12,-24 12,-24" fill="#2c6e62" />
          <polygon points="0,-38 -15,-14 15,-14" fill="#2f7d6e" />
          <polygon points="0,-30 -17,-6 17,-6" fill="#338a79" />
          <polygon points="0,-46 -6,-35 0,-37 6,-35" fill="#fff" />
          <polygon points="-15,-14 -9,-18 -3,-15 3,-18 9,-15 15,-14 0,-22" fill="#fff" opacity={0.9} />
        </>
      );
    case "mushroom":
      return (
        <>
          {shadow(7)}
          <rect x={-2.5} y={-8} width={5} height={8} rx={2} fill="#fff4e0" />
          <path d="M-9,-7 A9,8 0 0 1 9,-7 Z" fill="#e8384f" />
          <circle cx={-3} cy={-11} r={1.6} fill="#fff" />
          <circle cx={3.5} cy={-9} r={1.3} fill="#fff" />
        </>
      );
    case "log":
      return (
        <>
          {shadow(13)}
          <rect x={-13} y={-8} width={24} height={8} rx={4} fill="#8a5a2b" />
          <ellipse cx={11} cy={-4} rx={3} ry={4} fill="#d9a066" />
          <ellipse cx={11} cy={-4} rx={1.3} ry={1.8} fill="#a8703a" />
        </>
      );
    case "rock":
      return (
        <>
          {shadow(11)}
          <polygon points="-11,0 -8,-9 -1,-13 8,-10 11,0" fill="#8b8fa3" />
          <polygon points="-8,-9 -1,-13 2,-6 -5,-4" fill="#b7bbcc" />
        </>
      );
    case "cactus":
      return (
        <>
          {shadow(10)}
          <rect x={-4} y={-30} width={8} height={30} rx={4} fill="#3c9a5f" />
          <path d="M-4,-14 h-6 a3,3 0 0 1 -3,-3 v-8" stroke="#3c9a5f" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M4,-18 h5 a3,3 0 0 0 3,-3 v-6" stroke="#3c9a5f" strokeWidth={6} fill="none" strokeLinecap="round" />
          <rect x={-1.5} y={-28} width={2} height={26} rx={1} fill="#5fbf7e" />
        </>
      );
    case "dune":
      return (
        <>
          <path d="M-32,0 C-18,-16 -4,-18 6,-12 C14,-8 22,-6 32,0 Z" fill="#f7d58c" />
          <path d="M6,-12 C14,-8 22,-6 32,0 L4,0 Z" fill="#dfa04f" opacity={0.6} />
        </>
      );
    case "palm":
      return (
        <>
          {shadow(12)}
          <ellipse cx={0} cy={2} rx={18} ry={6} fill="#4fc3e8" />
          <path d="M0,0 C-2,-14 2,-26 6,-34" stroke="#9c6b3c" strokeWidth={4} fill="none" strokeLinecap="round" />
          {[-60, -20, 20, 60, 160].map((a) => (
            <ellipse key={a} cx={6} cy={-34} rx={13} ry={4} fill="#2fa35c" transform={`rotate(${a} 6 -34) translate(10 0)`} />
          ))}
        </>
      );
    case "mesa":
      return (
        <>
          {shadow(36)}
          <polygon points="-38,0 -28,-30 26,-30 38,0" fill="#d9773f" />
          <polygon points="-28,-30 26,-30 22,-36 -24,-36" fill="#f0a35f" />
          <polygon points="-34,-12 34,-12 36,-6 -36,-6" fill="#c2622f" opacity={0.7} />
        </>
      );
    case "mountain":
      return (
        <>
          {shadow(50)}
          <polygon points="-58,0 -6,-84 58,0" fill="#7d74c9" />
          <polygon points="-6,-84 58,0 10,0" fill="#5d54a8" />
          <polygon points="-6,-84 -22,-58 -12,-62 -4,-54 6,-62 16,-56" fill="#fff" />
        </>
      );
    case "crystal":
      return (
        <>
          {shadow(9)}
          <polygon points="0,-20 6,-8 3,0 -3,0 -6,-8" fill="#8fe3ff" />
          <polygon points="0,-20 6,-8 3,0 0,-6" fill="#c9f3ff" />
          <polygon points="-8,-10 -4,-4 -6,0 -10,0 -11,-5" fill="#6fd0f5" />
        </>
      );
  }
}

const KIND_LIST: Kind[] = ["tree", "bush", "flowers", "pine", "mushroom", "log", "rock", "cactus", "dune", "palm", "mesa", "mountain", "snowpine", "crystal"];

function Castle() {
  return (
    <g transform={`translate(${CASTLE.x} ${CASTLE.y + 70})`}>
      <ellipse cx={0} cy={0} rx={95} ry={16} fill="rgb(0 0 0 / 0.25)" />
      <rect x={-70} y={-80} width={140} height={80} fill="#5a4a8c" />
      <rect x={-70} y={-80} width={140} height={10} fill="#6d5ca3" />
      {[-70, -50, -30, -10, 10, 30, 50].map((x) => (
        <rect key={x} x={x} y={-92} width={12} height={12} fill="#5a4a8c" />
      ))}
      {[-90, 60].map((x) => (
        <g key={x}>
          <rect x={x} y={-130} width={30} height={130} fill="#4a3c78" />
          <polygon points={`${x - 6},-130 ${x + 15},-172 ${x + 36},-130`} fill="#e8384f" />
          <rect x={x + 10} y={-110} width={10} height={16} rx={5} fill="#ffd23f" opacity={0.85} />
        </g>
      ))}
      <rect x={-18} y={-200} width={36} height={120} fill="#3d3068" />
      <polygon points="-26,-200 0,-250 26,-200" fill="#e8384f" />
      <rect x={-5} y={-180} width={10} height={16} rx={5} fill="#ffd23f" />
      <path d="M-22,0 v-34 a22,22 0 0 1 44,0 v34 Z" fill="#2a1a4f" />
      <path d="M0,-250 v-26" stroke="#3d3068" strokeWidth={3} />
      <path d="M0,-276 l22,7 -22,7 Z" fill="#ffd23f" />
    </g>
  );
}

function Sky() {
  const rnd = mulberry32(7);
  return (
    <>
      <rect x={0} y={0} width={W} height={SKY} fill="url(#wb-sky)" />
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={rnd() * W} cy={rnd() * 280} r={0.6 + rnd() * 1.3} fill="#fff" opacity={0.4 + rnd() * 0.6} />
      ))}
      <circle cx={70} cy={130} r={22} fill="#fff6d6" opacity={0.9} />
      <g transform={`translate(0 ${SKY - 330})`}>
        <path d="M0,330 L0,250 L40,200 L75,240 L120,170 L160,230 L200,190 L240,230 L285,160 L330,235 L365,195 L400,240 L400,330 Z" fill="#a49ce0" />
        <path d="M120,170 L105,192 L118,188 L128,198 L138,186 Z M285,160 L270,183 L283,180 L292,190 L302,178 Z" fill="#fff" />
        <path d="M0,330 L0,280 L60,250 L110,290 L170,260 L230,295 L290,262 L350,290 L400,270 L400,330 Z" fill="#c9c4f2" />
      </g>
    </>
  );
}

function River() {
  const y = (NODE_POS[6].y + NODE_POS[7].y) / 2;
  const bx = pathXAt(y);
  return (
    <>
      <path
        d={`M-10,${y - 6} C80,${y - 30} 150,${y + 22} 230,${y - 4} S360,${y - 26} 410,${y - 2} L410,${y + 26} C330,${y + 6} 280,${y + 40} 220,${y + 22} S70,${y - 2} -10,${y + 24} Z`}
        fill="#3fb5e8"
      />
      <path d={`M20,${y + 2} C70,${y - 10} 120,${y + 10} 160,${y + 4}`} stroke="#bdeeff" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d={`M260,${y + 6} C300,${y - 6} 340,${y + 2} 380,${y - 4}`} stroke="#bdeeff" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(${bx} ${y + 9})`}>
        <rect x={-24} y={-26} width={48} height={52} rx={4} fill="#9c6b3c" />
        {[-18, -6, 6, 18].map((dy) => (
          <rect key={dy} x={-24} y={dy - 2} width={48} height={3} fill="#7a4f28" />
        ))}
        <rect x={-27} y={-28} width={5} height={56} rx={2} fill="#6b4423" />
        <rect x={22} y={-28} width={5} height={56} rx={2} fill="#6b4423" />
      </g>
    </>
  );
}

function Pond({ x, y }: P) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={0} rx={44} ry={20} fill="#2f9ad6" />
      <ellipse cx={-2} cy={-2} rx={38} ry={15} fill="#4fc3e8" />
      <ellipse cx={-14} cy={-6} rx={10} ry={3} fill="#bdeeff" opacity={0.8} />
      <ellipse cx={14} cy={4} rx={6} ry={3} fill="#3fae4a" />
      <circle cx={16} cy={3} r={1.6} fill="#ff6b9a" />
    </g>
  );
}

function Terrain() {
  const { things, details } = scatter();
  const pondY = (NODE_POS[1].y + NODE_POS[2].y) / 2;
  const pondX = NODE_POS[1].x > 200 ? 70 : 330;
  const oasisY = (NODE_POS[11].y + NODE_POS[12].y) / 2;
  const oasisX = pathXAt(oasisY) > 200 ? 75 : 325;
  const stops = BOUNDARIES.flatMap((b, i) => {
    const lo = (H - (b + BLEND)) / H;
    const hi = (H - (b - BLEND)) / H;
    return [
      <stop key={`a${i}`} offset={lo} stopColor={GROUND[i][1]} />,
      <stop key={`b${i}`} offset={hi} stopColor={GROUND[i + 1][0]} />,
    ];
  });
  return (
    <svg className="bg-world-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="wb-ground" gradientUnits="userSpaceOnUse" x1={0} y1={H} x2={0} y2={0}>
          <stop offset={0} stopColor={GROUND[0][0]} />
          {stops}
          <stop offset={1} stopColor={GROUND[3][1]} />
        </linearGradient>
        <linearGradient id="wb-sky" x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#1b0f5c" />
          <stop offset={1} stopColor="#7b6fd6" />
        </linearGradient>
        <radialGradient id="wb-vignette" cx="50%" cy="50%" r="75%">
          <stop offset="70%" stopColor="rgb(0 0 0 / 0)" />
          <stop offset="100%" stopColor="rgb(0 0 0 / 0.22)" />
        </radialGradient>
        {KIND_LIST.map((k) => (
          <g key={k} id={`wb-${k}`}>
            {draw(k)}
          </g>
        ))}
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#wb-ground)" />
      <Sky />
      {details.map((d, i) =>
        d.region === 2 ? (
          <path key={i} d={`M${d.x - 7 * d.r},${d.y} q${7 * d.r},-${4 * d.r} ${14 * d.r},0`} stroke="#d99a4c" strokeWidth={1.4} fill="none" opacity={0.6} />
        ) : d.region === 3 ? (
          <circle key={i} cx={d.x} cy={d.y} r={1.4 * d.r} fill="#fff" opacity={0.8} />
        ) : (
          <path
            key={i}
            d={`M${d.x - 3 * d.r},${d.y} l${2 * d.r},-${5 * d.r} l${d.r},${5 * d.r} l${d.r},-${6 * d.r} l${2 * d.r},${6 * d.r}`}
            stroke={d.region === 0 ? "#4fae3f" : "#1f7044"}
            strokeWidth={1.4}
            fill="none"
            opacity={0.55}
          />
        ),
      )}
      <Pond x={pondX} y={pondY} />
      <River />
      <g transform={`translate(${oasisX} ${oasisY})`}>
        <use href="#wb-palm" />
      </g>
      <path d={SEGMENTS.map((s) => s.d).join(" ")} className="bg-world-road-edge" />
      <path d={SEGMENTS.map((s) => s.d).join(" ")} className="bg-world-road" />
      <path d={SEGMENTS.map((s) => s.d).join(" ")} className="bg-world-road-dash" />
      {things.map((t, i) => (
        <use key={i} href={`#wb-${t.kind}`} transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) scale(${(t.flip ? -t.s : t.s).toFixed(2)} ${t.s.toFixed(2)})`} />
      ))}
      <Castle />
      <rect x={0} y={0} width={W} height={H} fill="url(#wb-vignette)" pointerEvents="none" />
    </svg>
  );
}

// Static: draws once, never re-renders with game state.
export const WorldTerrain = memo(Terrain);
