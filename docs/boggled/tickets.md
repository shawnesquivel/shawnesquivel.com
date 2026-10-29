# Boggled Online — tickets

Status: `todo` · `doing` · `done` · `later`. Commits reference ticket IDs (e.g. `BOG-03`).
A new agent should read [`README.md`](./README.md) first, then pick the first `todo` here.

## Phase 1 — Engine

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-01 | Spec, research, ticket log | done | `README.md`, this file |
| BOG-02 | Seeded RNG + Boggle dice (4×4 classic, 5×5 Big Boggle) + board generation with a minimum-word-count reroll | done | |
| BOG-03 | Path validation (adjacency, no reuse, `Qu`) + board solver (DFS with binary-search prefix check on the sorted list) | done | |
| BOG-04 | Scoring: length points, unique ×2, longest word bonus | done | |
| BOG-05 | Dictionary: ENABLE list in `public/boggled/words.txt`, lazy loader | done | |

## Phase 2 — Solo gameplay on a phone

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-06 | Grid input: swipe (pointer events, inner-circle hit test, backtrack) + tap mode | done | |
| BOG-07 | Round screen: timer, current word, found list, feedback (valid/dup/invalid/too short) | done | |
| BOG-08 | Sound: Web Audio synth (tile blips, valid chime, invalid buzz, countdown ticks, end gong, count-up ticks, fanfare), mute toggle, iOS unlock | done | |
| BOG-09 | Wake lock + mobile viewport hardening | done | |

## Phase 3 — Lobby

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-10 | Transport interface: Supabase Realtime + BroadcastChannel fallback | done | |
| BOG-11 | Room protocol: create/join code, presence roster, host election, settings, start, progress, final-list exchange with retries, state resync | done | |
| BOG-12 | Clock sync endpoint `/api/boggled/time` | done | |
| BOG-13 | Lobby UI: name + emoji, share link, roster, host settings | done | |

## Phase 4 — Results replay

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-14 | Replay: reveal words longest-first per player side-by-side, mark shared vs unique ×2, scores count up with ticks | done | |
| BOG-15 | Longest-word award, podium ("Transcendent victory, NAME!"), missed words, play again | done | |

## Phase 5 — Verify & ship

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-16 | Playwright e2e: solo (touch + mouse + tap), 2 players on local Supabase, packet loss at the buzzer, host migration | done | `tests/boggled/e2e/*.mts` |
| BOG-17 | Deploy via Vercel (PR preview), document env vars | done | Env vars set in Vercel (Production + Preview). |

## Phase 6 — v2: party features

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-18 | Session scoreboard: wins + points carried across rounds in a room, shown in lobby and results from round 1 | done | `tally`/`roundsPlayed` in `room.ts`; joiners adopt the host's tally via `state` |
| BOG-19 | Leader banter: fun headline + title badge for whoever has the most wins | done | `src/lib/boggled/banter.ts` (unit tested) |
| BOG-20 | 💣 Bomb power-up: a 6+ letter word earns a bomb (max 3); it blocks a random tile on a random rival's board for 5 s | done | Host toggle "Power-ups". Blocked tiles can't be swiped through. |
| BOG-21 | Brags (7+ letter word toasts the rivals) and emoji reactions that float up on everyone's screen | done | `Extras.tsx` |
| BOG-22 | Friendlier settings: board/timer/word-length cards and toggle switches | done | |
| BOG-23 | Step-based home: Practice solo / Create a room / Join a room → code → name + emoji. Invite links skip to the name step. Any emoji can be typed in. | done | `Home.tsx` |
| BOG-25 | "?" button beside the sound toggle opens an animated how-to-play walkthrough (6 slides) | done | `HowToPlay.tsx` |
| BOG-24 | e2e: power-ups (bomb earn/use/block/expiry), reactions, scoreboard across 2 rounds | done | `tests/boggled/e2e/power-ups.mts` |

## Later

| ID | Ticket | Status |
| --- | --- | --- |
| BOG-L1 | Word challenges (vote to reject a unique word → loses ×2) | later |
| BOG-L2 | TV/host-screen mode: big board on a laptop/TV, phones as controllers | later |
| BOG-L3 | Character art + sound assets (see `design-later.md`) | later |
| BOG-L4 | 6×6 board, custom timers, more game modes | later |
| BOG-L5 | Persistent stats / match history (Supabase table) | later |
| BOG-L6 | Profanity-aware dictionary tuning, definitions on tap | later |
| BOG-L7 | Real-phone QA pass: iOS Safari silent switch, backgrounding mid-round, Android Chrome haptics | later |
| BOG-L8 | Music loops (lobby / round) | later |
| BOG-L9 | More power-ups: ❄️ freeze a rival's timer input for 3 s, 🌀 scramble a rival's board, 🔄 rotate your own board, 💡 hint (reveal a word's first 2 letters) | later |
| BOG-L10 | Daily puzzle: same seeded board for everyone each day + shareable emoji result | later |
| BOG-L11 | Themed rounds: bonus points for words in a category (food, animals), or a "golden tile" worth ×2 | later |
| BOG-L12 | Streaks + rivalry stats ("Gf has beaten you 4 times in a row"), persisted per pair | later |
| BOG-L14 | "Danger mode" host toggle grouping all the fight features (bombs, sabotage, trash talk, final-30s chaos). Ideas: 30s warning, sabotage power-ups, steals, trash talk, comeback mechanics | later |
| BOG-L13 | Sudden-death tiebreaker round (30 s) when the session is tied | later |
