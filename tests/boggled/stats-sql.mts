// Runs the analytics migrations in PGlite and checks the dashboard functions.
// Usage: npx tsx tests/boggled/stats-sql.mts
import assert from "node:assert/strict";
import { callRpc, seededDb, syntheticEvents } from "./stats-fixture.mjs";

type Insights = {
  players: number;
  retention: { day: number; eligible: number; on_day: number; within: number }[];
  active_days: { bucket: string; players: number }[];
  modes: { mode: string; players: number; repeat_players: number; return_players: number; rounds: number; ends: number; again: number }[];
  groups: { groups: number; avg_size: number; replayed: number; avg_secs: number | null; sizes: { size: number; groups: number }[] };
  invites: Record<string, number>;
  features: { key: string; players: number; uses: number }[];
  hours: { dow: number; hour: number; rounds: number }[];
};
type Places = { located: number; countries: { country: string; players: number }[]; points: { lat: number; lon: number; players: number }[] };

const rows = syntheticEvents();
const db = await seededDb(rows);
const players = new Set(rows.map((r) => r.player)).size;

const ins = (await callRpc(db, "boggled_insights", { days: 30, tz: "Asia/Bangkok" })) as Insights;
assert.equal(ins.players, players);
assert.ok(ins.retention.length >= 4, "retention has D1..D7 at least");
for (const r of ins.retention) {
  assert.ok(r.on_day <= r.within && r.within <= r.eligible, `retention D${r.day} is consistent`);
}
assert.ok(ins.retention.find((r) => r.day === 7)!.within > 0, "some players come back within a week");
assert.equal(ins.active_days.reduce((n, b) => n + b.players, 0), players, "active-day buckets cover everyone");
assert.equal(new Set(ins.active_days.map((b) => b.bucket)).size, ins.active_days.length, "each active-day bucket appears once");
assert.ok(ins.groups.avg_secs == null || ins.groups.avg_secs < 86_400, "room sessions are measured within a day");

const rooms = new Set(rows.filter((r) => r.event === "round_start" && r.props.room).map((r) => r.props.room));
assert.equal(ins.groups.groups, rooms.size, "one group per room code");
assert.ok(ins.groups.avg_size >= 2 && ins.groups.avg_size <= 8);
assert.equal(ins.groups.sizes.reduce((n, s) => n + s.groups, 0), rooms.size);

const story = ins.modes.find((m) => m.mode === "quick")!;
assert.ok(story.repeat_players <= story.players && story.again <= story.ends);
assert.ok(story.again > 0, "play-again rate is measured");

assert.equal(ins.features.length, 22, "every feature is listed, even unused ones");
const feat = Object.fromEntries(ins.features.map((f) => [f.key, f]));
assert.equal(feat.rename.players, 0, "unused features report zero");
assert.ok(feat.story.players > feat.survival.players);
assert.ok(feat.blast.uses > 0 && feat.invite.uses > 0 && feat.join_link.players > 0);

assert.equal(ins.hours.reduce((n, h) => n + h.rounds, 0), rows.filter((r) => r.event === "round_start").length);
assert.ok(ins.hours.every((h) => h.dow >= 1 && h.dow <= 7 && h.hour >= 0 && h.hour < 24));

const places = (await callRpc(db, "boggled_places", { days: 30 })) as Places;
assert.equal(places.located, players);
assert.equal(places.points.reduce((n, p) => n + p.players, 0), players);
assert.equal(places.countries.reduce((n, c) => n + c.players, 0), players);
assert.ok(places.countries.every((c, i, xs) => i === 0 || xs[i - 1].players >= c.players), "countries sorted by players");

const grants = await db.query<{ fn: string; anon: boolean; service: boolean }>(`
  select p.proname as fn,
    has_function_privilege('anon', p.oid, 'execute') as anon,
    has_function_privilege('service_role', p.oid, 'execute') as service
  from pg_proc p where p.proname in ('boggled_stats', 'boggled_places', 'boggled_insights', 'boggled_daily_rank')`);
for (const g of grants.rows) {
  if (g.fn === "boggled_daily_rank") assert.ok(g.anon, "daily rank stays public");
  else assert.ok(!g.anon && g.service, `${g.fn} is service_role only`);
}

console.log(`stats SQL ok: ${players} players, ${rooms.size} groups, ${ins.retention.map((r) => `D${r.day} ${r.within}/${r.eligible}`).join(" ")}`);
