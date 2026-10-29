import { rollDice, type BoardSize } from "./dice";
import type { Dictionary } from "./dictionary";
import { seededRng } from "./rng";

export type Board = {
  size: BoardSize;
  tiles: string[];
};

const neighborCache = new Map<number, number[][]>();

export function neighbors(size: number): number[][] {
  const cached = neighborCache.get(size);
  if (cached) return cached;
  const result: number[][] = [];
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const list: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) list.push(nr * size + nc);
      }
    }
    result.push(list);
  }
  neighborCache.set(size, result);
  return result;
}

export function isAdjacent(size: number, a: number, b: number): boolean {
  return neighbors(size)[a].includes(b);
}

export function pathWord(board: Board, path: number[]): string {
  return path.map((i) => board.tiles[i]).join("").toLowerCase();
}

export function isValidPath(board: Board, path: number[]): boolean {
  const seen = new Set<number>();
  for (let k = 0; k < path.length; k++) {
    const i = path[k];
    if (i < 0 || i >= board.tiles.length || seen.has(i)) return false;
    if (k > 0 && !isAdjacent(board.size, path[k - 1], i)) return false;
    seen.add(i);
  }
  return path.length > 0;
}

export function findPath(board: Board, word: string): number[] | null {
  const target = word.toLowerCase();
  const adj = neighbors(board.size);
  const tiles = board.tiles.map((t) => t.toLowerCase());
  const used = new Array<boolean>(tiles.length).fill(false);
  const path: number[] = [];

  const dfs = (i: number, offset: number): boolean => {
    const tile = tiles[i];
    if (!target.startsWith(tile, offset)) return false;
    used[i] = true;
    path.push(i);
    const next = offset + tile.length;
    if (next === target.length) return true;
    for (const n of adj[i]) {
      if (!used[n] && dfs(n, next)) return true;
    }
    used[i] = false;
    path.pop();
    return false;
  };

  for (let i = 0; i < tiles.length; i++) {
    if (dfs(i, 0)) return [...path];
  }
  return null;
}

export function solve(board: Board, dict: Dictionary, minLength = 3): Map<string, number[]> {
  const adj = neighbors(board.size);
  const tiles = board.tiles.map((t) => t.toLowerCase());
  const used = new Array<boolean>(tiles.length).fill(false);
  const found = new Map<string, number[]>();
  const path: number[] = [];

  const dfs = (i: number, prefix: string) => {
    const word = prefix + tiles[i];
    if (!dict.hasPrefix(word)) return;
    used[i] = true;
    path.push(i);
    if (word.length >= minLength && !found.has(word) && dict.has(word)) found.set(word, [...path]);
    for (const n of adj[i]) if (!used[n]) dfs(n, word);
    used[i] = false;
    path.pop();
  };

  for (let i = 0; i < tiles.length; i++) dfs(i, "");
  return found;
}

export function generateBoard(
  size: BoardSize,
  seed: string,
  dict?: Dictionary,
  minWords = size === 5 ? 120 : 45,
): Board {
  const rng = seededRng(seed);
  let best: Board | null = null;
  let bestCount = -1;
  for (let attempt = 0; attempt < 25; attempt++) {
    const board: Board = { size, tiles: rollDice(size, rng) };
    if (!dict) return board;
    const count = solve(board, dict).size;
    if (count >= minWords) return board;
    if (count > bestCount) {
      best = board;
      bestCount = count;
    }
  }
  return best!;
}
