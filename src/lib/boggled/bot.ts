import { seededRng } from "./rng";
import type { Member } from "./transport";

// Quick Start opponent. Not an AI: it picks real words off the board on a schedule tuned by its level,
// and the level follows the player (win → it levels up, lose → it goes easier).
export const BOT: Member = { id: "bot:hoot", name: "Dr. Hoot", emoji: "🦉", joinedAt: Number.MAX_SAFE_INTEGER };
export const MIN_BOT_LEVEL = 1;
export const MAX_BOT_LEVEL = 10;
export const START_BOT_LEVEL = 3;

export const BOT_TAGLINES: Record<number, string> = {
  1: "Just woke up. Still in pajamas.",
  2: "Had one coffee. Thinks he's unstoppable.",
  3: "Knows at least 40 words. Confidently.",
  4: "Practices spelling in the mirror.",
  5: "Ate a thesaurus for breakfast.",
  6: "Speaks fluent crossword.",
  7: "Hoots in iambic pentameter.",
  8: "Has strong opinions about the Oxford comma.",
  9: "Dreams in anagrams.",
  10: "Final form. Wears a tiny graduation cap.",
};

export type BotPick = { word: string; at: number };

const LEVEL_KEY = "boggled:botLevel";
const APPLIED_KEY = "boggled:botRound";

export function isBot(id: string) {
  return id === BOT.id;
}

function clampLevel(n: number) {
  return Math.min(MAX_BOT_LEVEL, Math.max(MIN_BOT_LEVEL, Math.round(n)));
}

export function loadBotLevel(): number {
  try {
    const v = Number(localStorage.getItem(LEVEL_KEY));
    return v ? clampLevel(v) : START_BOT_LEVEL;
  } catch {
    return START_BOT_LEVEL;
  }
}

export function nextBotLevel(level: number, outcome: "win" | "loss" | "tie"): number {
  return clampLevel(outcome === "win" ? level + 1 : outcome === "loss" ? level - 1 : level);
}

// Applies a round's result once (Results can remount); returns the new level.
export function recordBotRound(roundId: string, level: number, outcome: "win" | "loss" | "tie"): number {
  const next = nextBotLevel(level, outcome);
  try {
    if (localStorage.getItem(APPLIED_KEY) !== roundId) {
      localStorage.setItem(APPLIED_KEY, roundId);
      localStorage.setItem(LEVEL_KEY, String(next));
    }
  } catch {}
  return next;
}

// How many words the bot finds in a 2-minute round at each level (scaled by duration).
export function botWordTarget(level: number, durationMs: number) {
  return Math.round((3 + 3.5 * level) * (durationMs / 120_000));
}

export function planBot(words: string[], level: number, durationMs: number, seed: string): BotPick[] {
  const rng = seededRng(`bot:${seed}`);
  const count = Math.min(botWordTarget(level, durationMs), Math.floor(words.length * 0.7));
  if (count <= 0) return [];
  // Low levels mostly find short words; high levels go hunting for long ones.
  const lengthBias = (level - 4) * 0.08;
  const picked = words
    .map((word) => ({ word, key: rng() * Math.max(0.2, 1 + lengthBias * (word.length - 3)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((p) => p.word);
  const warmup = 2500;
  const span = durationMs - warmup - 1500;
  return picked.map((word, i) => ({ word, at: Math.round(warmup + span * Math.pow((i + 0.2 + 0.6 * rng()) / count, 1.1)) }));
}
