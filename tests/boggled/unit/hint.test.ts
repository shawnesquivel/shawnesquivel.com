import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findPath, generateBoard, pathWord } from "@/lib/boggled/board";
import { Dictionary } from "@/lib/boggled/dictionary";
import { pickHint } from "@/lib/boggled/hint";

const dict = Dictionary.fromText(readFileSync(path.resolve(__dirname, "../../../public/boggled/words.txt"), "utf8"));

describe("opening hint", () => {
  it("picks a real short word with a valid path, preferring everyday words", () => {
    let common = 0;
    for (let i = 0; i < 40; i++) {
      const board = generateBoard(4, `hint-${i}`, dict);
      const hint = pickHint(board, dict, 3, `r${i}`)!;
      expect(hint.word).toHaveLength(3);
      expect(dict.has(hint.word)).toBe(true);
      expect(pathWord(board, hint.path).toLowerCase()).toBe(hint.word);
      expect(findPath(board, hint.word)).not.toBeNull();
      if (["nae", "mir", "aal", "zee"].includes(hint.word)) common--;
      else common++;
    }
    expect(common).toBeGreaterThan(30);
  });

  it("matches the minimum word length", () => {
    const board = generateBoard(5, "hint-5", dict);
    expect(pickHint(board, dict, 4, "x")!.word).toHaveLength(4);
  });
});
