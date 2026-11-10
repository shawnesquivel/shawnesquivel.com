# Word Brawl analytics — spec

Goal: learn, over the first ~3 months, which parts of the game people like enough to come back for. Small, anonymous, and invisible to gameplay. Not a product analytics platform.

## Questions we want answered (work backwards from these)

| # | Question | Metric on the dashboard |
| --- | --- | --- |
| 1 | Do people come back? | Players, returning players (played on 2+ days), rounds per player histogram |
| 2 | How long do they play? | Median / average session length, average total play time per player, rounds per session |
| 3 | Where do they leave? | Funnel (landed → started a round → finished a round → played 2+ rounds → came back another day) and the **last screen** of every session |
| 4 | What do they try, and what sticks? | Rounds by mode (Quick Start, Daily, Survival, room) with unique players and rounds per player; room settings picked (board, timer, chill / no chill, match type); setting changes |
| 5 | Does multiplayer spread? | Rooms created, copy code / share link / QR clicks, players per room round |
| 6 | Is the quest curve right? | Quest rounds and win rate per quest level (`bot_level`) |
| 7 | Are features discovered? | Clicks on home buttons, how-to-play opens, attacks, combos, reactions |

Anything that doesn't feed one of these questions isn't tracked.

## Privacy

- A random player id in `localStorage` and a random session id in `sessionStorage`. No names, emoji, words, IPs or room codes are stored.
- Test mode: play at `wordbrawl.app/test` (or `/boggled/test`) and nothing is tracked on that page, with a green "Test mode · not tracked" badge. Room invites and Daily share links made there point at the normal page, so friends who join are still counted. Tests: `npx tsx tests/boggled/e2e/test-mode.mts`.
- Owner opt-out: open the game once with `?notrack=1` (sets `boggled:notrack` on that device). `?notrack=0` turns it back on.

## Events

Every event row: `at` (server time), `player`, `session`, `event`, `screen` (screen the player was on), `props` (small JSON).

| Event | When | Props |
| --- | --- | --- |
| `session_start` | Page load | `ref` (referrer host), `host`, `visit` (nth visit on this device), `mobile`, `standalone` (installed PWA), `utm`, `country` / `region` / `city` / `lat` / `lon` (from Vercel's edge geolocation via `/boggled/geo`, coordinates rounded to ~10 km; the IP is never stored) |
| `screen` | Screen changes | — (`screen` column): `home`, `friends`, `join_code`, `join_name`, `intro_quick`, `intro_daily`, `intro_survival`, `lobby`, `game`, `results` |
| `click` | Buttons we care about | `target`: `quick_start` (Story), `friends`, `daily`, `daily_collect`, `skip_reveal`, `survival`, `create_room`, `join_room`, `copy_code`, `share_link`, `qr`, `rename`, `howto`, `mute`, `rematch`, `play_again`, `next_game`, `home`, `settings`, `end_early`, `share_daily` |
| `setting` | Host changes a room setting | `key`, `value` |
| `round_start` | A round begins on this phone | `mode` (`quick` = quest/`practice`/`daily`/`survival`/`room`), `players`, `size`, `duration`, `min`, `no_chill`, `series`, `game`, `bot_level` (quest level), `boss`, `host`, `room` (room code, rooms only) |
| `round_end` | Results computed | `mode`, `players`, `score`, `words`, `rank`, `won`, `bot` (`win`/`loss`/`tie`), `bot_level`, `stars` + `lives` (quest), `coins` (quest/practice), `ended_early`, `secs` (seconds played), `survived` (survival), `first` (first daily play today), `reward_day` (streak reward paid, 1–7), `day` (daily) |
| `howto` | How-to-play closed | `slide` (furthest slide reached), `of` |
| `attack` / `combo` / `react` | In-game feature use | `weapon` / — / — |
| `buy` / `item` | Quest shop purchase / item used in a round | `item`, `price` / `item`, `level` |
| `ad_start` / `ad_reward` | Rewarded ad opened / finished | — / `granted` |
| `hide` | Tab hidden (phone locked, app switched) | `in_round` |

Session length = last event − first event in a session. The **exit screen** is the `screen` of a session's last event, which survives phones that never fire `pagehide`.

## How it's built (lightweight on purpose)

- `src/lib/boggled/analytics.ts`: events go into an in-memory queue. It flushes every 15 s, at 20 events, and when the tab is hidden, as one `fetch(..., { keepalive: true })` insert. It never awaits on the game's path and never throws. If the table is missing it switches itself off for the session.
- Storage: one Supabase table `boggled_events`. Anyone can insert (RLS) but nobody can read rows directly.
- Read side: `security definer` SQL functions return aggregates only:
  - `boggled_stats(days)`, `boggled_places(days)` (countries, cities and map points, one per player) and `boggled_insights(days, tz)` power the dashboard. They only answer to the server's secret key (`service_role`), so nobody can pull the numbers with the public key. `boggled_insights` returns:
    - groups: rooms by room code, with size, rounds, how many replayed or came back another day, session length and invites;
    - replayability: return rate within 1, 2, 3, 7 and 14 days of a player's first visit, days played, and per-mode play-again and come-back rates;
    - feature adoption: the share of players who used each of 22 features, including ones nobody used;
    - when people play: rounds by weekday and hour.
  - `boggled_daily_rank(day, score)` powers "you beat X% of players" on the Daily Puzzle.
- Dashboard: `/boggled/stats` (also `/stats` on the Word Brawl domain). It's server-rendered with no client JS (SVG charts and a `d3-geo` world map), has a 7 / 30 / 90-day switch, and is `noindex`. Chapters: Top & least-used features, Replayability, Groups, Where players are, When people play, and a collapsed More detail. It's private: the browser asks for a password (any username, password = `STATS_PASSWORD`). With no `STATS_PASSWORD` set it stays locked in production.
- Private-stats setup (once):
  1. Vercel → project → Environment Variables: add `STATS_PASSWORD` (your choice) and `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API Keys → secret key), for Production. Redeploy.
  2. Supabase SQL editor: run `supabase/migrations/20261109050000_boggled_private_stats.sql` (locks `boggled_stats` to the secret key, adds `boggled_places`), then `supabase/migrations/20261109060000_boggled_insights.sql` (map points, `boggled_insights`). Then `supabase/migrations/20261109090000_boggled_visits.sql` (`boggled_visits`: unique visitors vs visits per day; a visit is a new tab or a return after 30+ minutes idle). All are safe to re-run. Until they run, the affected sections show a "run the migration" note.
- Testing the SQL: `npx tsx tests/boggled/stats-sql.mts` runs the analytics migrations in PGlite (in-memory Postgres) against a month of synthetic events. To preview the dashboard on that data, run `npx tsx tests/boggled/stats-server.mts`, then `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dev npm run dev`.
- Migration: `supabase/migrations/20261030090000_boggled_analytics.sql`. Apply it once to the production project (Supabase dashboard → SQL editor, or `supabase db push`).

## Not doing (yet)

Cohort retention curves, per-word stats, A/B tests, user accounts, third-party analytics SDKs. Revisit after ~3 months of data.
