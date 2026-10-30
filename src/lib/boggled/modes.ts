// Solo modes beyond Quick Start, modeled on Netflix Boggle Party's Daily Puzzle and Survival.
// Records live in localStorage, per device.

export type SoloMode = "quick" | "daily" | "survival";
export type Mode = SoloMode | "room";

export const DAILY_SECONDS = 90;
export const SURVIVAL_START_SECONDS = 30;

// Survival: every word adds time, longer words add more.
export function survivalBonusMs(word: string): number {
  const n = word.length;
  if (n <= 3) return 2000;
  if (n === 4) return 3000;
  if (n === 5) return 5000;
  if (n === 6) return 7000;
  return 10_000;
}

export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailySeed(day: string) {
  return `daily:${day}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

type DailyRecord = { day: string; first: number | null; best: number; plays: number; applied: string };
type Streak = { last: string; n: number };

const DAILY_KEY = "boggled:daily";
const STREAK_KEY = "boggled:dailyStreak";
const SURVIVAL_KEY = "boggled:survival";

export function loadDaily(day = dayKey()): DailyRecord {
  const rec = read<DailyRecord>(DAILY_KEY, { day, first: null, best: 0, plays: 0, applied: "" });
  return rec.day === day ? rec : { day, first: null, best: 0, plays: 0, applied: "" };
}

export function loadStreak(day = dayKey()): number {
  const s = read<Streak>(STREAK_KEY, { last: "", n: 0 });
  const yesterday = dayKey(new Date(Date.parse(day) - 86_400_000));
  return s.last === day || s.last === yesterday ? s.n : 0;
}

export type DailyResult = { day: string; score: number; first: boolean; firstScore: number; best: number; streak: number };

// Only the first play of the day counts (for ranking and the streak); replays are practice.
export function recordDaily(roundId: string, day: string, score: number): DailyResult {
  const rec = loadDaily(day);
  if (rec.applied === roundId) {
    return { day, score, first: rec.plays === 1, firstScore: rec.first ?? score, best: rec.best, streak: loadStreak(day) };
  }
  const first = rec.first === null;
  const next: DailyRecord = { day, first: first ? score : rec.first, best: Math.max(rec.best, score), plays: rec.plays + 1, applied: roundId };
  write(DAILY_KEY, next);
  let streak = loadStreak(day);
  if (first) {
    const s = read<Streak>(STREAK_KEY, { last: "", n: 0 });
    streak = s.last === day ? s.n : streak + 1;
    write(STREAK_KEY, { last: day, n: streak });
  }
  return { day, score, first, firstScore: next.first!, best: next.best, streak };
}

type SurvivalRecord = { best: number; runs: number; applied: string };

export function loadSurvivalBest(): number {
  return read<SurvivalRecord>(SURVIVAL_KEY, { best: 0, runs: 0, applied: "" }).best;
}

export type SurvivalResult = { survivedMs: number; best: number; prevBest: number; isBest: boolean };

export function recordSurvival(roundId: string, survivedMs: number): SurvivalResult {
  const rec = read<SurvivalRecord>(SURVIVAL_KEY, { best: 0, runs: 0, applied: "" });
  if (rec.applied === roundId) return { survivedMs, best: rec.best, prevBest: rec.best, isBest: false };
  const isBest = survivedMs > rec.best;
  const next = { best: Math.max(rec.best, survivedMs), runs: rec.runs + 1, applied: roundId };
  write(SURVIVAL_KEY, next);
  return { survivedMs, best: next.best, prevBest: rec.best, isBest: isBest && rec.runs > 0 };
}

export function formatSecs(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function dailyShareText(r: DailyResult, words: number, url: string) {
  const date = new Date(`${r.day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `Word Brawl Daily · ${date}\n🔤 ${r.firstScore} pts · ${words} words${r.streak > 1 ? ` · 🔥 ${r.streak}-day streak` : ""}\nSame board for everyone today. Beat me: ${url}`;
}
