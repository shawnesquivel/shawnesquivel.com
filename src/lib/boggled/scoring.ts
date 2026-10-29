export const LONGEST_WORD_BONUS = 3;

export function wordPoints(word: string): number {
  return word.length < 3 ? 0 : word.length - 2;
}

export type PlayerWords = {
  id: string;
  words: string[];
};

export type ScoredWord = {
  word: string;
  base: number;
  unique: boolean;
  points: number;
};

export type PlayerResult = {
  id: string;
  words: ScoredWord[];
  wordPoints: number;
  longestBonus: number;
  total: number;
  rank: number;
};

export type RoundResult = {
  players: PlayerResult[];
  longestLength: number;
  longestWinners: string[];
};

export type ScoreOptions = {
  longestWordBonus: boolean;
  isValid?: (word: string) => boolean;
};

// Replay order: longest (most dramatic) words first, then alphabetical.
export function compareWords(a: string, b: string): number {
  return b.length - a.length || a.localeCompare(b);
}

export function scoreRound(players: PlayerWords[], opts: ScoreOptions): RoundResult {
  const multiplayer = players.length > 1;
  const cleaned = players.map((p) => ({
    id: p.id,
    words: [...new Set(p.words.map((w) => w.toLowerCase()))]
      .filter((w) => w.length >= 3 && (!opts.isValid || opts.isValid(w)))
      .sort(compareWords),
  }));

  const finders = new Map<string, number>();
  for (const p of cleaned) for (const w of p.words) finders.set(w, (finders.get(w) ?? 0) + 1);

  let longestLength = 0;
  for (const p of cleaned) for (const w of p.words) longestLength = Math.max(longestLength, w.length);
  const longestWinners =
    multiplayer && opts.longestWordBonus && longestLength > 0
      ? cleaned.filter((p) => p.words.some((w) => w.length === longestLength)).map((p) => p.id)
      : [];

  const results: PlayerResult[] = cleaned.map((p) => {
    const words = p.words.map((word) => {
      const base = wordPoints(word);
      const unique = multiplayer && finders.get(word) === 1;
      return { word, base, unique, points: unique ? base * 2 : base };
    });
    const wordTotal = words.reduce((sum, w) => sum + w.points, 0);
    const longestBonus = longestWinners.includes(p.id) ? LONGEST_WORD_BONUS : 0;
    return { id: p.id, words, wordPoints: wordTotal, longestBonus, total: wordTotal + longestBonus, rank: 0 };
  });

  const sorted = [...results].sort((a, b) => b.total - a.total);
  for (const r of results) r.rank = 1 + sorted.filter((o) => o.total > r.total).length;

  return { players: results.sort((a, b) => a.rank - b.rank), longestLength, longestWinners };
}
