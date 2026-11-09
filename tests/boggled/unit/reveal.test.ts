import { describe, expect, it } from "vitest";
import { revealOrder, revealTotals } from "@/lib/boggled/reveal";
import { wordPoints } from "@/lib/boggled/scoring";

const scored = (ws: string[]) => ws.map((word) => ({ word, points: wordPoints(word) }));

describe("head-to-head reveal", () => {
  const mine = scored(["cat", "dog", "tree", "stone", "planet", "art"]);
  const theirs = scored(["cat", "rat", "bird", "trees", "art", "tea"]);
  const steps = revealOrder(mine, theirs);

  it("reveals every word once and ends on the true totals", () => {
    const words = new Set([...mine, ...theirs].map((w) => w.word));
    expect(steps.map((s) => s.word).sort()).toEqual([...words].sort());
    const { totals } = revealTotals(steps);
    const sum = (ws: { points: number }[]) => ws.reduce((t, w) => t + w.points, 0);
    expect(totals.at(-1)).toMatchObject({ me: sum(mine), them: sum(theirs) });
  });

  it("shows shared words on both sides in the same step", () => {
    for (const w of ["cat", "art"]) {
      const s = steps.find((x) => x.word === w)!;
      expect(s.me).toBe(1);
      expect(s.them).toBe(1);
    }
  });

  it("lets whoever is behind go next, so the lead changes hands", () => {
    const { swings } = revealTotals(revealOrder(scored(["cat", "dogs", "tiger", "planet"]), scored(["rat", "bird", "hello", "orange"])));
    expect(swings).toBeGreaterThanOrEqual(2);
  });

  it("ends with the winner pulling away once the loser runs out", () => {
    const s = revealOrder(scored(["cat", "dog", "pig", "cow", "hen"]), scored(["rat"]));
    expect(s.slice(-3).every((x) => x.me !== null && x.them === null)).toBe(true);
  });

  it("handles a side with no words", () => {
    expect(revealOrder([], scored(["rat", "bat"]))).toHaveLength(2);
    expect(revealOrder([], [])).toEqual([]);
  });
});
