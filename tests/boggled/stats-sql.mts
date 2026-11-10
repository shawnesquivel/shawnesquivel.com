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

type Visits = { visitors: number; visits: number; repeat_days: number; player_days: number; daily: { day: string; visitors: number; visits: number }[]; per_visitor: { bucket: string; players: number }[] };
const visits = (await callRpc(db, "boggled_visits", { days: 30, tz: "Asia/Bangkok" })) as Visits;
assert.equal(visits.visitors, players, "every player is a visitor");
assert.ok(visits.visits >= new Set(rows.map((r) => r.session)).size, "at least one visit per tab session");
assert.ok(visits.daily.every((d) => d.visits >= d.visitors), "visits per day ≥ unique visitors per day");
assert.equal(visits.per_visitor.reduce((n, b) => n + b.players, 0), players, "visit buckets cover everyone");
assert.ok(visits.repeat_days <= visits.player_days);

// Same tab, back 3 hours later = a second visit; 10 minutes later = the same visit.
const vdb = await seededDb([]);
const t0 = Date.now() - 86_400_000;
for (const [mins, session] of [[0, "s_tab001"], [10, "s_tab001"], [190, "s_tab001"], [195, "s_tab002"]] as const) {
  await vdb.query("insert into boggled_events (player, session, event, screen, props, at) values ('p_visit1', $1, 'screen', 'home', '{}', $2)", [session, new Date(t0 + mins * 60_000).toISOString()]);
}
const one = (await callRpc(vdb, "boggled_visits", { days: 7, tz: "UTC" })) as Visits;
assert.equal(one.visitors, 1);
assert.equal(one.visits, 3, "30-minute gaps and new tabs start new visits");

type Acq = {
  sessions: number;
  channels: { channel: string; sessions: number; played: number }[];
  sources: { source: string; sessions: number }[];
  campaigns: { source: string; medium: string | null; campaign: string | null; sessions: number }[];
  landings: { landing: string; sessions: number; played: number }[];
  articles: { slug: string; views: number; readers: number; clicked: number; played: number }[];
};
const acq = (await callRpc(db, "boggled_acquisition", { days: 30 })) as Acq;
assert.equal(acq.channels.reduce((n, c) => n + c.sessions, 0), acq.sessions, "channels cover every session");
assert.ok(acq.channels.some((c) => c.channel === "search") && acq.channels.some((c) => c.channel === "social"), "google is search, reddit/t.co are social");

// Hand-built: a Google visitor reads a guide and plays, an invite-link guest plays, a direct visitor bounces.
const adb = await seededDb([]);
const at = (m: number) => new Date(Date.now() - 3_600_000 + m * 60_000).toISOString();
const ins_ = (player: string, session: string, event: string, props: object, m: number) =>
  adb.query("insert into boggled_events (player, session, event, screen, props, at) values ($1, $2, $3, null, $4, $5)", [player, session, event, JSON.stringify(props), at(m)]);
await ins_("p_search01", "s_search01", "session_start", { ref: "www.google.com", landing: "/boggle-rules" }, 0);
await ins_("p_search01", "s_search01", "article_view", { slug: "boggle-rules" }, 1);
await ins_("p_search01", "s_search01", "article_read", { slug: "boggle-rules" }, 2);
await ins_("p_search01", "s_search01", "article_cta", { slug: "boggle-rules", target: "play" }, 3);
await ins_("p_search01", "s_search01", "round_start", { mode: "room" }, 4);
await ins_("p_invite01", "s_invite01", "session_start", { ref: "", utm: "invite", utm_medium: "qr", landing: "/" }, 5);
await ins_("p_invite01", "s_invite01", "round_start", { mode: "room" }, 6);
await ins_("p_direct01", "s_direct01", "session_start", { ref: "" }, 7);
const a1 = (await callRpc(adb, "boggled_acquisition", { days: 7 })) as Acq;
const ch = Object.fromEntries(a1.channels.map((c) => [c.channel, c]));
assert.equal(ch.search.sessions, 1);
assert.equal(ch.search.played, 1, "search visit that played counts as played");
assert.equal(ch.invite.played, 1, "utm_source=invite is its own channel");
assert.equal(ch.direct.played, 0);
assert.deepEqual(a1.campaigns[0], { source: "invite", medium: "qr", campaign: null, sessions: 1, played: 1 });
assert.deepEqual(a1.articles, [{ slug: "boggle-rules", views: 1, readers: 1, clicked: 1, played: 1 }]);
assert.equal(a1.landings.find((l) => l.landing === "/boggle-rules")!.played, 1, "landing page tracked with outcome");

const grants = await db.query<{ fn: string; anon: boolean; service: boolean }>(`
  select p.proname as fn,
    has_function_privilege('anon', p.oid, 'execute') as anon,
    has_function_privilege('service_role', p.oid, 'execute') as service
  from pg_proc p where p.proname in ('boggled_stats', 'boggled_places', 'boggled_insights', 'boggled_visits', 'boggled_acquisition', 'boggled_daily_rank')`);
for (const g of grants.rows) {
  if (g.fn === "boggled_daily_rank") assert.ok(g.anon, "daily rank stays public");
  else assert.ok(!g.anon && g.service, `${g.fn} is service_role only`);
}

console.log(`stats SQL ok: ${players} players, ${rooms.size} groups, ${ins.retention.map((r) => `D${r.day} ${r.within}/${r.eligible}`).join(" ")}`);
