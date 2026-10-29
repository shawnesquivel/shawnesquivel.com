# Boggled — art & audio direction (later)

Phase 1 ships with emoji avatars, CSS tiles, and synthesized Web Audio. This is the spec for replacing them.

## Characters (BOG-L3)

Boggle Party uses chunky, expressive mascots (the round orange hamster on the podium, etc.). We want 12 originals, not copies.

- **Format**: one sprite sheet per character, 512×512 per frame, transparent PNG/WebP, plus a 128×128 static avatar.
- **States** (frames or short Lottie loops): `idle`, `thinking` (during the round), `found-word` (small hop), `win` (arms up, confetti), `lose` (sad slump), `host` (crown variant).
- **Style**: thick 4–6 px dark-purple outline (`#170b47`), flat fills, one highlight, matches the tile palette (`#2a1670` tiles, `#ffd23f` gold, `#3ddc84` green, `#1f8fe8` → `#3a1fb8` background).
- **Cast ideas**: fox, panda, frog, octopus, unicorn, tiger, monkey, penguin, owl, turtle, bee, mushroom — mirrors the current emoji set so stored choices map 1:1 (`localStorage["boggled:emoji"]` → character id).
- **Where they appear**: home picker, lobby roster, in-round player chips (with live `thinking` / `found-word`), results column headers, podium (large `win`/`lose`).

## Board & UI

- Tile: rounded square with a bevelled bottom edge and subtle letter emboss. A 9-slice PNG or keep CSS but add a noise texture.
- Selection trail: glowing ribbon (SVG with a gaussian blur filter) instead of the flat polyline.
- Podium: 3-step podium graphic with stars; winner banner ribbon like "Transcendent victory, NAME!".
- Confetti burst on the podium (canvas, 1.5 s).

## Audio

Replace synth calls in `src/lib/boggled/sound.ts` one by one; keep the same method names so call sites don't change.

| Method | Target sound | Length |
| --- | --- | --- |
| `tile(i)` | soft wooden/marimba tick, pitch rising with path length | <120 ms |
| `valid(len)` | bright chime, bigger for longer words | 200–600 ms |
| `duplicate()` | muted double-thud | 200 ms |
| `invalid()` | rubbery "bwomp" | 200 ms |
| `tick(urgent)` | clock tick / urgent tock (last 10 s) | 60 ms |
| `countdown(final)` | 3-2-1 beeps, "GO" whoosh | 150/400 ms |
| `roundEnd()` | buzzer / gong | 700 ms |
| `reveal(step, unique)` | coin counter blip, sparkle on ×2 | 100 ms |
| `bonus()` | rising arpeggio + "Longest word!" voice sting | 1 s |
| `fanfare()` | victory fanfare + crowd cheer | 2 s |
| Music | lobby loop (calm), round loop (driving, 120 bpm, speeds up in last 10 s) | loops |

Format: AAC (`.m4a`) for iOS + Opus (`.webm`) fallback, decoded once into `AudioBuffer`s. Keep the total under 1 MB.
