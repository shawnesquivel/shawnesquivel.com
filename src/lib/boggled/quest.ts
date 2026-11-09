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
  ["Bun Bun", "🐰", "Just learned to spell CARROT. Mostly.", 1.0],
  ["Shelly", "🐢", "Slow and steady. Mostly slow.", 1.6],
  ["Pip", "🐤", "Only tweets in three-letter words.", 2.2],
  ["Sir Nutsworth", "🐿️", "Hoards words like acorns.", 2.8],
  ["Dr. Hoot", "🦉", "Gym leader of the Grounds. Hoots in iambic pentameter.", 3.6],
  ["Fern", "🐸", "Ribbits exclusively in vowels.", 3.8],
  ["Bramble", "🦔", "Very prickly about spelling.", 4.3],
  ["Rocco", "🦝", "Steals words when you blink.", 4.8],
  ["Luna", "🐺", "Howls at long words.", 5.3],
  ["Countess Vix", "🦊", "Rules the Woods. Flips your letters for fun.", 6.0],
  ["Sandy", "🦎", "Basks in the sun. Spells in the shade.", 6.2],
  ["Scorch", "🦂", "Stings with suffixes.", 6.7],
  ["Humphrey", "🐪", "Stores words in his hump for later.", 7.2],
  ["Mirage", "🐍", "Is that a word? Is it real? Sss.", 7.7],
  ["The Sphinx", "🦁", "Answer my riddles or lose your vowels.", 8.5],
  ["Billy", "🐐", "Climbs letter grids for breakfast.", 8.7],
  ["Talon", "🦅", "Spots 7-letter words from a mile up.", 9.2],
  ["Frost", "🐻‍❄️", "Cold, calculating, alphabetical.", 9.7],
  ["Grimwald", "🧙", "Casts spells. Literally, he spells.", 10.3],
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

// Stars: any win is 1, a clear win 2, a blowout 3.
export function starsFor(mine: number, theirs: number): number {
  if (mine <= theirs) return 0;
  const ratio = mine / Math.max(1, theirs);
  return ratio >= 1.6 ? 3 : ratio >= 1.25 ? 2 : 1;
}

// ---- saved progress ----

type Lost = { at: number; round: string };
export type QuestSave = { unlocked: number; stars: Record<number, number>; lost: Lost[]; applied: string[] };

const KEY = "boggled:quest";
const EMPTY: QuestSave = { unlocked: 1, stars: {}, lost: [], applied: [] };

export function loadQuest(): QuestSave {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
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
};

export function recordQuestRound(roundId: string, level: number, mine: number, theirs: number, now = Date.now()): QuestOutcome {
  const q = loadQuest();
  const won = mine > theirs;
  const tie = mine === theirs;
  const stars = starsFor(mine, theirs);
  const prevBest = q.stars[level] ?? 0;
  const first = !q.applied.includes(roundId);
  const advanced = won && q.unlocked === level;
  if (first) {
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
  };
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}
