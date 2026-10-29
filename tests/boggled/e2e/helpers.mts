import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import { solve, type Board } from "../../../src/lib/boggled/board";
import { Dictionary } from "../../../src/lib/boggled/dictionary";

export const BASE = process.env.BOGGLED_URL ?? "http://localhost:3000";
export const SHOTS = process.env.BOGGLED_SHOTS ?? "/opt/cursor/artifacts/screenshots";

let dict: Dictionary | null = null;
export function dictionary() {
  dict ??= Dictionary.fromText(readFileSync(path.resolve(import.meta.dirname, "../../../public/boggled/words.txt"), "utf8"));
  return dict;
}

export async function readBoard(page: Page): Promise<Board> {
  const tiles = await page.$$eval("[data-tile]", (els) => els.map((e) => (e.textContent ?? "").toUpperCase()));
  return { size: Math.round(Math.sqrt(tiles.length)) as 4 | 5, tiles };
}

export function wordsOn(board: Board, minLength = 3) {
  return [...solve(board, dictionary(), minLength).entries()].sort((a, b) => b[0].length - a[0].length);
}

// Drags through tile centres with intermediate points, like a finger would.
export async function swipe(page: Page, tilePath: number[]) {
  const centers = [];
  for (const i of tilePath) {
    const box = (await page.locator(`[data-tile="${i}"]`).boundingBox())!;
    centers.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  await page.mouse.move(centers[0].x, centers[0].y);
  await page.mouse.down();
  for (let k = 1; k < centers.length; k++) {
    await page.mouse.move(centers[k].x, centers[k].y, { steps: 6 });
  }
  await page.mouse.up();
}

export async function setName(page: Page, name: string) {
  await page.getByTestId("name").fill(name);
}

export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}
