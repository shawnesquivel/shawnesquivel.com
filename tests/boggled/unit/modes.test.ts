import { beforeEach, describe, expect, it } from "vitest";
import { generateBoard } from "@/lib/boggled/board";
import { dailySeed, dayKey, loadStreak, recordDaily, recordSurvival, survivalBonusMs } from "@/lib/boggled/modes";

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

describe("Daily Puzzle", () => {
  it("gives everyone the same board for a day", () => {
    const a = generateBoard(4, dailySeed("2026-10-30"));
    expect(generateBoard(4, dailySeed("2026-10-30"))).toEqual(a);
    expect(generateBoard(4, dailySeed("2026-10-31"))).not.toEqual(a);
    expect(dayKey(new Date("2026-10-30T23:59:00Z"))).toBe("2026-10-30");
  });

  it("locks in the first score and treats replays as practice", () => {
    const first = recordDaily("r1", "2026-10-30", 20);
    expect(first).toMatchObject({ first: true, firstScore: 20, streak: 1 });
    expect(recordDaily("r1", "2026-10-30", 20).first).toBe(true);
    const replay = recordDaily("r2", "2026-10-30", 35);
    expect(replay).toMatchObject({ first: false, firstScore: 20, best: 35, streak: 1 });
  });

  it("builds a streak over consecutive days and resets after a gap", () => {
    recordDaily("a", "2026-10-28", 5);
    expect(recordDaily("b", "2026-10-29", 5).streak).toBe(2);
    expect(recordDaily("c", "2026-10-30", 5).streak).toBe(3);
    expect(loadStreak("2026-10-31")).toBe(3);
    expect(loadStreak("2026-11-01")).toBe(0);
    expect(recordDaily("d", "2026-11-02", 5).streak).toBe(1);
  });
});

describe("Survival", () => {
  it("adds more time for longer words", () => {
    const bonuses = ["cat", "frog", "tiger", "badger", "giraffe", "elephants"].map(survivalBonusMs);
    for (let i = 1; i < bonuses.length; i++) expect(bonuses[i]).toBeGreaterThanOrEqual(bonuses[i - 1]);
    expect(bonuses[0]).toBe(2000);
  });

  it("tracks the best run once per round", () => {
    expect(recordSurvival("r1", 45_000)).toMatchObject({ best: 45_000, isBest: false });
    expect(recordSurvival("r2", 60_000)).toMatchObject({ best: 60_000, prevBest: 45_000, isBest: true });
    expect(recordSurvival("r2", 60_000).isBest).toBe(false);
    expect(recordSurvival("r3", 30_000)).toMatchObject({ best: 60_000, isBest: false });
  });
});
