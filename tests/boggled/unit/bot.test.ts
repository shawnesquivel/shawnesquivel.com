import { describe, expect, it } from "vitest";
import { botFor, botWordTarget, planBossAttacks, planBot } from "@/lib/boggled/bot";

const WORDS = Array.from({ length: 120 }, (_, i) => "abcdefghij".slice(0, 3 + (i % 6)) + i);

describe("quest bot", () => {
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

  it("adds a final frenzy of extra words in the last 20 seconds", () => {
    const calm = planBot(WORDS, 8, 120_000, "f");
    const wild = planBot(WORDS, 8, 120_000, "f", true);
    expect(wild.length).toBeGreaterThan(calm.length);
    expect(wild.filter((p) => p.at >= 100_000).length).toBeGreaterThan(calm.filter((p) => p.at >= 100_000).length);
    for (let i = 1; i < wild.length; i++) expect(wild[i].at).toBeGreaterThanOrEqual(wild[i - 1].at);
  });

  it("schedules boss attacks mid-round, in order", () => {
    const plan = planBossAttacks(2, 3, 120_000, "b");
    expect(plan.filter((p) => p.weapon === "bomb")).toHaveLength(2);
    expect(plan.filter((p) => p.weapon === "flip")).toHaveLength(3);
    for (let i = 1; i < plan.length; i++) expect(plan[i].at).toBeGreaterThan(plan[i - 1].at);
    expect(plan[0].at).toBeGreaterThanOrEqual(12_000);
    expect(plan.at(-1)!.at).toBeLessThanOrEqual(112_000);
    expect(planBossAttacks(0, 0, 120_000, "b")).toEqual([]);
  });

  it("takes its name and face from the quest level, keeping one id", () => {
    expect(botFor(5).name).toBe("Dr. Hoot");
    expect(botFor(20).emoji).toBe("🐉");
    expect(botFor(1).id).toBe(botFor(20).id);
  });
});
