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
| 6 | Is Dr. Hoot fair? | Quick Start rounds and win rate by bot level |
| 7 | Are features discovered? | Clicks on home buttons, how-to-play opens, attacks, combos, reactions |

Anything that doesn't feed one of these questions isn't tracked.

## Privacy

- A random player id in `localStorage` and a random session id in `sessionStorage`. No names, emoji, words, IPs or room codes are stored.
- Owner opt-out: open the game once with `?notrack=1` (sets `boggled:notrack` on that device). `?notrack=0` turns it back on.

## Events

Every event row: `at` (server time), `player`, `session`, `event`, `screen` (screen the player was on), `props` (small JSON).

| Event | When | Props |
| --- | --- | --- |
| `session_start` | Page load | `ref` (referrer host), `host`, `visit` (nth visit on this device), `mobile`, `standalone` (installed PWA), `utm` |
| `screen` | Screen changes | — (`screen` column): `home`, `join_code`, `join_name`, `intro_quick`, `intro_daily`, `intro_survival`, `lobby`, `game`, `results` |
| `click` | Buttons we care about | `target`: `quick_start`, `daily`, `survival`, `create_room`, `join_room`, `copy_code`, `share_link`, `qr`, `rename`, `howto`, `mute`, `rematch`, `play_again`, `next_game`, `home`, `settings`, `end_early`, `share_daily` |
| `setting` | Host changes a room setting | `key`, `value` |
| `round_start` | A round begins on this phone | `mode` (`quick`/`daily`/`survival`/`room`), `players`, `size`, `duration`, `min`, `no_chill`, `series`, `game`, `bot_level`, `host` |
| `round_end` | Results computed | `mode`, `players`, `score`, `words`, `rank`, `won`, `bot` (`win`/`loss`/`tie`), `ended_early`, `secs` (seconds played), `survived` (survival), `first` (first daily play today), `day` (daily) |
| `howto` | How-to-play closed | `slide` (furthest slide reached), `of` |
| `attack` / `combo` / `react` | In-game feature use | `weapon` / — / — |
| `hide` | Tab hidden (phone locked, app switched) | `in_round` |

Session length = last event − first event in a session. The **exit screen** is the `screen` of a session's last event, which survives phones that never fire `pagehide`.

## How it's built (lightweight on purpose)

- `src/lib/boggled/analytics.ts`: events go into an in-memory queue. It flushes every 15 s, at 20 events, and when the tab is hidden, as one `fetch(..., { keepalive: true })` insert. It never awaits on the game's path and never throws. If the table is missing it switches itself off for the session.
- Storage: one Supabase table `boggled_events`. Anyone can insert (RLS) but nobody can read rows directly.
- Read side: two `security definer` SQL functions return aggregates only:
  - `boggled_stats(days)` powers the dashboard;
  - `boggled_daily_rank(day, score)` powers "you beat X% of players" on the Daily Puzzle.
- Dashboard: `/boggled/stats` (also `/stats` on the Word Brawl domain). It's server-rendered, has a 7 / 30 / 90-day switch, and is `noindex`.
- Migration: `supabase/migrations/20261030090000_boggled_analytics.sql`. Apply it once to the production project (Supabase dashboard → SQL editor, or `supabase db push`).

## Not doing (yet)

Cohort retention curves, per-word stats, A/B tests, user accounts, third-party analytics SDKs. Revisit after ~3 months of data.
