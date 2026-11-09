import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Bars, Card, Chapter, Columns, Curve, Empty, Funnel, Heatmap, Hero, People, Ring, pct, ratio } from "./charts";
import { WorldMap } from "./WorldMap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Word Brawl stats",
  robots: { index: false, follow: false },
};

type Places = {
  located: number;
  countries: { country: string; players: number }[];
  cities: { city: string; region: string | null; country: string; players: number }[];
  points?: { lat: number; lon: number; label: string; players: number }[];
};

type Insights = {
  tz: string;
  players: number;
  retention: { day: number; eligible: number; on_day: number; within: number }[];
  active_days: { bucket: string; players: number }[];
  modes: { mode: string; players: number; repeat_players: number; return_players: number; rounds: number; ends: number; again: number }[];
  groups: {
    groups: number;
    avg_size: number | null;
    avg_rounds: number | null;
    replayed: number;
    marathon: number;
    returned: number;
    avg_secs: number | null;
    sizes: { size: number; groups: number }[];
    rounds_dist: { bucket: string; groups: number }[];
  };
  invites: { create_clicks: number; creators: number; share_link: number; copy_code: number; qr: number; joined_by_link: number; joined_by_code: number };
  features: { key: string; players: number; uses: number }[];
  hours: { dow: number; hour: number; rounds: number }[];
};

type Stats = {
  days: number;
  generated_at: string;
  players: number;
  sessions: number;
  rounds_started: number;
  rounds_finished: number;
  returning_players: number;
  avg_rounds_per_player: number | null;
  avg_rounds_per_session: number | null;
  median_session_secs: number | null;
  avg_session_secs: number | null;
  avg_play_secs_per_player: number | null;
  rounds_per_player: { bucket: string; players: number }[];
  funnel: { step: string; players: number }[];
  exits: { screen: string; sessions: number }[];
  daily: { day: string; players: number; rounds: number }[];
  modes: { mode: string; rounds: number; players: number; finished: number }[];
  room_settings: Record<string, Record<string, number> | null>;
  setting_changes: { key: string; value: string; n: number }[];
  clicks: { target: string; n: number; players: number }[];
  features: Record<string, number>;
  bot: { level: number; rounds: number; player_wins: number }[];
  survival: { rounds: number; avg_survived_secs: number | null; best_survived_secs: number | null };
  daily_puzzle: { plays: number; first_plays: number; avg_first_score: number | null };
  referrers: { ref: string; sessions: number }[];
  devices: { mobile: number; desktop: number; installed: number };
};

const SCREENS: Record<string, string> = {
  home: "Home menu",
  friends: "Play with friends menu",
  join_code: "Typing a room code",
  join_name: "Entering name to join",
  intro_quick: "Story map",
  intro_practice: "Practice intro",
  intro_daily: "Daily Puzzle intro",
  intro_survival: "Survival intro",
  lobby: "Room lobby",
  game: "Mid-round",
  results: "Results",
  unknown: "Before the app loaded",
};

const MODES: Record<string, { label: string; color: string }> = {
  quick: { label: "🗺️ Story", color: "#ffd23f" },
  daily: { label: "📅 Daily Puzzle", color: "#5fb8ff" },
  room: { label: "🎉 Rooms", color: "#ff7ac6" },
  practice: { label: "🎯 Practice", color: "#3ddc84" },
  survival: { label: "⏳ Survival", color: "#ffa62b" },
};

const FEATURES: Record<string, string> = {
  story: "🗺️ Story",
  daily: "📅 Daily Puzzle",
  rooms: "🎉 Rooms with friends",
  practice: "🎯 Practice",
  survival: "⏳ Survival",
  create_room: "➕ Created a room",
  join_link: "🔗 Joined by invite link",
  invite: "📣 Invited friends",
  rematch: "🔁 Rematch / play again",
  howto: "❓ How to play",
  attack: "💣 Bomb & flip attacks",
  combo: "⚡ Combos",
  react: "😂 Reactions",
  blast: "💥 Word Blast",
  shop: "🛒 Bought in the shop",
  item: "🎒 Used an item",
  ad: "📺 Watched an ad",
  daily_collect: "🎁 Collected daily reward",
  skip_reveal: "⏭️ Skipped the reveal",
  room_settings: "⚙️ Changed room settings",
  rename: "✏️ Renamed themselves",
  installed: "📱 Opened from home screen",
};

const SETTING_LABELS: Record<string, string> = {
  size: "Board",
  duration: "Timer (s)",
  no_chill: "No chill",
  series: "Match (0 = continuous)",
  min: "Shortest word",
  players: "Players per round",
};

// Server-only secret key: the stats functions are locked to service_role once the private-stats
// migration runs. Falls back to the public key until then.
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<{ data: T } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { error: "Supabase isn't configured for this deployment." };
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (res.ok) return { data: await res.json() };
    if (res.status === 404) return { error: "missing" };
    if ((res.status === 401 || res.status === 403) && !SECRET_KEY) return { error: "secret" };
    return { error: `Supabase returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (e) {
    return { error: String(e) };
  }
}

const ok = <T,>(r: { data: T } | { error: string }) => ("data" in r ? r.data : null);

function duration(secs: number | null | undefined) {
  if (secs == null) return "—";
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ${Math.round(secs % 60)}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const flag = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "🏳️");

const countryName = (() => {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  return (cc: string) => {
    try {
      return names.of(cc) ?? cc;
    } catch {
      return cc;
    }
  };
})();

function roomSize(players: Record<string, number> | null | undefined) {
  const rows = Object.entries(players ?? {});
  const rounds = rows.reduce((n, [, c]) => n + c, 0);
  if (!rounds) return null;
  return { avg: rows.reduce((n, [k, c]) => n + Number(k) * c, 0) / rounds, rounds };
}

function Setup({ error }: { error: string }) {
  return (
    <div className="bg-panel flex flex-col gap-3 p-4 text-sm">
      <h2 className="bg-title text-xl">Analytics isn&apos;t set up yet</h2>
      {error === "secret" ? (
        <p>
          The stats are locked to the server&apos;s secret key. Add <code>SUPABASE_SECRET_KEY</code> (Supabase → Project Settings → API Keys → secret key) to
          the Vercel project&apos;s environment variables and redeploy.
        </p>
      ) : error === "missing" ? (
        <>
          <p>The game is ready to send events, but the database table doesn&apos;t exist yet. Run the migration once:</p>
          <ol className="ml-5 list-decimal space-y-1">
            <li>Open the Supabase project → SQL editor.</li>
            <li>
              Paste <code>supabase/migrations/20261030090000_boggled_analytics.sql</code> and run it (or run <code>supabase db push</code>).
            </li>
            <li>Play a round, wait ~15 seconds, then reload this page.</li>
          </ol>
        </>
      ) : (
        <p>{error}</p>
      )}
    </div>
  );
}

const NEEDS_MIGRATION = "Run supabase/migrations/20261109050000_boggled_private_stats.sql in the Supabase SQL editor to unlock this.";

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: raw } = await searchParams;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  const [res, places, insights] = await Promise.all([
    rpc<Stats>("boggled_stats", { days }),
    rpc<Places>("boggled_places", { days }),
    rpc<Insights>("boggled_insights", { days, tz: "Asia/Bangkok" }),
  ]);

  return (
    <main className="bg-stats mx-auto flex max-w-6xl flex-col gap-4 p-4 pb-16">
      <header className="bg-stats-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="bg-title text-4xl md:text-5xl">Word Brawl stats</h1>
          <p className="text-sm opacity-75">Private dashboard · anonymous gameplay analytics · last {days} days</p>
        </div>
        <nav className="flex gap-2" aria-label="Date range">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`?days=${d}`} className="bg-chip px-3 py-1.5 text-sm" aria-pressed={d === days}>
              {d} days
            </Link>
          ))}
        </nav>
      </header>

      {"error" in res ? <Setup error={res.error} /> : <Dashboard s={res.data} places={ok(places)} ins={ok(insights)} />}
    </main>
  );
}

function Dashboard({ s, places, ins }: { s: Stats; places: Places | null; ins: Insights | null }) {
  const hostRooms = roomSize(s.room_settings.players);
  const g = ins?.groups;
  const avgRoom = g?.groups ? g.avg_size : hostRooms ? Math.round(hostRooms.avg * 10) / 10 : null;
  const mobileShare = pct(s.devices.mobile, s.devices.mobile + s.devices.desktop);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Hero label="Players" value={s.players} hint={`${s.sessions} visits · ${mobileShare} on phones`} spark={s.daily.map((d) => d.players)} color="#5fb8ff" />
        <Hero
          label="Rounds"
          value={s.rounds_started}
          hint={`${s.avg_rounds_per_player ?? "—"} per player`}
          spark={s.daily.map((d) => d.rounds)}
          color="#ffd23f"
        />
        <Hero label="Came back" value={pct(s.returning_players, s.players)} hint={`${s.returning_players} played on 2+ days`} color="#3ddc84" />
        <Hero label="Median visit" value={duration(s.median_session_secs)} hint={`play time ${duration(s.avg_play_secs_per_player)} / player`} color="#ff7ac6" />
        <Hero label="Avg group" value={avgRoom ?? "—"} hint={g?.groups ? `${g.groups} rooms played` : hostRooms ? `players per room round` : "no rooms yet"} color="#ffa62b" />
        <Hero label="Countries" value={places ? places.countries.length : "—"} hint={places ? `${places.located} players located` : "needs migration"} color="#b48cff" />
      </div>

      <Features ins={ins} s={s} />
      <Replay ins={ins} s={s} />
      <Groups ins={ins} s={s} hostRooms={hostRooms} />
      <Where places={places} s={s} />
      <When ins={ins} s={s} />
      <Detail s={s} />

      <p className="text-center text-xs opacity-60">
        Updated {new Date(s.generated_at).toLocaleString("en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })} Bangkok time. Add
        ?notrack=1 to the game URL once to stop counting your own device.
      </p>
    </>
  );
}

function Features({ ins, s }: { ins: Insights | null; s: Stats }) {
  if (!ins) {
    return (
      <>
        <Chapter icon="🏆" title="Top & least-used features" sub="Share of players who used each feature at least once." />
        <Empty>{NEEDS_MIGRATION}</Empty>
      </>
    );
  }
  const total = Math.max(1, ins.players);
  const ranked = ins.features.map((f) => ({ ...f, share: f.players / total })).sort((a, b) => b.players - a.players || b.uses - a.uses);
  const top = ranked.slice(0, 6);
  const bottom = ranked.slice(-6).reverse();
  const medal = ["🥇", "🥈", "🥉"];
  return (
    <>
      <Chapter icon="🏆" title="Top & least-used features" sub={`Share of the ${ins.players} players who used each feature at least once.`} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Most popular" accent="#3ddc84">
          <ol className="flex flex-col gap-2.5">
            {top.map((f, i) => (
              <li key={f.key} className="bg-rank flex items-center gap-3" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="w-8 text-center text-2xl">{medal[i] ?? <span className="text-base opacity-60">{i + 1}</span>}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{FEATURES[f.key] ?? f.key}</span>
                    <span className="tabular-nums">
                      {Math.round(f.share * 100)}% <span className="text-xs opacity-60">· {f.uses} uses</span>
                    </span>
                  </div>
                  <span className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <span className="bg-bar block h-full rounded-full bg-[#3ddc84]" style={{ width: `${f.share * 100}%` }} />
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Least used" why="Hidden, broken, or not worth it? Candidates to promote, fix or cut." accent="#ff4d6d">
          <ol className="flex flex-col gap-2.5">
            {bottom.map((f, i) => (
              <li key={f.key} className="bg-rank flex items-center gap-3" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="w-8 text-center text-xl">{f.players === 0 ? "🪦" : "🥶"}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{FEATURES[f.key] ?? f.key}</span>
                    <span className="tabular-nums">{f.players === 0 ? <span className="text-[#ff8da1]">never used</span> : `${Math.max(1, Math.round(f.share * 100))}%`}</span>
                  </div>
                  <span className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <span className="bg-bar block h-full rounded-full bg-[#ff4d6d]" style={{ width: `${Math.max(f.players ? 2 : 0, f.share * 100)}%` }} />
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <details className="bg-stat-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">All {ranked.length} features · {s.clicks.reduce((n, c) => n + c.n, 0)} button presses</summary>
        <div className="mt-3">
          <Bars
            rows={ranked.map((f) => ({ key: f.key, label: FEATURES[f.key] ?? f.key, value: f.players, display: pct(f.players, total), note: `${f.players}p · ${f.uses}×` }))}
            color="linear-gradient(90deg, #5fb8ff, #3ddc84)"
          />
        </div>
      </details>
    </>
  );
}

function Replay({ ins, s }: { ins: Insights | null; s: Stats }) {
  const curve = (ins?.retention ?? []).map((r) => ({ label: `Day ${r.day}`, value: ratio(r.within, r.eligible), sub: `${r.within}/${r.eligible}` }));
  const modes = (ins?.modes ?? []).filter((m) => m.players > 0);
  return (
    <>
      <Chapter icon="🔁" title="Replayability" sub="Do people come back, and do they hit “play again”?" />
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card title="Came back within…" why="Of new players, the share who returned on any later day within N days (UTC)." accent="#3ddc84">
          {ins ? <Curve points={curve} /> : <Empty>{NEEDS_MIGRATION}</Empty>}
        </Card>
        <Card title="Days played" why="One-day visitors vs regulars, in this window.">
          {ins ? (
            <Bars rows={ins.active_days.map((d) => ({ label: d.bucket, value: d.players, note: pct(d.players, ins.players) }))} color="linear-gradient(90deg, #3ddc84, #ffd23f)" />
          ) : (
            <Bars rows={s.rounds_per_player.map((r) => ({ label: `${r.bucket} rounds`, value: r.players }))} />
          )}
        </Card>
      </div>
      <Card title="Stickiness by mode" why="Play again = a finished round followed by another in the same visit. Back another day = played that mode on 2+ days.">
        {ins ? (
          modes.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {modes.map((m) => {
                const meta = MODES[m.mode] ?? { label: m.mode, color: "#fff" };
                return (
                  <div key={m.mode} className="bg-mode-tile flex flex-col items-center gap-2 rounded-2xl p-3" style={{ "--accent": meta.color } as CSSProperties}>
                    <div className="text-base font-bold">{meta.label}</div>
                    <Ring value={ratio(m.again, m.ends)} label="play again" color={meta.color} size={88} />
                    <div className="grid w-full grid-cols-2 gap-1 text-center text-xs">
                      <div>
                        <div className="text-lg font-bold tabular-nums">{pct(m.return_players, m.players)}</div>
                        <div className="opacity-65">back another day</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold tabular-nums">{(m.rounds / Math.max(1, m.players)).toFixed(1)}</div>
                        <div className="opacity-65">rounds / player</div>
                      </div>
                    </div>
                    <div className="text-[11px] opacity-55">
                      {m.players} players · {m.rounds} rounds
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>No rounds yet</Empty>
          )
        ) : (
          <Bars rows={s.modes.map((m) => ({ label: MODES[m.mode]?.label ?? m.mode, value: m.rounds, note: `${(m.rounds / Math.max(1, m.players)).toFixed(1)}/player` }))} />
        )}
      </Card>
    </>
  );
}

function Groups({ ins, s, hostRooms }: { ins: Insights | null; s: Stats; hostRooms: { avg: number; rounds: number } | null }) {
  const g = ins?.groups;
  const inv = ins?.invites;
  const hostSizes = Object.entries(s.room_settings.players ?? {})
    .map(([k, n]) => ({ size: Number(k), groups: n }))
    .sort((a, b) => a.size - b.size);
  const sizes = g?.groups ? g.sizes : hostSizes;
  const maxSize = Math.max(1, ...sizes.map((x) => x.groups));
  return (
    <>
      <Chapter icon="🎉" title="Groups" sub="Rooms with friends: how big, how long they keep playing, and how invites spread." />
      {g?.groups ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Hero label="Rooms played" value={g.groups} hint={`${g.avg_rounds ?? "—"} rounds each on average`} color="#ff7ac6" />
          <Hero label="Played 2+ rounds" value={pct(g.replayed, g.groups)} hint={`${g.marathon} rooms went 5+ rounds`} color="#ffd23f" />
          <Hero label="Same room, another day" value={pct(g.returned, g.groups)} hint={`${g.returned} rooms`} color="#3ddc84" />
          <Hero label="Room session" value={duration(g.avg_secs)} hint="first to last round, rooms with 2+" color="#5fb8ff" />
        </div>
      ) : (
        <Empty>
          {ins
            ? "Room-level stats start with this release (rounds are now tagged with their room). Sizes below are from host-reported rounds so far."
            : NEEDS_MIGRATION}
        </Empty>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Group size" why={g?.groups ? "Biggest headcount seen in each room." : `Players per room round, as reported by hosts (${hostRooms?.rounds ?? 0} rounds).`} accent="#ff7ac6">
          {sizes.length ? (
            <div className="flex flex-col gap-2">
              {sizes.map((x) => (
                <div key={x.size} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm">
                  <span className="font-bold tabular-nums">{x.size}</span>
                  <span className="flex items-center gap-2">
                    <span className="bg-bar h-6 rounded-lg bg-gradient-to-r from-[#ff7ac6] to-[#ffa62b]" style={{ width: `${Math.max(4, (x.groups / maxSize) * 70)}%` }} />
                    <People n={x.size} max={8} />
                  </span>
                  <span className="tabular-nums opacity-80">{x.groups}</span>
                </div>
              ))}
              <p className="text-xs opacity-65">
                Average {g?.groups ? g.avg_size : hostRooms ? hostRooms.avg.toFixed(1) : "—"} players
              </p>
            </div>
          ) : (
            <Empty>No room rounds yet</Empty>
          )}
        </Card>
        <Card title="Invites" why="From “Create room” to friends arriving." accent="#ffd23f">
          {inv ? (
            <>
              <div className="flex items-center gap-3">
                <div className="bg-invite-burst flex flex-col items-center rounded-2xl px-4 py-3">
                  <span className="bg-hero-value" style={{ "--accent": "#ffd23f" } as CSSProperties}>
                    {inv.creators ? ((inv.joined_by_link + inv.joined_by_code) / inv.creators).toFixed(1) : "—"}
                  </span>
                  <span className="text-xs opacity-75">friends join per host</span>
                </div>
                <p className="text-sm opacity-80">
                  {inv.creators} people created a room and shared {inv.share_link + inv.copy_code + inv.qr} invites. {inv.joined_by_link + inv.joined_by_code} friends
                  joined: {inv.joined_by_link} by link, {inv.joined_by_code} by typing the code.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
                {[
                  ["➕", "Rooms created", inv.create_clicks],
                  ["🔗", "Links shared", inv.share_link],
                  ["📋", "Codes copied", inv.copy_code],
                  ["🔳", "QR shown", inv.qr],
                  ["🙋", "Friends joined", inv.joined_by_link + inv.joined_by_code],
                ].map(([icon, label, n]) => (
                  <div key={label as string} className="rounded-xl bg-white/8 p-2">
                    <div className="text-xl">{icon}</div>
                    <div className="text-lg font-bold tabular-nums">{n}</div>
                    <div className="opacity-65">{label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Bars
              rows={s.clicks
                .filter((c) => ["create_room", "join_room", "share_link", "copy_code", "qr"].includes(c.target))
                .map((c) => ({ label: c.target.replaceAll("_", " "), value: c.n, note: `${c.players}p` }))}
            />
          )}
        </Card>
      </div>
      {g?.groups ? (
        <Card title="Rounds per room" why="One-and-done rooms vs game nights.">
          <Columns rows={g.rounds_dist.map((b) => ({ label: b.bucket, value: b.groups }))} color="linear-gradient(180deg, #ff7ac6, #7a3cff)" height={110} />
        </Card>
      ) : null}
    </>
  );
}

function Where({ places, s }: { places: Places | null; s: Stats }) {
  const points = places?.points ?? [];
  const maxCountry = Math.max(1, ...(places?.countries ?? []).map((c) => c.players));
  return (
    <>
      <Chapter icon="🌍" title="Where players are" sub="From the visitor's IP at Vercel's edge, rounded to ~10 km. The IP itself is never stored. Each player counts once." />
      {places ? (
        <>
          <Card className="bg-world-card overflow-hidden p-0 md:p-0">
            {points.length ? (
              <WorldMap points={points} />
            ) : (
              <div className="p-4">
                <Empty>The map fills in as new visitors arrive (location tracking started Nov 9).</Empty>
              </div>
            )}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Countries" accent="#3ddc84">
              {places.countries.length ? (
                <div className="flex flex-col gap-2">
                  {places.countries.slice(0, 12).map((c, i) => (
                    <div key={c.country} className="bg-rank grid grid-cols-[2.2rem_minmax(0,9rem)_1fr_auto] items-center gap-2 text-sm" style={{ animationDelay: `${i * 40}ms` }}>
                      <span className="text-2xl leading-none">{flag(c.country)}</span>
                      <span className="truncate font-semibold">{countryName(c.country)}</span>
                      <span className="h-3 overflow-hidden rounded-full bg-white/10">
                        <span className="bg-bar block h-full rounded-full bg-gradient-to-r from-[#3ddc84] to-[#5fb8ff]" style={{ width: `${(c.players / maxCountry) * 100}%` }} />
                      </span>
                      <span className="tabular-nums">
                        {c.players} <span className="text-xs opacity-60">{pct(c.players, places.located)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>No located visitors yet</Empty>
              )}
            </Card>
            <Card title="Top cities" accent="#ffd23f">
              <Bars
                rows={places.cities.slice(0, 12).map((c) => ({ key: `${c.city}${c.country}`, label: `${flag(c.country)} ${c.city}`, value: c.players }))}
                color="linear-gradient(90deg, #ffd23f, #ffa62b)"
                empty="No cities yet"
              />
            </Card>
          </div>
        </>
      ) : (
        <Empty>{NEEDS_MIGRATION}</Empty>
      )}
      <Card title="How they found the game" why="Referrer of each visit. “direct” = typed, bookmarked or shared in a chat app.">
        <Bars rows={s.referrers.map((r) => ({ label: r.ref, value: r.sessions, note: pct(r.sessions, s.sessions) }))} color="linear-gradient(90deg, #b48cff, #5fb8ff)" />
      </Card>
    </>
  );
}

function When({ ins, s }: { ins: Insights | null; s: Stats }) {
  return (
    <>
      <Chapter icon="⏰" title="When people play" sub="Rounds started by weekday and hour (Bangkok time), and per day." />
      <div className="grid gap-4">
        <Card title="Weekly rhythm">{ins ? <Heatmap cells={ins.hours} /> : <Empty>{NEEDS_MIGRATION}</Empty>}</Card>
        <Card title="Per day" why="Rounds per UTC day (hover for players).">
          <Columns rows={s.daily.map((d) => ({ label: d.day.slice(5), value: d.rounds, title: `${d.day}: ${d.players} players, ${d.rounds} rounds` }))} color="linear-gradient(180deg, #ffd23f, #ff8a00)" />
        </Card>
      </div>
    </>
  );
}

function Detail({ s }: { s: Stats }) {
  const opened = s.funnel[0]?.players ?? 0;
  const sessionsTotal = s.exits.reduce((n, e) => n + e.sessions, 0);
  return (
    <details className="bg-stat-card mt-6 p-4">
      <summary className="bg-title cursor-pointer text-xl">🔬 More detail</summary>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Funnel" why="How far people get. The biggest drop is the next thing to fix.">
          <Funnel steps={s.funnel.map((f) => ({ label: f.step, value: f.players }))} />
          <p className="text-xs opacity-60">{opened} opened the game</p>
        </Card>
        <Card title="Where people leave" why="The screen each visit ended on.">
          <Bars rows={s.exits.map((e) => ({ label: SCREENS[e.screen] ?? e.screen, value: e.sessions, note: pct(e.sessions, sessionsTotal) }))} />
        </Card>
        <Card title="Story difficulty" why="Player win rate per level. Aim for ~80% at level 1 sloping to ~30% at the level 20 boss.">
          <Columns
            rows={s.bot.map((b) => ({ label: `L${b.level}`, value: Math.round(ratio(b.player_wins, b.rounds) * 100), title: `Level ${b.level}: ${pct(b.player_wins, b.rounds)} of ${b.rounds} rounds won` }))}
            color="linear-gradient(180deg, #3ddc84, #1f8fe8)"
            unit="% wins"
            height={110}
          />
        </Card>
        <Card title="Survival & Daily">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["⏳ Survival runs", s.survival.rounds],
              ["⏳ Avg survived", duration(s.survival.avg_survived_secs)],
              ["⏳ Longest run", duration(s.survival.best_survived_secs)],
              ["📅 Daily plays", s.daily_puzzle.plays],
              ["📅 First plays", s.daily_puzzle.first_plays],
              ["📅 Avg first score", s.daily_puzzle.avg_first_score ?? "—"],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-white/8 p-2">
                <div className="text-xs opacity-65">{k}</div>
                <div className="text-lg font-bold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Room settings in play" why="What hosts pick when they start a round with friends.">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(s.room_settings).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 font-semibold opacity-80">{SETTING_LABELS[k] ?? k}</div>
                {v ? (
                  Object.entries(v)
                    .sort((a, b) => b[1] - a[1])
                    .map(([val, n]) => (
                      <div key={val} className="flex justify-between">
                        <span>{val}</span>
                        <span className="tabular-nums opacity-80">{n}</span>
                      </div>
                    ))
                ) : (
                  <div className="opacity-60">—</div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Buttons people press" why="“p” = unique players.">
          <Bars rows={s.clicks.map((c) => ({ label: c.target.replaceAll("_", " "), value: c.n, note: `${c.players}p` }))} />
        </Card>
        <Card title="In-game extras">
          <Bars
            rows={[
              { label: "💣 Attacks", value: s.features.attacks },
              { label: "⚡ Combos", value: s.features.combos },
              { label: "😂 Reactions", value: s.features.reactions },
              { label: "❓ How to play opened", value: s.features.howto_opens },
              { label: "… read to the end", value: s.features.howto_finished },
            ]}
          />
        </Card>
        <Card title="Host setting changes" why="Toggles hosts touch in the lobby (every tap).">
          <Bars rows={s.setting_changes.map((c) => ({ label: `${c.key} → ${c.value}`, value: c.n }))} />
        </Card>
      </div>
    </details>
  );
}
