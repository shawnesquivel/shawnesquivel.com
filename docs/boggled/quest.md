# Quest mode: concept and storyboard

Story mode (the old Quick Start) is a journey. You are a traveling wordsmith. **Lexidrake the Word Dragon stole the alphabet**, and you walk from the Training Grounds to the top of Lexicon Peaks to take it back. There are 20 levels in 4 regions. Every 5th level is a boss that guards a badge, and level 20 is the dragon.

Design goals:

- **You can see progress:** a map with your avatar on it, stars on every node, badges on the region track.
- **Short, readable steps:** each level is a single opponent that's a little better than the last.
- **Bosses are events:** bigger nodes, a red "BOSS BATTLE" intro, powers that mess with your board, and a badge ceremony when you win.
- **A reason to come back:** 5 lives per 24 hours, ⭐⭐⭐ to chase on every level, and the next region visible but locked.
- **Less reading:** the results screen reveals words one at a time on both sides with a verdict and stars at the end, and the full word lists sit behind a toggle.
- **Suspense to the end:** the opponent's score stays hidden all round (no halftime score, no "found a 7-letter word" toasts) until the reveal.

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
    0.6 1.0 1.4 1.8 2.4  2.5 2.9 3.3 3.7 4.4  5.4 6.0 6.6 7.2 8.2  8.6 9.2 9.8 10.4 11.5
```

Levels 1–10 (the first two regions) are meant to be easy: an average player should reach the Whispering Woods boss without running out of lives. At level 11 the curve jumps (4.4 to 5.4), and from there a player who keeps losing to a boss is nudged to grind earlier levels for coins and buy items (see Coins and shop).

Skill sets how many words the bot finds (about `3 + 3.5 × skill` per 2 minutes, capped at 70% of the board) and how much it favours long words. Level 1 finds about 5 words, so nearly anyone wins. Level 20 finds about 43 words on a 5×5 board, plus a frenzy at the end, so it should take real skill.

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

A win earns 1 to 3 stars, based on the margin: 1★ for any win, 2★ for 10% more points than the opponent (easy to reach), and 3★ for 75% more (the hard last stretch). `STAR_RATIOS` in `quest.ts` holds the thresholds. After a win that isn't 3★, the results screen shows how many more points the next star needed ("+12 pts for ★★★"). Your best stars per level are kept. Replaying a beaten level costs a life only if you lose, and is there to chase ⭐⭐⭐.

## Coins and shop

Coins are the reason to keep playing when a boss is too hard: replay earlier levels, earn coins, then buy items for the boss fight.

**Earning (`coinsFor` in `quest.ts`):**

| Source | Coins |
| --- | --- |
| 📝 Words: your score ÷ 3, win or lose | up to 20 |
| 🏆 Win | 10 + 2 × level |
| ★★ / ★★★ bonus | 5 / 15 + level |
| 🚩 First clear of a level | 10 + level |
| 👑 First clear of a boss | 50 + 5 × level |
| 🎯 Practice round | words played ÷ 2, up to 10 |

A first 3★ win on level 1 pays about 55 coins, and on a boss about 150 or more. A lost round still pays the word coins, so a failed attempt is never worth zero. Replays pay less than first clears, which rewards progress but still makes grinding worthwhile.

**Shop (🛒 next to Play on the map card):**

| Item | Price | Effect in a quest round |
| --- | --- | --- |
| 💣 Stun | 40 | Tap during the round: the opponent finds no words for 8 s |
| 🛡️ Shield | 30 | Passive: blocks the next boss bomb or flip automatically |
| ⏱️ +15s | 25 | Tap during the round: adds 15 s to your clock |
| ❤️ Life | 60 | Refills one life now |

You can use each item at most `ITEM_LIMIT` (2) times per round, so items help but can't buy a win outright. Items are only spent when used, and practice rounds never use them.

**Map card:** tapping any unlocked node shows the opponent, the rules, your best score against them ("🏆 Best 42 – 30" or "⚔️ First fight") and the items you are taking in. Boss nodes show a "BOSS · Lv N" tag.

**Out of lives:** the Play button becomes "📺 Watch ad · +1 ❤️", which is allowed `AD_LIVES_PER_DAY` (3) times per rolling 24 hours, then a countdown. The ad is currently a 5-second placeholder (`AdModal` in `Shop.tsx`); swapping in a real rewarded-ad network (AdSense H5 games ads, AppLixir, etc.) needs an account and only touches that component.

## Word Blast (unlocks at level 5)

Reaching level 5 (the first boss) unlocks the first weapon. A "NEW WEAPON UNLOCKED" card pops up once on the map and shows how it works in three animated steps:

1. Find a 5+ letter word (`BLAST_WORD_LENGTH`) to earn a 💥 Blast. You can hold up to 3 (`MAX_BLASTS`).
2. Tap 💥 Blast under the board during the fight.
3. Your opponent's most recent word is blown up: it's gone from their list and their score.

It works in every Story fight from level 5 on (quest and practice) and is free, unlike the shop items. A blast with nothing to hit isn't spent.

## Opening hint

Every Story round starts with a short word (3 letters, or the level's minimum) traced on the board: the tiles light up one by one with a 👆 sliding from letter to letter, on a loop. It stops as soon as you find any word, or after 12 s. The word comes from a list of everyday words when the board has one (`hint.ts`), so it's "cat", not "nae".

## Storyboard

1. **Home.** Three big buttons: 🗺️ STORY, 🎉 PLAY WITH FRIENDS (create or join a room) and 🎁 DAILY PUZZLE. Survival and How to play sit underneath. The Story button shows where you are: "Level 7 · 🌲 Whispering Woods · ❤️ 4". For a new player it reads "Start your quest: 20 levels, 4 bosses 🐉".
2. **Map.** This is the hub screen.
   - **Header:** ← back, hearts with the refill timer, and your 🪙 coins and ⭐ total.
   - **Region track:** four region icons joined by a line. Earned badges sit on the icons, and locked regions show 🔒.
   - **Region title**, with the story line the first time you play.
   - **The board:** a tilted 3D board in the region's colours. A curved path climbs from the bottom to the boss at the top and continues off the edge toward the next region. Nodes you've beaten are gold with stars underneath. Locked nodes are dim with 🔒. The boss node is bigger, red and gold, with its character standing on it (a black silhouette until it's unlocked). Your avatar bobs on the current node.
   - **Bottom card:** the selected opponent with its taunt, rule chips (board, timer, powers), your best score against it, your items, 🛒 Shop and ⚔️ Play Level N, with 🎯 Practice (free) underneath.
3. **Versus intro.** This plays during the 5-second countdown.
   - **Background:** region colours with a rotating sunburst (red for bosses, fire for the dragon).
   - **Reveal sequence:** the level number drops in. You and your opponent slide in from opposite sides. "VS" slams down and the screen shakes. Then the taunt bubble and the rule chips appear, and 3, 2, 1, GO.
   - **Boss levels** get a pulsing "⚔️ BOSS BATTLE" banner.
4. **Game.** This is the normal board, opening with the traced hint word. The opponent's chip shows 🙈 the whole round. Boss powers arrive as toasts ("💣 🦊 Countess Vix bombed your board!") and land on your tiles. If you own items, an item bar sits under the board: 💣 Stun ×n, ⏱️ +15s ×n, and a 🛡️ chip while a shield is ready.
5. **Results.** These are visual and quick.
   - **Word-by-word reveal:** both towers start at 0. Words appear one at a time under each side ("STONE +3") and the towers grow. Short words go first, and whoever is behind reveals next, so the lead swings back and forth ("You take the lead!" / "🐤 Pip takes the lead!") until one side runs out and the winner pulls away. Words you both found land on both sides at once. The crown sits on whoever is leading. About 9 s in total, with ⏭ Skip.
   - **Verdict:** VICTORY! / DEFEAT / DRAW slams in.
   - **Rewards:** stars pop in one by one with a chime. The winner gets a bobbing crown, and the loser greys out and tilts.
   - **Below:** the coins you earned ("+55 🪙") with a chip per source, and your hearts. A lost heart cracks. Out of lives shows "📺 Watch ad".
   - **Buttons:** after a win, "Continue ➜" (with ↻ replay). After a loss, "Try again ❤️" (with 🗺️ map).
   - Word counts, word lists and missed words are behind "📖 See the words".
6. **Map, after a win.**
   - Your avatar hops to the next node and the path segment draws in gold.
   - **After a boss:** a "BOSS DEFEATED · 🪶 Feather Badge" card appears with "Onward to 🌲 Whispering Woods →". Next comes a full-screen region title card, and your avatar drops onto the first node of the new region.
7. **After Lexidrake.** A "👑 QUEST COMPLETE · The alphabet is free!" card appears, followed by an invitation to go back for ⭐⭐⭐ everywhere.

## Daily Puzzle streak rewards

The Daily Puzzle pays into the same 🪙 wallet as Story, so playing it every day helps with hard bosses. Rewards follow a 7-day track that repeats, and missing a day starts it over:

| Day | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Reward | 20 🪙 | 30 🪙 | 40 🪙 + ⏱️ | 50 🪙 | 60 🪙 + 🛡️ | 80 🪙 | 150 🪙 + 💣 |

- **Home:** the Daily Puzzle button wiggles a 🎁 and shows "Day 3 reward: +40 🪙 · 🔥2" with a 7-segment streak bar. After playing: "Done today ✓ · tomorrow +50 🪙".
- **After today's first play:** a full-screen reward. The gift shakes, bursts into 💰 with coins flying out, the amount pops in, and the 7-day track highlights today. Then "Collect 🪙".
- Paid once per day (the first play, which is also the one that counts for the streak). `DAILY_REWARDS` and `claimDaily` in `quest.ts`.

## Practice

🎯 Practice plays any unlocked opponent with your own settings (board, timer, minimum length, chill). It costs no lives and changes no progress, so there's always something to play while you wait for lives. It's the old Quick Start settings screen.

## Analytics

- **Quest rounds:** mode `quick`, with `bot_level` (the quest level) and `boss` on `round_start`, and `bot` (win/loss/tie), `stars` and `lives` on `round_end`. Practice rounds use mode `practice`.
- **The map:** screen `intro_quick`, with clicks `quest_play`, `quest_practice`, `quest_onward`, `quest_map`, `quest_retry`, `quest_replay`, `shop` and `ad`. The event `quest_complete` fires when the final card is dismissed.
- **Weapon and reveal:** `attack` with `weapon: "blast"`, `tip` (`tip: "blast"`) when the unlock card is dismissed, click `skip_reveal`.
- **Economy:** `coins` on `round_end`, `buy` (`item`, `price`), `item` (`item`, `level`) when an item is used, and `ad_start` / `ad_reward` for the rewarded ad.

## Not built yet

- A real rewarded-ad network (the ad is a placeholder today).
- Server-side lives, coins and progress. Today everything lives in localStorage on the device, so clearing storage resets it.
- More boss mechanics: hiding the timer, stealing a word, or fog over part of the board.
- Character art instead of emoji, and per-region music (see `design-later.md`).
- Friends' avatars on the map, plus a weekly leaderboard per level.
