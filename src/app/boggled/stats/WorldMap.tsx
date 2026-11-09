import { geoContains, geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

// Server-rendered world map: countries with players are lit, each place is a glowing dot sized by players.

type Point = { lat: number; lon: number; label: string; players: number };

const W = 960;
const H = 470;

const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const countries = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features.filter(
  (f) => f.properties.name !== "Antarctica",
);
const projection = geoEqualEarth().fitExtent(
  [
    [6, 6],
    [W - 6, H - 6],
  ],
  { type: "FeatureCollection", features: countries } as FeatureCollection,
);
const path = geoPath(projection).digits(0);
const outline = path({ type: "Sphere" }) ?? "";
const graticule = path(geoGraticule10()) ?? "";
const shapes = countries.map((f) => ({ f, d: path(f) ?? "" }));

function countryOf(p: Point, cache: Map<string, Feature<Geometry, { name: string }> | undefined>) {
  const k = `${p.lat},${p.lon}`;
  if (!cache.has(k)) cache.set(k, countries.find((f) => geoContains(f, [p.lon, p.lat])));
  return cache.get(k);
}

// Biggest places first; skip a label that would overlap one already placed.
function labelled<T extends { x: number; y: number; label: string; players: number }>(placed: T[], limit = 8) {
  const out: T[] = [];
  for (const p of placed) {
    if (out.length >= limit) break;
    const w = 9 * (p.label.split(",")[0].length + 4);
    if (out.some((q) => Math.abs(q.y - p.y) < 20 && p.x < q.x + 9 * (q.label.split(",")[0].length + 4) + 10 && q.x < p.x + w + 10)) continue;
    out.push(p);
  }
  return out;
}

export function WorldMap({ points }: { points: Point[] }) {
  const cache = new Map<string, Feature<Geometry, { name: string }> | undefined>();
  const lit = new Map<string, number>();
  for (const p of points) {
    const c = countryOf(p, cache);
    if (c) lit.set(c.properties.name, (lit.get(c.properties.name) ?? 0) + p.players);
  }
  const maxCountry = Math.max(1, ...lit.values());
  const maxPoint = Math.max(1, ...points.map((p) => p.players));
  const placed = points
    .map((p) => {
      const xy = projection([p.lon, p.lat]);
      return xy ? { ...p, x: xy[0], y: xy[1], r: 3.5 + 13 * Math.sqrt(p.players / maxPoint) } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.players - a.players);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="bg-world w-full" role="img" aria-label={`Map of ${points.length} player locations`}>
      <defs>
        <radialGradient id="dot-glow">
          <stop offset="0%" stopColor="#ffe680" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#ffd23f" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1d3fb0" />
          <stop offset="100%" stopColor="#140a5c" />
        </linearGradient>
      </defs>
      <path d={outline} fill="url(#sea)" stroke="rgb(255 255 255 / 0.18)" />
      <path d={graticule} fill="none" stroke="rgb(255 255 255 / 0.06)" />
      {shapes.map(({ f, d }) => {
        const n = lit.get(f.properties.name);
        return (
          <path
            key={f.properties.name}
            d={d}
            fill={n ? `rgb(61 220 132 / ${0.35 + 0.6 * Math.sqrt(n / maxCountry)})` : "rgb(255 255 255 / 0.13)"}
            stroke="rgb(20 8 70 / 0.8)"
            strokeWidth={0.6}
          >
            <title>{n ? `${f.properties.name}: ${n} players` : f.properties.name}</title>
          </path>
        );
      })}
      {placed.map((p, i) => (
        <g key={`${p.lat},${p.lon}`} className="bg-world-dot" style={{ animationDelay: `${(i % 12) * 120}ms` }}>
          <circle cx={p.x} cy={p.y} r={p.r * 2.4} fill="url(#dot-glow)" />
          <circle cx={p.x} cy={p.y} r={p.r * 0.55} fill="#fff6c8" stroke="#ffd23f" strokeWidth={1.5}>
            <title>{`${p.label}: ${p.players} players`}</title>
          </circle>
        </g>
      ))}
      {labelled(placed).map((p) => (
        <text key={`t${p.lat},${p.lon}`} x={p.x + p.r * 0.6 + 5} y={p.y + 5} fontSize="14" fontWeight="700" fill="#fff" stroke="#140a5c" strokeWidth="3" paintOrder="stroke">
          {`${p.label.split(",")[0]} · ${p.players}`}
        </text>
      ))}
    </svg>
  );
}
