import { describe, expect, it } from "vitest";
import { leaderLine, leaderTitle, standings } from "@/lib/boggled/banter";

const t = (aWins: number, bWins: number, aPts = 10, bPts = 5) =>
  standings({
    a: { name: "Mama", emoji: "🦊", wins: aWins, points: aPts },
    b: { name: "Toy", emoji: "🐼", wins: bWins, points: bPts },
  });

describe("banter", () => {
  it("sorts by wins then points", () => {
    expect(t(1, 2).map((s) => s.id)).toEqual(["b", "a"]);
    expect(t(1, 1, 3, 9).map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("is silent before any multiplayer round", () => {
    expect(leaderLine(t(0, 0), 0)).toBeNull();
  });

  it("calls first blood, ties, sweeps and blowouts", () => {
    expect(leaderLine(t(1, 0), 1)).toContain("first blood");
    expect(leaderLine(t(2, 2), 4)).toMatch(/heat|neck|square/i);
    expect(leaderLine(t(3, 0), 3)).toMatch(/Mama/);
    expect(leaderLine(t(5, 1), 6)).toMatch(/Mama/);
    expect(leaderLine(t(5, 1), 6)).toMatch(/Toy/);
  });

  it("escalates titles with wins", () => {
    expect(leaderTitle(1)).toBe("Word Nerd");
    expect(leaderTitle(5)).toBe("Boggle Boss");
    expect(leaderTitle(99)).toBe("Dictionary Deity");
  });
});
