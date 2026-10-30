# Word Brawl (formerly Boggled Online) — spec & architecture

A browser-based, phone-first remake of Netflix's *Boggle Party*, living at `/boggled` on shawnesquivel.com and at the root of its own domain (`wordbrawl.vercel.app`, plus `wordbrawl.app` if registered) via a host-based rewrite in `next.config.ts`. Renamed to **Word Brawl** to stay clear of the Boggle trademark; code and routes keep the `boggled` name.
Players open the site on their phones, one creates a room, others join with a 4-letter code or link, and everyone races the same board.

Work is tracked in [`tickets.md`](./tickets.md). Future art/audio direction is in [`design-later.md`](./design-later.md).

## Rules (phase 1)

Taken from the Boggle Party help center (Netflix, 2026):

- Board: 4×4 (default) or 5×5, built from real Boggle dice. `Qu` is one tile.
- A word chains adjacent tiles (8 directions), each tile used at most once per word.
- Minimum length 3 (host can set 4).
- Points: 3 letters = 1, 4 = 2, 5 = 3, +1 per extra letter (`Qu` counts as two letters).
- **Unique word**: with 3 or more players, a word nobody else found scores **double**. Head-to-head (2 players) every word scores normally, since ×2 would just double the gap.
- No penalty for invalid words, no speed bonus.
- **Longest word bonus** (not in Netflix rules, requested by Shawn): +3 to the player(s) with the strictly longest valid word. Part of No chill mode.
- Timer: 1 or 2 minutes. Timer and shortest word sit side by side in the lobby.
- **Chill / No chill**: one host toggle. Chill (default) is the classic game. No chill turns on Danger mode and the longest-word bonus together. Tapping it explains both.
- **Match**: Best of 3 (default), Best of 5, or Continuous (no finish line), with a one-line explanation of the selected option.
- **Create a room** opens the lobby instantly (a fun default name if you haven't set one); rename or change emoji with ✏️ in the roster. The room code is selectable and has a Copy button; an empty room says "It's quiet in here. Share the link with your friends!"
- **Quick Start** (replaces Practice solo): 1v1 against **Dr. Hoot** 🦉, a mocked opponent (`bot.ts`). It's not an AI: it picks real words from the board's solutions on a timed schedule. Its level (1–10, starts at 3, stored on the device) sets how many words it finds and how long they are; beat it and it levels up, lose and it levels down. Quick Start uses chill rules, 4×4, 2 minutes; the ⚡ combo ring still adds time.

Party extras (v2, ours, not Netflix):
- **Session scoreboard**: every multiplayer round adds wins (rank 1, ties all win) and points to a per-room tally shown in the lobby and results, with a banter headline and a title badge for the leader (`banter.ts`).
- **☠️ Danger mode** (on in No chill mode):
  - 6+ letter words earn attacks, alternating 💣 bomb (blocks 1 random rival tile for 5 s, can't be swiped through) and 🙃 flip (2 rival tiles pink + upside down for 6 s). Max 3 each.
  - 🛡️ Shield: earned by filling the combo ring (4 words within 4 s; ring in the top right fills clockwise, tap to explain). Max 1; auto-blocks the next attack; attacker is told.
- **Combo ring in Quick Start**: same ring, but filling it adds +5 s to the clock (max 3 per round).
  - Danger zone (last 15 s): red glow + siren; words found then add a bonus of ceil(10% of their points). Sent as `late` with the final word list.
  - Battle log on results.
- **Halftime reveal** (all multiplayer): rival scores show 🙈 until halftime, then live points.
- **Best-of series** (host setting): Bo3/Bo5. `Round.series = {id, game, length}`; every client records round winners in `seriesRecords`; first strictly ahead with a majority (or after N games) is champion; ties go to sudden death. Champion adds 🏅 to the tally.
- **Personal bests** (localStorage, per board+timer) and near misses on results.
- **Brags**: a 7+ letter word pops a toast on rivals' screens ("Shawn found a 7-letter word!").
- **Reactions**: 8 emoji buttons in the lobby and results that float up on everyone's screen.

Skipped for phase 1: word challenges, pranks, levels/unlocks, achievements, TV-as-board "host screen" mode.

## Phases & milestones

| Phase | Milestone | How it's verified |
| --- | --- | --- |
| 1. Engine | Dice, seeded board, solver, scoring, dictionary | Vitest unit tests (`npm run test:boggled`) |
| 2. Solo gameplay | Swipe/tap input on a phone, timer, sounds, results | Playwright on an emulated iPhone: synthetic swipes, screenshots |
| 3. Lobby | Create/join by code, presence, host settings, synced start, word exchange | Playwright with 2 browser contexts against local Supabase Realtime (`npx supabase start`) |
| 4. Results replay | Words revealed one by one per player, scores count up, unique ×2, longest word, podium, missed words | Screen recording of a 2-player game |
| 5. Ship | Vercel preview → production, env vars documented | Preview URL smoke test |

## Architecture

```
Phone A ─┐                        ┌─ Phone B
         │  Supabase Realtime     │
         └── channel boggled:CODE ┘   (Broadcast for game events, Presence for who's in the room)
Next.js page /boggled (client-only game) + /api/boggled/time (clock sync) + /boggled/words.txt (dictionary)
```

No database tables. The game is **deterministic and peer-validated**, so no game server is needed:

1. The **host** (earliest-joined player still present; migrates automatically if they leave) owns settings and starts rounds by broadcasting `start {roundId, board, startsAt, endsAt, settings}`. Times are in server-clock ms (each client estimates its offset via `/api/boggled/time`).
2. Every client validates its own words locally (path check + dictionary) and broadcasts a lightweight `progress {count}` so others see "N words".
3. When the timer ends each client broadcasts `final {roundId, words}` and **re-broadcasts every second** until every present player's list has been received (Broadcast is at-most-once, so retries matter). After a 6 s cap, missing players count as zero words.
4. Every client computes the same results from the same inputs (`scoreRound`), so there's nothing to cheat-proof beyond "friends playing together".
5. Late joiners / phones waking up send `hello`; the host answers with `state` (phase, board, timers, last results, session tally).
6. Fire-and-forget events: `attack {roundId, id, weapon, target, tiles}` (everyone logs it, only the target applies it), `shielded {attackId, attacker}`, `brag {roundId, length}`, `react {emoji}`. Losing one is harmless, so they're not retried.

### Code layout

- `src/lib/boggled/` — pure engine (`dice.ts`, `board.ts` incl. solver, `scoring.ts`, `rng.ts`, `dictionary.ts`), sound (`sound.ts`), clock sync (`clock.ts`), realtime transport (`transport.ts`), room protocol/state machine (`room.ts`, `RoomController`).
- `src/components/boggled/` — React UI (`BoggledApp.tsx` identity + routing between screens; `Home.tsx` menu → code → name/emoji steps; `Extras.tsx` scoreboard, toasts, reactions; `Lobby.tsx`; `Game.tsx` round screen; `Grid.tsx` swipe/tap input; `Results.tsx` replay + podium).
- `src/app/boggled/` — route + layout. `src/app/api/boggled/time/route.ts` — clock sync.
- `public/boggled/words.txt` — ENABLE word list (public domain), ~170k words.
- `tests/boggled/` — unit + e2e.

### Transports

`transport.ts` has two implementations behind one interface:
- `supabase` — production. Needs `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key; safe to expose — no tables are touched).
- `local` — `BroadcastChannel`, only between tabs of one browser. Used when Supabase isn't configured (`?transport=local` forces it), handy for dev.

Solo play works with no backend at all.

## Pitfalls researched (and what we did)

| Pitfall | Mitigation |
| --- | --- |
| Vercel Functions can't hold WebSockets or shared memory | Realtime goes through Supabase; Vercel only serves static assets + a tiny time endpoint |
| Supabase Presence limit: 5 `track()` per client per 30 s, else channel closes | Presence tracks only `{id, name, emoji, joinedAt}` once per join. Everything else is Broadcast |
| Broadcast is at-most-once | Final word lists are re-sent every second until all are acknowledged; host re-sends `state` on `hello` |
| Phones sleep / Safari suspends sockets in background | `visibilitychange` → reconnect + `hello`; Screen Wake Lock during rounds; timers are absolute timestamps so a woken phone jumps to the right time |
| Clocks differ between phones | Offset from `/api/boggled/time` (NTP-style, best of 5 samples) |
| iOS: Web Audio is silent until a user gesture, and muted by the silent switch | `AudioContext` unlocked on first tap; `navigator.audioSession.type = "playback"` where supported |
| Diagonal swipes clip neighbouring tiles | Hit-test only the inner circle (~70%) of each tile |
| Page scroll / pull-to-refresh / zoom while swiping | `touch-action: none`, `overscroll-behavior: none`, no-zoom viewport, `user-select: none` on the game |
| Dictionary size | Plain text, lazy-loaded, gzip by Vercel CDN (~0.5 MB over the wire), parsed into a `Set` |

## Deploying

Vercel serves everything; Supabase Realtime carries the multiplayer messages. Add these to the Vercel project (Production **and** Preview), then redeploy:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (same as `SUPABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase **publishable/anon** key (never the secret key) |

Supabase dashboard → Realtime → Settings: leave "Allow public access" enabled (channels are public; room codes are the only gate). No tables or migrations are needed.

Without the variables, `/boggled` still works for solo play, and rooms fall back to same-browser tabs with a visible warning.

## Running locally

```bash
npx supabase start          # local Realtime (Docker). Only Realtime is needed.
# .env.local:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from `npx supabase status`>
npm run dev                 # http://localhost:3000/boggled
npm run test:boggled        # engine unit tests (Vitest)
npm run test:boggled:e2e    # Playwright: solo on an emulated iPhone + 2-player round over Supabase
npx tsx tests/boggled/e2e/resilience.mts   # packet loss at the buzzer + host leaving
npx tsx tests/boggled/e2e/power-ups.mts    # danger mode, series, bests, reactions, scoreboard
```

E2E scripts drive `window.__boggled` (the `RoomController`, exposed in non-production builds only) to shorten timers and inspect state. Screenshots/videos land in `/opt/cursor/artifacts/` (override with `BOGGLED_SHOTS` / `BOGGLED_VIDEOS`).

Docker-in-VM gotcha: if containers can't reach each other (Supabase fails with `DbSetupError` / Realtime "connection not available"), switch to legacy iptables (`update-alternatives --set iptables /usr/sbin/iptables-legacy`) and restart `dockerd`.

## Verified so far

- Engine: 21 unit tests (incl. banter, series, bests, danger bonus).
- Solo on emulated iPhone 13: mouse swipes, real touch-event swipes (no page scroll), tap mode, `Qu` tile, duplicate/invalid feedback, final score.
- Two players (iPhone 13 + Pixel 7) over local Supabase Realtime: create/join by code and invite link, roster, host settings sync, identical board and end time, live opponent word counts, identical results on both phones, head-to-head scoring (no ×2) + longest bonus math, guest reload → rejoins as same player.
- Resilience: guest's messages dropped over the buzzer → host shows results, then recovers the guest's words; host leaves → guest promoted.
- v2 (2 emulated phones, local Supabase): new home flow (menu → code → name, invite link → name, typed emoji avatar), reactions arrive on the other phone, 6+ letter word earns a bomb, rival's tile blocked ~5 s and unusable, scoreboard tallies match on both phones and accumulate over 2 rounds, banter + title badge.
- v3 (2 emulated phones): shield earned/explained/blocks a bomb, bomb + flip land on the rival, halftime reveal, danger-zone bonus identical on both phones, battle log, best-of-3 → champion + 🏅, personal-best panel, solo end-early.
- **Not yet verified**: real phones, hosted Supabase project, iOS Safari audio quirks.
