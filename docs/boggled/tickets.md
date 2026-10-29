# Boggled Online — tickets

Status: `todo` · `doing` · `done` · `later`. Commits reference ticket IDs (e.g. `BOG-03`).
A new agent should read [`README.md`](./README.md) first, then pick the first `todo` here.

## Phase 1 — Engine

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-01 | Spec, research, ticket log | done | `README.md`, this file |
| BOG-02 | Seeded RNG + Boggle dice (4×4 classic, 5×5 Big Boggle) + board generation with a minimum-word-count reroll | done | |
| BOG-03 | Path validation (adjacency, no reuse, `Qu`) + board solver (trie DFS) | done | |
| BOG-04 | Scoring: length points, unique ×2, longest word bonus | done | |
| BOG-05 | Dictionary: ENABLE list in `public/boggled/words.txt`, lazy loader | done | |

## Phase 2 — Solo gameplay on a phone

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-06 | Grid input: swipe (pointer events, inner-circle hit test, backtrack) + tap mode | todo | |
| BOG-07 | Round screen: timer, current word, found list, feedback (valid/dup/invalid/too short) | todo | |
| BOG-08 | Sound: Web Audio synth (tile blips, valid chime, invalid buzz, countdown ticks, end gong, count-up ticks, fanfare), mute toggle, iOS unlock | todo | |
| BOG-09 | Wake lock + mobile viewport hardening | todo | |

## Phase 3 — Lobby

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-10 | Transport interface: Supabase Realtime + BroadcastChannel fallback | todo | |
| BOG-11 | Room protocol: create/join code, presence roster, host election, settings, start, progress, final-list exchange with retries, state resync | todo | |
| BOG-12 | Clock sync endpoint `/api/boggled/time` | todo | |
| BOG-13 | Lobby UI: name + emoji, share link, roster, host settings | todo | |

## Phase 4 — Results replay

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-14 | Replay: reveal words longest-first per player side-by-side, mark shared vs unique ×2, scores count up with ticks | todo | |
| BOG-15 | Longest-word award, podium ("Transcendent victory, NAME!"), missed words, play again | todo | |

## Phase 5 — Verify & ship

| ID | Ticket | Status | Notes |
| --- | --- | --- | --- |
| BOG-16 | Playwright e2e: 2 players on local Supabase play a full round | todo | |
| BOG-17 | Deploy via Vercel (PR preview), document env vars | todo | |

## Later

| ID | Ticket | Status |
| --- | --- | --- |
| BOG-L1 | Word challenges (vote to reject a unique word → loses ×2) | later |
| BOG-L2 | TV/host-screen mode: big board on a laptop/TV, phones as controllers | later |
| BOG-L3 | Character art + sound assets (see `design-later.md`) | later |
| BOG-L4 | 6×6 board, custom timers, more game modes | later |
| BOG-L5 | Persistent stats / match history (Supabase table) | later |
| BOG-L6 | Profanity-aware dictionary tuning, definitions on tap | later |
