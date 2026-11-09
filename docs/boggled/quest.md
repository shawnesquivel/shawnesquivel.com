# Quest mode: concept and storyboard

Quick Start is a journey. You are a traveling wordsmith. **Lexidrake the Word Dragon stole the alphabet**, and you walk from the Training Grounds to the top of Lexicon Peaks to take it back. There are 20 levels in 4 regions. Every 5th level is a boss that guards a badge, and level 20 is the dragon.

Design goals:

- **You can see progress:** a map with your avatar on it, stars on every node, badges on the region track.
- **Short, readable steps:** each level is a single opponent that's a little better than the last.
- **Bosses are events:** bigger nodes, a red "BOSS BATTLE" intro, powers that mess with your board, and a badge ceremony when you win.
- **A reason to come back:** 5 lives per 24 hours, ⭐⭐⭐ to chase on every level, and the next region visible but locked.
- **Less reading:** the results screen is a score race with a verdict and stars, and the word lists sit behind a toggle.

## The world

| Region | Levels | Look | Opponents (1–4) | Boss (5) | Badge |
| --- | --- | --- | --- | --- | --- |
| 🌱 Training Grounds | 1–5 | green meadow, trees, flowers | Bun Bun 🐰, Shelly 🐢, Pip 🐤, Sir Nutsworth 🐿️ | **Dr. Hoot 🦉**: 💣×2 | 🪶 Feather |
| 🌲 Whispering Woods | 6–10 | teal forest, pines, mushrooms | Fern 🐸, Bramble 🦔, Rocco 🦝, Luna 🐺 | **Countess Vix 🦊**: 💣×1 🙃×3 | 🌰 Acorn |
| 🏜️ Syllable Sands | 11–15 | orange desert, cacti; **90 s rounds** | Sandy 🦎, Scorch 🦂, Humphrey 🐪, Mirage 🐍 | **The Sphinx 🦁**: 💣×3 🙃×3 ⚡ frenzy | ☀️ Sun |
| 🏔️ Lexicon Peaks | 16–20 | violet mountains, snow; **4+ letter words** | Billy 🐐, Talon 🦅, Frost 🐻‍❄️, Grimwald 🧙 | **Lexidrake 🐉** (final): 5×5 board, 💣×4 🙃×4 ⚡ frenzy | 👑 Dragon Crown |

Each opponent has a one-line taunt that shows on the map card and in the versus intro.

## Difficulty

The bot is not an AI. It picks real words from the board's solutions on a timed schedule (`planBot` in `bot.ts`). Each level has a `skill` value that rises a little every level, with a bump at each boss:

```
Lv  1   2   3   4  [5]   6   7   8   9  [10]  11  12  13  14 [15]  16  17  18   19  [20]
   1.0 1.6 2.2 2.8 3.6  3.8 4.3 4.8 5.3 6.0  6.2 6.7 7.2 7.7 8.5  8.7 9.2 9.7 10.3 11.5
```

Skill sets how many words the bot finds (about `3 + 3.5 × skill` per 2 minutes, capped at 70% of the board) and how much it favours long words. Level 1 finds about 7 words, so nearly anyone wins. Level 20 finds about 43 words on a 5×5 board, plus a frenzy at the end, so it should take real skill.

**Boss powers** are scheduled at random times in the middle of the round (never in the first 12 s or the last 8 s):

- 💣 **Bomb:** blocks one of your tiles for 5 s.
- 🙃 **Flip:** turns two of your tiles upside down for 6 s.
- ⚡ **Final frenzy:** in the last 20 s the boss finds 30% more words, announced with a toast.

The live dashboard (`/stats`, "Quest difficulty") shows the win rate per level. The target is a gentle slope from about 80% at level 1 to about 30% at the dragon. Tune the `skill` column in `quest.ts` from that data.

## Lives

- You have 5 lives. Each lost life comes back 24 hours after it was lost (a rolling window, like Candy Crush's refill timer).
- Starting a quest round takes a life up front, so quitting mid-round still costs one. Winning or tying gives it back, so only losses cost lives.
- Losing never drops you a level.
- With 0 lives, the Play button becomes a countdown ("💔 Next life 4:10:00"). Practice stays open.
- `MAX_LIVES` and `LIFE_REFILL_MS` in `quest.ts` are the knobs.

## Stars

A win earns 1 to 3 stars, based on the margin: 1★ for any win, 2★ for 25% more points than the opponent, 3★ for 60% more. Your best stars per level are kept. Replaying a beaten level costs a life only if you lose, and is there to chase ⭐⭐⭐.

## Storyboard

1. **Home.** The Quick Start button shows where you are: "Level 7 · 🌲 Whispering Woods · ❤️ 4". For a new player it reads "Start your quest: 20 levels, 4 bosses 🐉".
2. **Map.** This is the hub screen.
   - **Header:** ← back, hearts with the refill timer, and your ⭐ total.
   - **Region track:** four region icons joined by a line. Earned badges sit on the icons, and locked regions show 🔒.
   - **Region title**, with the story line the first time you play.
   - **The board:** a tilted 3D board in the region's colours. A curved path climbs from the bottom to the boss at the top and continues off the edge toward the next region. Nodes you've beaten are gold with stars underneath. Locked nodes are dim with 🔒. The boss node is bigger, red and gold, with its character standing on it (a black silhouette until it's unlocked). Your avatar bobs on the current node.
   - **Bottom card:** the selected opponent with its taunt, rule chips (board, timer, powers), 🎯 Practice and ⚔️ Play Level N.
3. **Versus intro.** This plays during the 5-second countdown.
   - **Background:** region colours with a rotating sunburst (red for bosses, fire for the dragon).
   - **Reveal sequence:** the level number drops in. You and your opponent slide in from opposite sides. "VS" slams down and the screen shakes. Then the taunt bubble and the rule chips appear, and 3, 2, 1, GO.
   - **Boss levels** get a pulsing "⚔️ BOSS BATTLE" banner.
4. **Game.** This is the normal board. Boss powers arrive as toasts ("💣 🦊 Countess Vix bombed your board!") and land on your tiles.
5. **Results.** These are visual and quick.
   - **Score race:** two score towers (yours gold, theirs red) race up for 2 seconds.
   - **Verdict:** VICTORY! / DEFEAT / DRAW slams in.
   - **Rewards:** stars pop in one by one with a chime. The winner gets a bobbing crown, and the loser greys out and tilts.
   - **Below:** three chips (your words, your longest word, their words) and your hearts. A lost heart cracks.
   - **Buttons:** after a win, "Continue ➜" (with ↻ replay). After a loss, "Try again ❤️" (with 🗺️ map).
   - The word lists and missed words are behind "📖 See the words".
6. **Map, after a win.**
   - Your avatar hops to the next node and the path segment draws in gold.
   - **After a boss:** a "BOSS DEFEATED · 🪶 Feather Badge" card appears with "Onward to 🌲 Whispering Woods →". Next comes a full-screen region title card, and your avatar drops onto the first node of the new region.
7. **After Lexidrake.** A "👑 QUEST COMPLETE · The alphabet is free!" card appears, followed by an invitation to go back for ⭐⭐⭐ everywhere.

## Practice

🎯 Practice plays any unlocked opponent with your own settings (board, timer, minimum length, chill). It costs no lives and changes no progress, so there's always something to play while you wait for lives. It's the old Quick Start settings screen.

## Analytics

- **Quest rounds:** mode `quick`, with `bot_level` (the quest level) and `boss` on `round_start`, and `bot` (win/loss/tie), `stars` and `lives` on `round_end`. Practice rounds use mode `practice`.
- **The map:** screen `intro_quick`, with clicks `quest_play`, `quest_practice`, `quest_onward`, `quest_map`, `quest_retry` and `quest_replay`. The event `quest_complete` fires when the final card is dismissed.

## Not built yet

- Server-side lives and progress. Today everything lives in localStorage on the device, so clearing storage resets it.
- More boss mechanics: hiding the timer, stealing a word, or fog over part of the board.
- Character art instead of emoji, and per-region music (see `design-later.md`).
- Friends' avatars on the map, plus a weekly leaderboard per level.
