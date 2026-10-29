import { describe, expect, it } from "vitest";
import { applyRound, EMPTY_BESTS } from "@/lib/boggled/bests";
import { scoreRound } from "@/lib/boggled/scoring";
import { seriesStatus, type SeriesRecords } from "@/lib/boggled/series";

describe("series", () => {
  const rec = (...rounds: string[][]): SeriesRecords =>
    Object.fromEntries(rounds.map((winners, i) => [`r${i}`, { seriesId: "s", winners }]));

  it("crowns the first to a majority in a best of 3", () => {
    expect(seriesStatus(rec(["a"]), { id: "s", length: 3 }).champion).toBeNull();
    const s = seriesStatus(rec(["a"], ["b"], ["a"]), { id: "s", length: 3 });
    expect(s.champion).toBe("a");
    expect(s.wins).toEqual({ a: 2, b: 1 });
    expect(seriesStatus(rec(["a"], ["a"]), { id: "s", length: 3 }).champion).toBe("a");
  });

  it("keeps going on a tie (sudden death) and ignores other series", () => {
    const tied = rec(["a"], ["b"], ["a", "b"]);
    expect(seriesStatus(tied, { id: "s", length: 3 }).champion).toBeNull();
    expect(seriesStatus({ ...tied, r9: { seriesId: "s", winners: ["b"] } }, { id: "s", length: 3 }).champion).toBe("b");
    expect(seriesStatus({ x: { seriesId: "other", winners: ["a"] } }, { id: "s", length: 5 }).games).toBe(0);
  });
});

describe("personal bests", () => {
  it("records silently on the first round, then celebrates beating it", () => {
    const first = applyRound(EMPTY_BESTS, { key: "4x4-120s", score: 20, words: ["cat", "stone"] });
    expect(first.newScore).toBe(false);
    expect(first.next.score["4x4-120s"]).toBe(20);
    const second = applyRound(first.next, { key: "4x4-120s", score: 25, words: ["stoned"] });
    expect(second).toMatchObject({ newScore: true, prevScore: 20, newLongest: true });
    const worse = applyRound(second.next, { key: "4x4-120s", score: 10, words: ["cat"] });
    expect(worse.newScore).toBe(false);
    expect(worse.next.score["4x4-120s"]).toBe(25);
  });

  it("keeps separate bests per board/timer", () => {
    const a = applyRound(EMPTY_BESTS, { key: "4x4-120s", score: 30, words: [] });
    const b = applyRound(a.next, { key: "5x5-60s", score: 5, words: [] });
    expect(b.prevScore).toBeNull();
    expect(b.next.score).toEqual({ "4x4-120s": 30, "5x5-60s": 5 });
  });
});

describe("danger zone bonus", () => {
  it("adds 10% (rounded up) of the points scored on late words", () => {
    const r = scoreRound(
      [
        { id: "a", words: ["stone", "cat", "tea"], late: ["stone", "cat"] },
        { id: "b", words: ["tea"] },
      ],
      { longestWordBonus: false, dangerBoost: 0.1 },
    );
    const a = r.players.find((p) => p.id === "a")!;
    // late points: stone 3 + cat 1 = 4 → ceil(0.4) = 1 (no ×2 head-to-head)
    expect(a.dangerBonus).toBe(1);
    expect(a.total).toBe(3 + 1 + 1 + 1);
    expect(scoreRound([{ id: "a", words: ["stone"], late: ["stone"] }], { longestWordBonus: false }).players[0].dangerBonus).toBe(0);
  });
});
