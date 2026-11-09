// Quest mode: a 20-level journey across 4 regions with a boss every 5 levels.
// See docs/boggled/quest.md for the storyboard. Progress and lives live in localStorage, per device.

import type { BoardSize } from "./dice";

export type BossPower = "bomb" | "flip" | "frenzy";

export type Region = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  badge: { emoji: string; name: string };
  // ground gradient (near → far), path colour, decorations scattered on the map
  ground: [string, string];
  path: string;
  decor: string[];
};

export type QuestLevel = {
  level: number;
  region: number;
  name: string;
  emoji: string;
  taunt: string;
  boss: boolean;
  final: boolean;
  // Opponent strength fed to planBot. Rises a little every level, with a bump at each boss.
  skill: number;
  size: BoardSize;
  duration: number;
  minLength: 3 | 4;
  powers: Partial<Record<BossPower, number>>;
};

export const REGIONS: Region[] = [
  {
    id: "grounds",
    name: "Training Grounds",
    emoji: "🌱",
    blurb: "Every wordsmith starts here. The locals are friendly. Mostly.",
    badge: { emoji: "🪶", name: "Feather Badge" },
    ground: ["#5bd16f", "#2f9e57"],
    path: "#ffe9a8",
    decor: ["🌳", "🌼", "🪨", "🌷", "🌳", "🍀"],
  },
  {
    id: "woods",
    name: "Whispering Woods",
    emoji: "🌲",
    blurb: "The trees whisper words. Some of them are even real.",
    badge: { emoji: "🌰", name: "Acorn Badge" },
    ground: ["#2fa38a", "#16624f"],
    path: "#d7f7c8",
    decor: ["🌲", "🍄", "🌲", "🪵", "🌲", "🦋"],
  },
  {
    id: "sands",
    name: "Syllable Sands",
    emoji: "🏜️",
    blurb: "Hot, dry, and full of riddles. Bring water and vowels.",
    badge: { emoji: "☀️", name: "Sun Badge" },
    ground: ["#f2b45a", "#c9723a"],
    path: "#fff3d6",
    decor: ["🌵", "🏺", "🌵", "🦴", "🌵", "🐚"],
  },
  {
    id: "peaks",
    name: "Lexicon Peaks",
    emoji: "🏔️",
    blurb: "At the top, the dragon guards the stolen alphabet.",
    badge: { emoji: "👑", name: "Dragon Crown" },
    ground: ["#8a7cf0", "#3b2a8f"],
    path: "#e9e4ff",
    decor: ["🏔️", "❄️", "🗻", "🔥", "🏔️", "❄️"],
  },
];

export const QUEST_STORY = "Lexidrake the Word Dragon stole the alphabet. Travel the land, beat the bosses, take it back.";

type Def = [name: string, emoji: string, taunt: string, skill: number];

const DEFS: Def[] = [
  ["Bun Bun", "🐰", "Just learned to spell CARROT. Mostly.", 0.6],
  ["Shelly", "🐢", "Slow and steady. Mostly slow.", 1.0],
  ["Pip", "🐤", "Only tweets in three-letter words.", 1.4],
  ["Sir Nutsworth", "🐿️", "Hoards words like acorns.", 1.8],
  ["Dr. Hoot", "🦉", "Gym leader of the Grounds. Hoots in iambic pentameter.", 2.4],
  ["Fern", "🐸", "Ribbits exclusively in vowels.", 2.5],
  ["Bramble", "🦔", "Very prickly about spelling.", 2.9],
  ["Rocco", "🦝", "Steals words when you blink.", 3.3],
  ["Luna", "🐺", "Howls at long words.", 3.7],
  ["Countess Vix", "🦊", "Rules the Woods. Flips your letters for fun.", 4.4],
  ["Sandy", "🦎", "Basks in the sun. Spells in the shade.", 5.4],
  ["Scorch", "🦂", "Stings with suffixes.", 6.0],
  ["Humphrey", "🐪", "Stores words in his hump for later.", 6.6],
  ["Mirage", "🐍", "Is that a word? Is it real? Sss.", 7.2],
  ["The Sphinx", "🦁", "Answer my riddles or lose your vowels.", 8.2],
  ["Billy", "🐐", "Climbs letter grids for breakfast.", 8.6],
  ["Talon", "🦅", "Spots 7-letter words from a mile up.", 9.2],
  ["Frost", "🐻‍❄️", "Cold, calculating, alphabetical.", 9.8],
  ["Grimwald", "🧙", "Casts spells. Literally, he spells.", 10.4],
  ["Lexidrake", "🐉", "Hoarder of the alphabet. Breathes fire and adverbs.", 11.5],
];

const BOSS_POWERS: Record<number, Partial<Record<BossPower, number>>> = {
  5: { bomb: 2 },
  10: { bomb: 1, flip: 3 },
  15: { bomb: 3, flip: 3, frenzy: 1 },
  20: { bomb: 4, flip: 4, frenzy: 1 },
};

function rules(level: number): Pick<QuestLevel, "size" | "duration" | "minLength"> {
  if (level === 20) return { size: 5, duration: 120, minLength: 3 };
  if (level > 15) return { size: 4, duration: 120, minLength: 4 };
  if (level > 10) return { size: 4, duration: 90, minLength: 3 };
  return { size: 4, duration: 120, minLength: 3 };
}

export const LEVELS: QuestLevel[] = DEFS.map(([name, emoji, taunt, skill], i) => {
  const level = i + 1;
  return {
    level,
    region: Math.floor(i / 5),
    name,
    emoji,
    taunt,
    boss: level % 5 === 0,
    final: level === 20,
    skill,
    ...rules(level),
    powers: BOSS_POWERS[level] ?? {},
  };
});

export const MAX_LEVEL = LEVELS.length;
export const MAX_LIVES = 5;
// A lost life comes back this long after it was lost (5 lives per rolling 24 hours).
export const LIFE_REFILL_MS = 24 * 60 * 60 * 1000;

export function questLevel(level: number): QuestLevel {
  return LEVELS[Math.min(MAX_LEVEL, Math.max(1, Math.round(level))) - 1];
}

export function powerLabel(p: BossPower, n: number) {
  if (p === "bomb") return `💣 Bombs ×${n}`;
  if (p === "flip") return `🙃 Flips ×${n}`;
  return "⚡ Final frenzy";
}

type Rules = Pick<QuestLevel, "size" | "duration" | "minLength" | "powers">;

export function ruleChips({ size, duration, minLength, powers }: Rules): string[] {
  const chips = [`${size}×${size}`, duration % 60 === 0 ? `${duration / 60} min` : `${duration}s`];
  if (minLength === 4) chips.push("4+ letters");
  for (const [p, n] of Object.entries(powers)) chips.push(powerLabel(p as BossPower, n));
  return chips;
}

export function totalStars(q: QuestSave) {
  return Object.values(q.stars).reduce((a, b) => a + b, 0);
}

// Stars: any win is 1, winning by 10% is 2 (most wins), the third takes a blowout.
export const STAR_RATIOS = [1, 1.1, 1.75] as const;

export function starsFor(mine: number, theirs: number): number {
  if (mine <= theirs) return 0;
  const ratio = mine / Math.max(1, theirs);
  return ratio >= STAR_RATIOS[2] ? 3 : ratio >= STAR_RATIOS[1] ? 2 : 1;
}

// Points needed for the next star, or null when there's none left to get.
export function pointsToNextStar(mine: number, theirs: number): { stars: number; points: number } | null {
  const have = starsFor(mine, theirs);
  if (have >= 3) return null;
  const need = have === 0 ? theirs + 1 : Math.ceil(Math.max(1, theirs) * STAR_RATIOS[have] - 1e-9);
  return { stars: have + 1, points: Math.max(1, need - mine) };
}

// ---- saved progress ----

type Lost = { at: number; round: string };
export type Item = "bomb" | "shield" | "time";
export type Inventory = Record<Item, number>;
export type QuestSave = {
  unlocked: number;
  stars: Record<number, number>;
  lost: Lost[];
  applied: string[];
  coins: number;
  items: Inventory;
  // your best score against each level's opponent, and theirs in that round
  best: Record<number, { me: number; them: number }>;
  // Date.now() of each rewarded ad watched (capped per 24 h)
  ads: number[];
};

const KEY = "boggled:quest";
const EMPTY: QuestSave = { unlocked: 1, stars: {}, lost: [], applied: [], coins: 0, items: { bomb: 0, shield: 0, time: 0 }, best: {}, ads: [] };

export function loadQuest(): QuestSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const q = { ...EMPTY, ...JSON.parse(raw) };
    return { ...q, items: { ...EMPTY.items, ...q.items } };
  } catch {
    return { ...EMPTY };
  }
}

function saveQuest(q: QuestSave) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {}
}

function activeLost(q: QuestSave, now: number) {
  return q.lost.filter((l) => now - l.at < LIFE_REFILL_MS);
}

export function livesLeft(q: QuestSave, now = Date.now()): number {
  return Math.max(0, MAX_LIVES - activeLost(q, now).length);
}

export function nextLifeAt(q: QuestSave, now = Date.now()): number | null {
  const lost = activeLost(q, now);
  if (!lost.length) return null;
  return Math.min(...lost.map((l) => l.at)) + LIFE_REFILL_MS;
}

// The current level: the first one not yet beaten (stays on 20 once the quest is complete).
export function currentLevel(q: QuestSave) {
  return Math.min(MAX_LEVEL, q.unlocked);
}

// A quest round costs a life up front (so quitting mid-round still counts); winning or tying refunds it.
export function spendLife(roundId: string, now = Date.now()): boolean {
  const q = loadQuest();
  if (q.lost.some((l) => l.round === roundId)) return true;
  if (livesLeft(q, now) <= 0) return false;
  q.lost = [...activeLost(q, now), { at: now, round: roundId }];
  saveQuest(q);
  return true;
}

// ---- coins ----

export type CoinReward = { total: number; parts: [label: string, coins: number][] };

// Every game pays something (more for more points), wins pay by level and stars, and first clears pay a bonus.
// Losing a boss a few times and replaying earlier levels should buy roughly one power-up per win.
export function coinsFor(o: { level: number; score: number; won: boolean; stars: number; firstClear: boolean; practice?: boolean }): CoinReward {
  const parts: CoinReward["parts"] = [];
  const played = Math.min(20, Math.floor(o.score / 3));
  if (o.practice) {
    const n = Math.min(10, Math.floor(played / 2));
    return { total: n, parts: n ? [["🎯", n]] : [] };
  }
  if (played) parts.push(["📝", played]);
  if (o.won) {
    parts.push(["🏆", 10 + o.level * 2]);
    const starBonus = [0, 0, 5, 15 + o.level][o.stars];
    if (starBonus) parts.push([`${"★".repeat(o.stars)}`, starBonus]);
    if (o.firstClear) parts.push([questLevel(o.level).boss ? "👑" : "🚩", questLevel(o.level).boss ? 50 + o.level * 5 : 10 + o.level]);
  }
  return { total: parts.reduce((s, [, n]) => s + n, 0), parts };
}

export const SHOP: { item: Item | "life"; emoji: string; name: string; blurb: string; price: number }[] = [
  { item: "bomb", emoji: "💣", name: "Bomb", blurb: "Stun your opponent: they lose the words they'd find in the next 8 s", price: 40 },
  { item: "shield", emoji: "🛡️", name: "Shield", blurb: "Blocks the next boss bomb or flip automatically", price: 30 },
  { item: "time", emoji: "⏱️", name: "Extra time", blurb: "+15 seconds on your clock, any time in a round", price: 25 },
  { item: "life", emoji: "❤️", name: "Life", blurb: "Refill one life right now", price: 60 },
];
// How many of each item can be used in one round.
export const ITEM_LIMIT = 2;
export const AD_LIVES_PER_DAY = 3;

export function buy(item: Item | "life", now = Date.now()): QuestSave | null {
  const q = loadQuest();
  const entry = SHOP.find((s) => s.item === item)!;
  if (q.coins < entry.price) return null;
  if (item === "life") {
    if (!refillOne(q, now)) return null;
  } else {
    q.items = { ...q.items, [item]: q.items[item] + 1 };
  }
  q.coins -= entry.price;
  saveQuest(q);
  return q;
}

// Uses one item from the inventory; false when there's none.
export function spendItem(item: Item): boolean {
  const q = loadQuest();
  if (q.items[item] <= 0) return false;
  q.items = { ...q.items, [item]: q.items[item] - 1 };
  saveQuest(q);
  return true;
}

function refillOne(q: QuestSave, now: number) {
  const lost = activeLost(q, now).sort((a, b) => a.at - b.at);
  if (!lost.length) return false;
  q.lost = lost.slice(1);
  return true;
}

export function adsLeft(q: QuestSave, now = Date.now()) {
  return AD_LIVES_PER_DAY - q.ads.filter((t) => now - t < LIFE_REFILL_MS).length;
}

// A rewarded ad gives back one life (a few times a day).
export function adLife(now = Date.now()): QuestSave | null {
  const q = loadQuest();
  if (adsLeft(q, now) <= 0 || !refillOne(q, now)) return null;
  q.ads = [...q.ads.filter((t) => now - t < LIFE_REFILL_MS), now];
  saveQuest(q);
  return q;
}

export function recordPractice(roundId: string, level: number, score: number): CoinReward {
  const q = loadQuest();
  const reward = coinsFor({ level, score, won: false, stars: 0, firstClear: false, practice: true });
  if (!q.applied.includes(roundId)) {
    q.coins += reward.total;
    q.applied = [...q.applied.slice(-30), roundId];
    saveQuest(q);
  }
  return reward;
}

export type QuestOutcome = {
  level: number;
  won: boolean;
  tie: boolean;
  stars: number;
  bestStars: number;
  newBest: boolean;
  // this win opened the next level for the first time
  advanced: boolean;
  bossBeaten: boolean;
  questComplete: boolean;
  lives: number;
  coins: CoinReward;
};

export function recordQuestRound(roundId: string, level: number, mine: number, theirs: number, now = Date.now()): QuestOutcome {
  const q = loadQuest();
  const won = mine > theirs;
  const tie = mine === theirs;
  const stars = starsFor(mine, theirs);
  const prevBest = q.stars[level] ?? 0;
  const first = !q.applied.includes(roundId);
  const advanced = won && q.unlocked === level;
  const coins = coinsFor({ level, score: mine, won, stars, firstClear: advanced });
  if (first) {
    q.coins += coins.total;
    const best = q.best[level];
    if (!best || mine > best.me) q.best = { ...q.best, [level]: { me: mine, them: theirs } };
    if (won || tie) q.lost = q.lost.filter((l) => l.round !== roundId);
    if (stars > prevBest) q.stars = { ...q.stars, [level]: stars };
    if (advanced) q.unlocked = level + 1;
    q.applied = [...q.applied.slice(-30), roundId];
    saveQuest(q);
  }
  const l = questLevel(level);
  return {
    level,
    won,
    tie,
    stars,
    bestStars: Math.max(prevBest, stars),
    newBest: first ? stars > prevBest : false,
    advanced: first ? advanced : false,
    bossBeaten: won && l.boss,
    questComplete: won && l.final,
    lives: livesLeft(q, now),
    coins,
  };
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}
