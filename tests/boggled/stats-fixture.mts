// In-memory Postgres (PGlite) with the analytics migrations applied and a month of synthetic
// events, for testing the stats SQL and previewing the dashboard without touching Supabase.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const MIGRATIONS = ["20261030090000_boggled_analytics.sql", "20261109050000_boggled_private_stats.sql"];

const PLACES = [
  { country: "TH", region: "10", city: "Bangkok", lat: 13.8, lon: 100.5, w: 8 },
  { country: "TH", region: "50", city: "Chiang Mai", lat: 18.8, lon: 99, w: 2 },
  { country: "US", region: "CA", city: "Los Angeles", lat: 34.1, lon: -118.2, w: 5 },
  { country: "US", region: "NY", city: "New York", lat: 40.7, lon: -74, w: 4 },
  { country: "CA", region: "BC", city: "Vancouver", lat: 49.3, lon: -123.1, w: 4 },
  { country: "CA", region: "ON", city: "Toronto", lat: 43.7, lon: -79.4, w: 3 },
  { country: "GB", region: "ENG", city: "London", lat: 51.5, lon: -0.1, w: 3 },
  { country: "DE", region: "BE", city: "Berlin", lat: 52.5, lon: 13.4, w: 1 },
  { country: "AU", region: "NSW", city: "Sydney", lat: -33.9, lon: 151.2, w: 2 },
  { country: "BR", region: "SP", city: "São Paulo", lat: -23.5, lon: -46.6, w: 1 },
  { country: "PH", region: "00", city: "Manila", lat: 14.6, lon: 121, w: 2 },
  { country: "JP", region: "13", city: "Tokyo", lat: 35.7, lon: 139.7, w: 1 },
];

type Row = { player: string; session: string; event: string; screen: string | null; props: Record<string, unknown>; at: Date };

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

export function syntheticEvents(now = Date.now()): Row[] {
  const r = rng(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const weighted = () => {
    const total = PLACES.reduce((n, p) => n + p.w, 0);
    let x = r() * total;
    return PLACES.find((p) => (x -= p.w) < 0) ?? PLACES[0];
  };
  const rows: Row[] = [];
  const DAY = 86_400_000;
  let roomN = 0;
  for (let i = 0; i < 140; i++) {
    const player = `p_${String(i).padStart(6, "0")}`;
    const place = weighted();
    const first = now - Math.floor(r() * 28) * DAY - Math.floor(r() * 20) * 3_600_000;
    const visits = r() < 0.35 ? 1 + Math.floor(r() * 6) : 1;
    for (let v = 0; v < visits; v++) {
      const start = Math.min(now - 60_000, first + (v === 0 ? 0 : Math.floor(1 + r() * 9) * DAY));
      const session = `s_${String(i).padStart(4, "0")}_${v}`;
      let t = start;
      const add = (event: string, screen: string | null, props: Record<string, unknown> = {}) => {
        rows.push({ player, session, event, screen, props, at: new Date(t) });
        t += 5_000 + Math.floor(r() * 40_000);
      };
      add("session_start", null, { visit: v + 1, mobile: r() < 0.7, standalone: r() < 0.05, ref: pick(["", "", "google.com", "t.co", "reddit.com"]), country: place.country, region: place.region, city: place.city, lat: place.lat, lon: place.lon });
      add("screen", "home");
      if (r() < 0.12) continue;
      const mode = pick(["quick", "quick", "quick", "daily", "daily", "room", "room", "practice", "survival"]);
      if (r() < 0.25) add("howto", "home", { slide: 3, of: 5 });
      if (mode === "room") {
        const room = `R${(roomN++ % 40).toString(36).toUpperCase()}`;
        const size = pick([2, 3, 4, 4, 5, 6, 6, 6, 7, 8]);
        const host = r() < 0.4;
        if (host) {
          add("click", "home", { target: "create_room" });
          add("click", "lobby", { target: pick(["share_link", "share_link", "copy_code", "qr"]) });
          if (r() < 0.4) add("setting", "lobby", { key: "duration", value: pick(["60", "120", "180"]) });
        } else if (r() < 0.6) add("screen", "join_name");
        else add("click", "home", { target: "join_room" });
        const rounds = 1 + Math.floor(r() * r() * 9);
        for (let k = 0; k < rounds; k++) {
          add("round_start", "game", { mode, players: size, size: 4, duration: 120, host, room });
          if (r() < 0.3) add("attack", "game", { weapon: pick(["bomb", "flip"]) });
          if (r() < 0.5) add("react", "game");
          if (r() < 0.3) add("combo", "game");
          add("round_end", "results", { mode, players: size, score: Math.floor(r() * 60) });
          if (k < rounds - 1) add("click", "results", { target: "play_again" });
        }
      } else {
        const rounds = mode === "daily" ? 1 : 1 + Math.floor(r() * r() * 7);
        for (let k = 0; k < rounds; k++) {
          const level = 1 + Math.floor(r() * 9);
          add("round_start", "game", { mode, players: mode === "quick" || mode === "practice" ? 2 : 1, bot_level: mode === "quick" ? level : undefined });
          if (mode === "quick" && level >= 5 && r() < 0.3) add("attack", "game", { weapon: "blast", level });
          if (mode === "quick" && r() < 0.08) add("item", "game", { item: "time", level });
          add("round_end", "results", { mode, score: Math.floor(r() * 50), bot: pick(["win", "loss"]), bot_level: mode === "quick" ? level : undefined, first: mode === "daily" });
          if (mode === "quick" && r() < 0.3) add("click", "results", { target: "skip_reveal" });
          if (mode === "daily") add("click", "results", { target: "daily_collect" });
          if (k < rounds - 1) add("click", "results", { target: "rematch" });
        }
        if (mode === "quick" && r() < 0.15) add("buy", "intro_quick", { item: "time", price: 50 });
        if (mode === "quick" && r() < 0.05) add("ad_start", "intro_quick");
      }
      add("hide", "results", { in_round: false });
    }
  }
  return rows.filter((row) => row.at.getTime() <= now);
}

export async function seededDb(rows = syntheticEvents()) {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role;");
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const m of MIGRATIONS) await db.exec(readFileSync(new URL(m, dir), "utf8"));
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values = chunk.map((_, j) => `($${j * 6 + 1}, $${j * 6 + 2}, $${j * 6 + 3}, $${j * 6 + 4}, $${j * 6 + 5}::jsonb, $${j * 6 + 6}::timestamptz)`).join(",");
    await db.query(
      `insert into boggled_events (player, session, event, screen, props, at) values ${values}`,
      chunk.flatMap((row) => [row.player, row.session, row.event, row.screen, JSON.stringify(row.props), row.at.toISOString()]),
    );
  }
  return db;
}

export async function callRpc(db: PGlite, fn: string, args: Record<string, unknown>) {
  const names = Object.keys(args);
  const sql = `select public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`;
  const res = await db.query<{ r: unknown }>(sql, Object.values(args));
  return res.rows[0].r;
}
