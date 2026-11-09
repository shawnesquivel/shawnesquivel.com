import { compareWords } from "./scoring";

type Scored = { word: string; points: number };
// One reveal beat: a word and the points it adds to each side (null = that side didn't find it).
export type RevealStep = { word: string; me: number | null; them: number | null };

const SHARED_EVERY = 3;

// Head-to-head reveal order, built for suspense: short words first, and whoever is behind reveals next,
// so the lead swings back and forth until one side runs out. Shared words land on both sides at once.
export function revealOrder(mine: Scored[], theirs: Scored[]): RevealStep[] {
  const asc = (a: Scored, b: Scored) => -compareWords(a.word, b.word);
  const theirMap = new Map(theirs.map((w) => [w.word, w.points]));
  const myMap = new Map(mine.map((w) => [w.word, w.points]));
  const shared = mine.filter((w) => theirMap.has(w.word)).sort(asc);
  const onlyMe = mine.filter((w) => !theirMap.has(w.word)).sort(asc);
  const onlyThem = theirs.filter((w) => !myMap.has(w.word)).sort(asc);

  const steps: RevealStep[] = [];
  let a = 0;
  let b = 0;
  let lastMe = true;
  while (shared.length || onlyMe.length || onlyThem.length) {
    if (shared.length && (steps.length % SHARED_EVERY === SHARED_EVERY - 1 || (!onlyMe.length && !onlyThem.length))) {
      const w = shared.shift()!;
      const them = theirMap.get(w.word)!;
      steps.push({ word: w.word, me: w.points, them });
      a += w.points;
      b += them;
      continue;
    }
    // On a tie, whoever just caught up keeps going and takes the lead.
    const wantMe: boolean = a < b || (a === b && lastMe);
    const me: boolean = onlyMe.length > 0 && (wantMe || onlyThem.length === 0);
    const w = (me ? onlyMe : onlyThem).shift()!;
    steps.push({ word: w.word, me: me ? w.points : null, them: me ? null : w.points });
    if (me) a += w.points;
    else b += w.points;
    lastMe = me;
  }
  return steps;
}

// Running totals after each step, plus how many times the lead changed hands.
export function revealTotals(steps: RevealStep[]) {
  let a = 0;
  let b = 0;
  let leader = 0;
  let swings = 0;
  const totals = steps.map((s) => {
    a += s.me ?? 0;
    b += s.them ?? 0;
    const now = a > b ? 1 : b > a ? -1 : 0;
    if (now && leader && now !== leader) swings++;
    if (now) leader = now;
    return { me: a, them: b, leader: now };
  });
  return { totals, swings };
}
