import { beforeEach, describe, expect, it } from "vitest";
import { botWordTarget } from "@/lib/boggled/bot";
import {
  AD_LIVES_PER_DAY,
  adLife,
  adsLeft,
  buy,
  coinsFor,
  currentLevel,
  pointsToNextStar,
  recordPractice,
  spendItem,
  LEVELS,
  LIFE_REFILL_MS,
  livesLeft,
  loadQuest,
  MAX_LIVES,
  nextLifeAt,
  recordQuestRound,
  REGIONS,
  spendLife,
  starsFor,
} from "@/lib/boggled/quest";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

describe("quest levels", () => {
  it("has 20 levels in 4 regions with a boss every 5th and a final boss at 20", () => {
    expect(LEVELS).toHaveLength(20);
    expect(REGIONS).toHaveLength(4);
    expect(LEVELS.filter((l) => l.boss).map((l) => l.level)).toEqual([5, 10, 15, 20]);
    expect(LEVELS.filter((l) => l.final).map((l) => l.level)).toEqual([20]);
    for (const l of LEVELS) expect(l.region).toBe(Math.floor((l.level - 1) / 5));
  });

  it("gets strictly harder every level, with bosses packing powers", () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].skill).toBeGreaterThan(LEVELS[i - 1].skill);
    for (const l of LEVELS) expect(Object.keys(l.powers).length > 0).toBe(l.boss);
    const words = (n: number) => botWordTarget(LEVELS[n - 1].skill, LEVELS[n - 1].duration * 1000);
    expect(words(1)).toBeLessThan(10);
    expect(words(20)).toBeGreaterThan(words(19));
  });
});

describe("stars", () => {
  it("gives 0 for a loss or tie; 2 is easy (win by 10%), 3 takes a blowout (75%)", () => {
    expect(starsFor(10, 12)).toBe(0);
    expect(starsFor(10, 10)).toBe(0);
    expect(starsFor(21, 20)).toBe(1);
    expect(starsFor(22, 20)).toBe(2);
    expect(starsFor(34, 20)).toBe(2);
    expect(starsFor(35, 20)).toBe(3);
    expect(starsFor(3, 0)).toBe(3);
  });

  it("says how many points the next star needs", () => {
    expect(pointsToNextStar(18, 20)).toEqual({ stars: 1, points: 3 });
    expect(pointsToNextStar(21, 20)).toEqual({ stars: 2, points: 1 });
    expect(pointsToNextStar(22, 20)).toEqual({ stars: 3, points: 13 });
    expect(pointsToNextStar(35, 20)).toBeNull();
    for (const [m, t] of [[21, 20], [22, 20], [5, 9]]) {
      const n = pointsToNextStar(m, t)!;
      expect(starsFor(m + n.points, t)).toBeGreaterThanOrEqual(n.stars);
      expect(starsFor(m + n.points - 1, t)).toBeLessThan(n.stars);
    }
  });
});

describe("lives and progress", () => {
  it("costs a life per round, refunds it on a win, and unlocks the next level once", () => {
    expect(spendLife("r1", 1000)).toBe(true);
    expect(livesLeft(loadQuest(), 1000)).toBe(MAX_LIVES - 1);
    const o = recordQuestRound("r1", 1, 20, 10, 1000);
    expect(o).toMatchObject({ won: true, stars: 3, advanced: true, lives: MAX_LIVES });
    expect(o.coins.total).toBeGreaterThan(0);
    expect(loadQuest().coins).toBe(o.coins.total);
    expect(loadQuest().best[1]).toEqual({ me: 20, them: 10 });
    expect(currentLevel(loadQuest())).toBe(2);
    // Results remount: same round again changes nothing.
    expect(recordQuestRound("r1", 1, 20, 10, 1000).advanced).toBe(false);
    expect(loadQuest().coins).toBe(o.coins.total);
    expect(currentLevel(loadQuest())).toBe(2);
  });

  it("keeps the life on a loss and never drops a level", () => {
    spendLife("r1", 0);
    recordQuestRound("r1", 1, 20, 10, 0);
    spendLife("r2", 0);
    const o = recordQuestRound("r2", 2, 5, 10, 0);
    expect(o).toMatchObject({ won: false, advanced: false, lives: MAX_LIVES - 1 });
    expect(currentLevel(loadQuest())).toBe(2);
  });

  it("runs out after 5 losses and refills each one 24 hours after it was lost", () => {
    for (let i = 0; i < MAX_LIVES; i++) {
      expect(spendLife(`r${i}`, i * 1000)).toBe(true);
      recordQuestRound(`r${i}`, 1, 0, 5, i * 1000);
    }
    expect(livesLeft(loadQuest(), 5000)).toBe(0);
    expect(spendLife("nope", 5000)).toBe(false);
    expect(nextLifeAt(loadQuest(), 5000)).toBe(LIFE_REFILL_MS);
    expect(livesLeft(loadQuest(), LIFE_REFILL_MS)).toBe(1);
    expect(livesLeft(loadQuest(), LIFE_REFILL_MS + 4000)).toBe(MAX_LIVES);
  });

  it("keeps the best star count when replaying a beaten level", () => {
    spendLife("a", 0);
    recordQuestRound("a", 1, 30, 10, 0);
    spendLife("b", 0);
    const o = recordQuestRound("b", 1, 21, 20, 0);
    expect(o).toMatchObject({ stars: 1, bestStars: 3, newBest: false, advanced: false });
    expect(loadQuest().stars[1]).toBe(3);
  });

  it("flags beating a boss and finishing the quest", () => {
    store.set("boggled:quest", JSON.stringify({ unlocked: 20, stars: {}, lost: [], applied: [] }));
    spendLife("f", 0);
    expect(recordQuestRound("f", 20, 50, 40, 0)).toMatchObject({ bossBeaten: true, questComplete: true, advanced: true });
    expect(currentLevel(loadQuest())).toBe(20);
  });
});

describe("coins, shop and ads", () => {
  it("pays every game, more for wins, stars, first clears and bosses", () => {
    const loss = coinsFor({ level: 7, score: 30, won: false, stars: 0, firstClear: false });
    const win = coinsFor({ level: 7, score: 30, won: true, stars: 2, firstClear: false });
    const three = coinsFor({ level: 7, score: 30, won: true, stars: 3, firstClear: false });
    const first = coinsFor({ level: 7, score: 30, won: true, stars: 3, firstClear: true });
    const boss = coinsFor({ level: 10, score: 30, won: true, stars: 3, firstClear: true });
    expect(loss.total).toBeGreaterThan(0);
    expect(win.total).toBeGreaterThan(loss.total);
    expect(three.total).toBeGreaterThan(win.total);
    expect(first.total).toBeGreaterThan(three.total);
    expect(boss.parts.some(([l]) => l === "👑")).toBe(true);
    expect(coinsFor({ level: 7, score: 30, won: false, stars: 0, firstClear: false, practice: true }).total).toBeLessThanOrEqual(10);
  });

  it("buys items with coins and spends them", () => {
    store.set("boggled:quest", JSON.stringify({ unlocked: 1, coins: 50 }));
    expect(buy("bomb")!.items.bomb).toBe(1);
    expect(loadQuest().coins).toBe(10);
    expect(buy("bomb")).toBeNull();
    expect(spendItem("bomb")).toBe(true);
    expect(spendItem("bomb")).toBe(false);
  });

  it("refills a life from the shop or an ad, with ads capped per day", () => {
    for (let i = 0; i < MAX_LIVES; i++) spendLife(`l${i}`, i);
    store.set("boggled:quest", JSON.stringify({ ...loadQuest(), coins: 60 }));
    expect(buy("life", 10)).not.toBeNull();
    expect(livesLeft(loadQuest(), 10)).toBe(1);
    for (let i = 0; i < AD_LIVES_PER_DAY; i++) expect(adLife(20 + i)).not.toBeNull();
    expect(adsLeft(loadQuest(), 30)).toBe(0);
    expect(adLife(30)).toBeNull();
    expect(livesLeft(loadQuest(), 30)).toBe(1 + AD_LIVES_PER_DAY);
  });

  it("pays a little for practice, once per round", () => {
    const r = recordPractice("p1", 3, 60);
    expect(r.total).toBe(10);
    recordPractice("p1", 3, 60);
    expect(loadQuest().coins).toBe(10);
  });
});
