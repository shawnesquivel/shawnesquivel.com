import { describe, expect, it } from "vitest";
import { botWordTarget, MAX_BOT_LEVEL, MIN_BOT_LEVEL, nextBotLevel, planBot } from "@/lib/boggled/bot";

const WORDS = Array.from({ length: 120 }, (_, i) => "abcdefghij".slice(0, 3 + (i % 6)) + i);

describe("Dr. Hoot", () => {
  it("finds more words at higher levels and scales with the timer", () => {
    expect(botWordTarget(1, 120_000)).toBeLessThan(botWordTarget(5, 120_000));
    expect(botWordTarget(5, 120_000)).toBeLessThan(botWordTarget(10, 120_000));
    expect(botWordTarget(6, 60_000)).toBe(Math.round(botWordTarget(6, 120_000) / 2));
  });

  it("plans a deterministic, time-ordered schedule inside the round", () => {
    const a = planBot(WORDS, 5, 120_000, "round1");
    expect(a).toEqual(planBot(WORDS, 5, 120_000, "round1"));
    expect(a.length).toBe(botWordTarget(5, 120_000));
    expect(new Set(a.map((p) => p.word)).size).toBe(a.length);
    for (let i = 1; i < a.length; i++) expect(a[i].at).toBeGreaterThanOrEqual(a[i - 1].at);
    expect(a[0].at).toBeGreaterThan(2000);
    expect(a.at(-1)!.at).toBeLessThan(120_000);
  });

  it("goes for longer words at higher levels", () => {
    const avg = (level: number) => {
      const plan = planBot(WORDS, level, 120_000, "seed");
      return plan.reduce((s, p) => s + p.word.length, 0) / plan.length;
    };
    expect(avg(10)).toBeGreaterThan(avg(1));
  });

  it("never takes most of a small board", () => {
    expect(planBot(WORDS.slice(0, 10), 10, 120_000, "x").length).toBe(7);
  });

  it("levels up when you win, down when you lose, and stays in range", () => {
    expect(nextBotLevel(3, "win")).toBe(4);
    expect(nextBotLevel(3, "loss")).toBe(2);
    expect(nextBotLevel(3, "tie")).toBe(3);
    expect(nextBotLevel(MAX_BOT_LEVEL, "win")).toBe(MAX_BOT_LEVEL);
    expect(nextBotLevel(MIN_BOT_LEVEL, "loss")).toBe(MIN_BOT_LEVEL);
  });
});
