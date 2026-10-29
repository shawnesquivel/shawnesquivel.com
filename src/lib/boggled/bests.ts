// Personal bests live in localStorage, per device.
const KEY = "boggled:bests";

export type Bests = {
  // best round score per "4x4-120s" style setup, so a 3-minute 5×5 doesn't make 1-minute rounds hopeless
  score: Record<string, number>;
  longest: string;
  mostWords: number;
  rounds: number;
};

export const EMPTY_BESTS: Bests = { score: {}, longest: "", mostWords: 0, rounds: 0 };

export function bestKey(size: number, duration: number) {
  return `${size}x${size}-${duration}s`;
}

export function loadBests(): Bests {
  try {
    return { ...EMPTY_BESTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return EMPTY_BESTS;
  }
}

export type RoundStats = { key: string; score: number; words: string[] };

export type BestsUpdate = {
  next: Bests;
  newScore: boolean;
  newLongest: boolean;
  newMostWords: boolean;
  prevScore: number | null;
};

export function applyRound(prev: Bests, round: RoundStats): BestsUpdate {
  const prevScore = prev.score[round.key] ?? null;
  const longest = round.words.reduce((a, w) => (w.length > a.length ? w : a), "");
  const newScore = round.score > 0 && (prevScore === null || round.score > prevScore);
  const newLongest = longest.length > prev.longest.length;
  const newMostWords = round.words.length > prev.mostWords && prev.rounds > 0;
  return {
    next: {
      score: newScore ? { ...prev.score, [round.key]: round.score } : prev.score,
      longest: newLongest ? longest : prev.longest,
      mostWords: Math.max(prev.mostWords, round.words.length),
      rounds: prev.rounds + 1,
    },
    // The very first round is trivially a "best"; only celebrate once there's something to beat.
    newScore: newScore && prevScore !== null,
    newLongest: newLongest && prev.longest.length > 0,
    newMostWords,
    prevScore,
  };
}

export function saveBests(bests: Bests) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bests));
  } catch {}
}
