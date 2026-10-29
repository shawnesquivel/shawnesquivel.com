# Boggled Online — spec & architecture

A browser-based, phone-first remake of Netflix's *Boggle Party*, living at `/boggled` on shawnesquivel.com.
Players open the site on their phones, one creates a room, others join with a 4-letter code or link, and everyone races the same board.

Work is tracked in [`tickets.md`](./tickets.md). Future art/audio direction is in [`design-later.md`](./design-later.md).

## Rules (phase 1)

Taken from the Boggle Party help center (Netflix, 2026):

- Board: 4×4 (default) or 5×5, built from real Boggle dice. `Qu` is one tile.
- A word chains adjacent tiles (8 directions), each tile used at most once per word.
- Minimum length 3 (host can set 4).
- Points: 3 letters = 1, 4 = 2, 5 = 3, +1 per extra letter (`Qu` counts as two letters).
- **Unique word**: in multiplayer, a word nobody else found scores **double**.
- No penalty for invalid words, no speed bonus.
- **Longest word bonus** (not in Netflix rules, requested by Shawn): +3 to the player(s) with the strictly longest valid word. Host toggle, on by default.
- Timer: 60 / 90 / 120 / 180 s.

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
5. Late joiners / phones waking up send `hello`; the host answers with `state` (phase, board, timers, last results).

### Code layout

- `src/lib/boggled/` — pure engine (`dice.ts`, `board.ts`, `solver.ts`, `scoring.ts`, `rng.ts`, `dictionary.ts`), sound (`sound.ts`), realtime transport (`transport.ts`), room protocol (`protocol.ts`).
- `src/components/boggled/` — React UI (`BoggledApp.tsx` orchestrates screens; `Grid.tsx` handles input; `Results.tsx` does the replay).
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

## Running locally

```bash
npm run dev                 # http://localhost:3000/boggled
npm run test:boggled        # engine unit tests
npx supabase start          # local Realtime for multiplayer
# .env.local:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from `npx supabase status`>
npm run test:boggled:e2e    # 2-player Playwright run (needs the dev server + Supabase)
```
