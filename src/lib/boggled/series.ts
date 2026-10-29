export type SeriesLength = 3 | 5;
export type SeriesRef = { id: string; game: number; length: SeriesLength };
// roundId -> who won that round (ties: everyone tied gets the win)
export type SeriesRecords = Record<string, { seriesId: string; winners: string[] }>;

export type SeriesStatus = {
  wins: Record<string, number>;
  games: number;
  needed: number;
  champion: string | null;
};

export function seriesStatus(records: SeriesRecords, ref: Pick<SeriesRef, "id" | "length">): SeriesStatus {
  const wins: Record<string, number> = {};
  let games = 0;
  for (const r of Object.values(records)) {
    if (r.seriesId !== ref.id) continue;
    games++;
    for (const id of r.winners) wins[id] = (wins[id] ?? 0) + 1;
  }
  const needed = Math.ceil(ref.length / 2);
  const ranked = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  const [first, second] = ranked;
  const clear = !!first && (!second || first[1] > second[1]);
  // A tie on the deciding game keeps the series going (sudden death) until someone is strictly ahead.
  const champion = clear && (first[1] >= needed || games >= ref.length) ? first[0] : null;
  return { wins, games, needed, champion };
}
