import { questLevel } from "./quest";
import { seededRng } from "./rng";
import type { Member } from "./transport";

// Quick Start opponent. Not an AI: it picks real words off the board on a schedule tuned by its skill.
// The id is fixed (analytics and tallies key on it); name and emoji come from the quest level being played.
export const BOT: Member = { id: "bot:hoot", name: "Dr. Hoot", emoji: "🦉", joinedAt: Number.MAX_SAFE_INTEGER };

export function botFor(level: number): Member {
  const l = questLevel(level);
  return { ...BOT, name: l.name, emoji: l.emoji };
}

export type BotPick = { word: string; at: number };
export type BossAttack = { at: number; weapon: "bomb" | "flip" };

export function isBot(id: string) {
  return id === BOT.id;
}

// How many words the bot finds in a 2-minute round at a given skill (scaled by duration).
export function botWordTarget(skill: number, durationMs: number) {
  return Math.round((3 + 3.5 * skill) * (durationMs / 120_000));
}

const FRENZY_MS = 20_000;

// frenzy: the boss finds an extra burst of words (30% more) in the last 20 seconds.
export function planBot(words: string[], skill: number, durationMs: number, seed: string, frenzy = false): BotPick[] {
  const rng = seededRng(`bot:${seed}`);
  const base = Math.min(botWordTarget(skill, durationMs), Math.floor(words.length * 0.7));
  if (base <= 0) return [];
  const extra = frenzy ? Math.min(Math.round(base * 0.3), Math.floor(words.length * 0.85) - base) : 0;
  // Low skill mostly finds short words; high skill goes hunting for long ones.
  const lengthBias = (skill - 4) * 0.08;
  const picked = words
    .map((word) => ({ word, key: rng() * Math.max(0.2, 1 + lengthBias * (word.length - 3)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, base + Math.max(0, extra))
    .map((p) => p.word);
  const warmup = 2500;
  const span = durationMs - warmup - 1500;
  const plan = picked.slice(0, base).map((word, i) => ({ word, at: Math.round(warmup + span * Math.pow((i + 0.2 + 0.6 * rng()) / base, 1.1)) }));
  const frenzyStart = Math.max(warmup, durationMs - FRENZY_MS);
  for (const word of picked.slice(base)) plan.push({ word, at: Math.round(frenzyStart + (durationMs - 1500 - frenzyStart) * rng()) });
  return plan.sort((a, b) => a.at - b.at);
}

// Boss attacks land spread across the middle of the round, never in the first 12 or last 8 seconds.
export function planBossAttacks(bombs: number, flips: number, durationMs: number, seed: string): BossAttack[] {
  const rng = seededRng(`boss:${seed}`);
  const weapons: BossAttack["weapon"][] = [];
  for (let i = 0; i < Math.max(bombs, flips); i++) {
    if (i < bombs) weapons.push("bomb");
    if (i < flips) weapons.push("flip");
  }
  const start = 12_000;
  const span = Math.max(1, durationMs - start - 8_000);
  return weapons.map((weapon, i) => ({ weapon, at: Math.round(start + (span * (i + 0.2 + 0.6 * rng())) / weapons.length) }));
}
