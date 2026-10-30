import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Word Brawl stats",
  robots: { index: false, follow: false },
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
  join_code: "Typing a room code",
  join_name: "Entering name to join",
  intro_quick: "Quick Start intro",
  intro_daily: "Daily Puzzle intro",
  intro_survival: "Survival intro",
  lobby: "Room lobby",
  game: "Mid-round",
  results: "Results",
  unknown: "Before the app loaded",
};

const MODES: Record<string, string> = {
  quick: "⚡ Quick Start (vs Dr. Hoot)",
  daily: "📅 Daily Puzzle",
  survival: "⏳ Survival",
  room: "🎉 Rooms with friends",
};

const SETTING_LABELS: Record<string, string> = {
  size: "Board",
  duration: "Timer (s)",
  no_chill: "No chill",
  series: "Match (0 = continuous)",
  min: "Shortest word",
  players: "Players per round",
};

async function loadStats(days: number): Promise<{ stats: Stats } | { error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { error: "Supabase isn't configured for this deployment." };
  try {
    const res = await fetch(`${url}/rest/v1/rpc/boggled_stats`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
      cache: "no-store",
    });
    if (!res.ok) return { error: res.status === 404 ? "missing" : `Supabase returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { stats: await res.json() };
  } catch (e) {
    return { error: String(e) };
  }
}

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

function duration(secs: number | null | undefined) {
  if (secs == null) return "—";
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ${Math.round(secs % 60)}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="bg-panel flex flex-col gap-0.5 px-4 py-3">
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="bg-title text-3xl">{value}</div>
      {hint && <div className="text-xs opacity-70">{hint}</div>}
    </div>
  );
}

function Section({ title, why, children }: { title: string; why: string; children: ReactNode }) {
  return (
    <section className="bg-panel flex flex-col gap-3 p-4">
      <div>
        <h2 className="bg-title text-xl">{title}</h2>
        <p className="text-sm opacity-75">{why}</p>
      </div>
      {children}
    </section>
  );
}

function Bars({ rows, empty = "No data yet" }: { rows: { label: string; value: number; note?: string }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm opacity-60">{empty}</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-2 text-sm">
          <span className="truncate" title={r.label}>
            {r.label}
          </span>
          <span className="h-3 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-[var(--gold)]" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="tabular-nums">
            {r.value}
            {r.note && <span className="ml-1 opacity-60">{r.note}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  if (!rows.length) return <p className="text-sm opacity-60">No data yet</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left opacity-70">
            {head.map((h, i) => (
              <th key={i} className="pb-1 pr-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Setup({ error }: { error: string }) {
  return (
    <div className="bg-panel flex flex-col gap-3 p-4 text-sm">
      <h2 className="bg-title text-xl">Analytics isn&apos;t set up yet</h2>
      {error === "missing" ? (
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

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: raw } = await searchParams;
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  const res = await loadStats(days);

  return (
    <main className="bg-stats mx-auto flex max-w-5xl flex-col gap-4 p-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="bg-title text-3xl">Word Brawl stats</h1>
          <p className="text-sm opacity-75">Anonymous gameplay analytics. Times in UTC.</p>
        </div>
        <nav className="flex gap-2" aria-label="Date range">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`?days=${d}`} className="bg-chip px-3 py-1.5 text-sm" aria-pressed={d === days}>
              Last {d} days
            </Link>
          ))}
        </nav>
      </header>

      {"error" in res ? <Setup error={res.error} /> : <Dashboard s={res.stats} />}
    </main>
  );
}

function Dashboard({ s }: { s: Stats }) {
  const opened = s.funnel[0]?.players ?? 0;
  const sessionsTotal = s.exits.reduce((n, e) => n + e.sessions, 0);
  const totalClicks = s.clicks.reduce((n, c) => n + c.n, 0);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Players" value={s.players} hint={`${s.sessions} visits`} />
        <Kpi label="Rounds played" value={s.rounds_started} hint={`${pct(s.rounds_finished, s.rounds_started)} finished`} />
        <Kpi label="Came back" value={pct(s.returning_players, s.players)} hint={`${s.returning_players} played on 2+ days`} />
        <Kpi label="Rounds per player" value={s.avg_rounds_per_player ?? "—"} hint={`${s.avg_rounds_per_session ?? "—"} per visit`} />
        <Kpi label="Median visit" value={duration(s.median_session_secs)} hint={`average ${duration(s.avg_session_secs)}`} />
        <Kpi label="Play time per player" value={duration(s.avg_play_secs_per_player)} hint="all visits, averaged" />
        <Kpi label="On phones" value={pct(s.devices.mobile, s.devices.mobile + s.devices.desktop)} hint={`${s.devices.installed} from home screen`} />
        <Kpi label="Daily Puzzle players" value={s.daily_puzzle.first_plays} hint={`avg score ${s.daily_puzzle.avg_first_score ?? "—"}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Funnel" why="How far people get. The biggest drop is the next thing to fix.">
          <Bars rows={s.funnel.map((f) => ({ label: f.step, value: f.players, note: pct(f.players, opened) }))} />
        </Section>

        <Section title="Where people leave" why="The screen each visit ended on. Lots of exits on Home means the menu isn't hooking them.">
          <Bars rows={s.exits.map((e) => ({ label: SCREENS[e.screen] ?? e.screen, value: e.sessions, note: pct(e.sessions, sessionsTotal) }))} />
        </Section>

        <Section title="Modes" why="What people try, and whether they stick with it (rounds per player).">
          <Table
            head={["Mode", "Rounds", "Players", "Rounds / player", "Finished"]}
            rows={s.modes.map((m) => [MODES[m.mode] ?? m.mode, m.rounds, m.players, (m.rounds / Math.max(1, m.players)).toFixed(1), pct(m.finished, m.rounds)])}
          />
        </Section>

        <Section title="Rounds per player" why="One-and-done versus hooked.">
          <Bars rows={s.rounds_per_player.map((r) => ({ label: `${r.bucket} rounds`, value: r.players }))} />
        </Section>

        <Section title="Room settings in play" why="What hosts actually pick when they start a round with friends.">
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
        </Section>

        <Section title="Buttons people press" why="Feature discovery. Low numbers on share/QR mean multiplayer isn't spreading.">
          <Bars rows={s.clicks.map((c) => ({ label: c.target.replaceAll("_", " "), value: c.n, note: `${c.players}p` }))} />
          <p className="text-xs opacity-60">{totalClicks} clicks · “p” = unique players</p>
        </Section>

        <Section title="In-game features" why="Are the No chill extras and reactions getting used?">
          <Table
            head={["Feature", "Uses"]}
            rows={[
              ["💣 Attacks launched", s.features.attacks],
              ["⚡ Combos filled", s.features.combos],
              ["😂 Reactions sent", s.features.reactions],
              ["❓ How to play opened", s.features.howto_opens],
              ["… read to the end", s.features.howto_finished],
            ]}
          />
        </Section>

        <Section title="Dr. Hoot fairness" why="Player win rate by bot level. Aim for roughly 40–60% everywhere.">
          <Table head={["Level", "Rounds", "Player wins"]} rows={s.bot.map((b) => [`Lv ${b.level}`, b.rounds, pct(b.player_wins, b.rounds)])} />
        </Section>

        <Section title="Survival & Daily" why="Netflix-style solo modes.">
          <Table
            head={["Stat", "Value"]}
            rows={[
              ["⏳ Survival runs", s.survival.rounds],
              ["⏳ Average time survived", duration(s.survival.avg_survived_secs)],
              ["⏳ Longest run", duration(s.survival.best_survived_secs)],
              ["📅 Daily plays (incl. practice)", s.daily_puzzle.plays],
              ["📅 First plays (counted)", s.daily_puzzle.first_plays],
            ]}
          />
        </Section>

        <Section title="Where players come from" why="Referrer of each visit. “direct” = typed, bookmarked or shared in an app.">
          <Bars rows={s.referrers.map((r) => ({ label: r.ref, value: r.sessions }))} />
        </Section>

        <Section title="Host setting changes" why="Which toggles hosts touch in the lobby (counts every tap).">
          <Bars rows={s.setting_changes.map((c) => ({ label: `${c.key} → ${c.value}`, value: c.n }))} />
        </Section>
      </div>

      <Section title="Per day" why="Players and rounds by UTC day.">
        <div className="flex h-40 items-end gap-1 overflow-x-auto">
          {s.daily.length === 0 && <p className="text-sm opacity-60">No data yet</p>}
          {s.daily.map((d) => {
            const max = Math.max(1, ...s.daily.map((x) => x.rounds));
            return (
              <div key={d.day} className="flex min-w-6 flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.players} players, ${d.rounds} rounds`}>
                <span className="text-[10px] tabular-nums opacity-80">{d.rounds}</span>
                <span className="w-full rounded-t bg-[var(--gold)]" style={{ height: `${Math.max(4, (d.rounds / max) * 110)}px` }} />
                <span className="text-[10px] opacity-60">{d.day.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <p className="text-center text-xs opacity-60">Updated {new Date(s.generated_at).toUTCString()}. Add ?notrack=1 to the game URL once to stop counting your own device.</p>
    </>
  );
}
