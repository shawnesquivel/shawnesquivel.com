import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { findPath, generateBoard, isValidPath, pathWord, solve, type Board } from "@/lib/boggled/board";
import { BIG_DICE_5X5, CLASSIC_DICE_4X4, rollDice } from "@/lib/boggled/dice";
import { Dictionary } from "@/lib/boggled/dictionary";
import { seededRng } from "@/lib/boggled/rng";
import { scoreRound, wordPoints } from "@/lib/boggled/scoring";

let dict: Dictionary;

beforeAll(() => {
  dict = Dictionary.fromText(readFileSync(path.resolve(__dirname, "../../../public/boggled/words.txt"), "utf8"));
});

// C A T S
// O R E Z
// D QU X Y
// B L E N
const board: Board = {
  size: 4,
  tiles: ["C", "A", "T", "S", "O", "R", "E", "Z", "D", "QU", "X", "Y", "B", "L", "E", "N"],
};

describe("dice", () => {
  it("has the right dice counts", () => {
    expect(CLASSIC_DICE_4X4).toHaveLength(16);
    expect(BIG_DICE_5X5).toHaveLength(25);
  });

  it("rolls deterministically per seed and maps Q to QU", () => {
    const a = rollDice(4, seededRng("abc"));
    const b = rollDice(4, seededRng("abc"));
    expect(a).toEqual(b);
    expect(a).toHaveLength(16);
    for (let i = 0; i < 200; i++) {
      for (const t of rollDice(5, seededRng(`s${i}`))) expect(t === "QU" || /^[A-Z]$/.test(t)).toBe(true);
    }
  });
});

describe("dictionary", () => {
  it("knows words and prefixes", () => {
    expect(dict.has("cat")).toBe(true);
    expect(dict.has("xqz")).toBe(false);
    expect(dict.hasPrefix("quee")).toBe(true);
    expect(dict.hasPrefix("xqz")).toBe(false);
  });
});

describe("paths", () => {
  it("validates adjacency and reuse", () => {
    expect(isValidPath(board, [0, 1, 2])).toBe(true);
    expect(pathWord(board, [0, 1, 2])).toBe("cat");
    expect(isValidPath(board, [0, 2])).toBe(false);
    expect(isValidPath(board, [0, 1, 0])).toBe(false);
    expect(isValidPath(board, [0, 5, 6])).toBe(true);
  });

  it("finds paths including diagonals and the QU tile", () => {
    expect(findPath(board, "cats")).toEqual([0, 1, 2, 3]);
    expect(findPath(board, "core")).toEqual([0, 4, 5, 6]);
    expect(pathWord(board, [9, 6])).toBe("que");
    expect(findPath(board, "zzz")).toBeNull();
  });
});

describe("solver and board generation", () => {
  it("solves a known board", () => {
    const words = solve(board, dict);
    for (const w of ["cat", "cats", "core", "rate", "tear"]) expect(words.has(w)).toBe(true);
    for (const [w, p] of words) {
      expect(isValidPath(board, p)).toBe(true);
      expect(pathWord(board, p)).toBe(w);
    }
  });

  it("generates the same playable board for the same seed", () => {
    const a = generateBoard(4, "room-1", dict);
    const b = generateBoard(4, "room-1", dict);
    expect(a).toEqual(b);
    expect(solve(a, dict).size).toBeGreaterThanOrEqual(45);
    expect(generateBoard(5, "room-1", dict).tiles).toHaveLength(25);
  });

  it("solves fast enough for a phone", () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) solve(generateBoard(4, `perf-${i}`), dict);
    expect((performance.now() - start) / 20).toBeLessThan(50);
  });
});

describe("scoring", () => {
  it("scores by length", () => {
    expect([wordPoints("ab"), wordPoints("cat"), wordPoints("cats"), wordPoints("crate"), wordPoints("crates")]).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect(wordPoints("queen")).toBe(3);
  });

  it("doubles unique words and awards the longest word bonus in multiplayer", () => {
    const result = scoreRound(
      [
        { id: "a", words: ["cat", "cats", "crate", "CAT"] },
        { id: "b", words: ["cat", "tear", "rates"] },
      ],
      { longestWordBonus: true },
    );
    const a = result.players.find((p) => p.id === "a")!;
    const b = result.players.find((p) => p.id === "b")!;
    // a: cat 1 (shared) + cats 2*2 + crate 3*2 = 11, + longest tie 3
    expect(a.wordPoints).toBe(11);
    // b: cat 1 + tear 2*2 + rates 3*2 = 11, + longest tie 3
    expect(b.wordPoints).toBe(11);
    expect(result.longestLength).toBe(5);
    expect(result.longestWinners.sort()).toEqual(["a", "b"]);
    expect(a.total).toBe(14);
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(1);
    expect(a.words.map((w) => w.word)).toEqual(["crate", "cats", "cat"]);
  });

  it("does not double or award bonus in solo play", () => {
    const result = scoreRound([{ id: "a", words: ["cat", "crate"] }], { longestWordBonus: true });
    expect(result.players[0].total).toBe(4);
  });

  it("drops invalid words when a validator is given", () => {
    const result = scoreRound(
      [
        { id: "a", words: ["cat", "zzzz"] },
        { id: "b", words: [] },
      ],
      { longestWordBonus: false, isValid: (w) => dict.has(w) },
    );
    expect(result.players[0].words.map((w) => w.word)).toEqual(["cat"]);
    expect(result.players[0].total).toBe(2);
  });
});
