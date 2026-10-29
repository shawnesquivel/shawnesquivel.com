import type { Tally, TallyEntry } from "./room";

export type Standing = TallyEntry & { id: string };

export function standings(tally: Tally): Standing[] {
  return Object.entries(tally)
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => b.wins - a.wins || b.points - a.points);
}

const TITLES = ["Word Nerd", "Letter Legend", "Vocab Villain", "Lexicon Lord", "Boggle Boss", "Dictionary Deity"];

export function leaderTitle(wins: number): string {
  return TITLES[Math.min(Math.max(wins, 1), TITLES.length) - 1];
}

function pick<T>(options: T[], seed: number): T {
  return options[seed % options.length];
}

// Headline for the session scoreboard. `seed` keeps the line stable for a given round count.
export function leaderLine(table: Standing[], roundsPlayed: number): string | null {
  if (roundsPlayed === 0 || table.length < 2) return null;
  const [first, second] = table;
  const margin = first.wins - second.wins;
  const L = first.name;
  const S = second.name;
  const seed = roundsPlayed;

  if (margin === 0) {
    return pick(
      [
        `Dead heat at ${first.wins}–${second.wins} 🤝 Next round settles it.`,
        `${L} and ${S} are neck and neck. Nobody blink 👀`,
        `All square! The tension is unbearable 😬`,
      ],
      seed,
    );
  }
  if (first.wins === roundsPlayed && roundsPlayed >= 3) {
    return pick(
      [
        `${L} has won all ${roundsPlayed} rounds. Absolute menace 😈`,
        `${roundsPlayed}–0. Somebody please stop ${L} 🚨`,
        `${L} is undefeated. ${S}, blink twice if you need help 🫠`,
      ],
      seed,
    );
  }
  if (margin >= 3) {
    return pick(
      [
        `${L} is running away with it. ${S}, maybe crack open a dictionary 📚`,
        `${L} is cooking and ${S} is the ingredients 🍳`,
        `${L} up by ${margin}. ${S} needs a miracle 🙏`,
      ],
      seed,
    );
  }
  if (margin === 2) {
    return pick(
      [`${L} is on a heater 🔥 Two-win lead.`, `${L} is pulling away… ${S}, wake up! ⏰`, `${L} smells victory 👃🏆`],
      seed,
    );
  }
  if (first.wins === 1) return `${L} drew first blood 🩸`;
  return pick(
    [`${L} clings to the crown by one win 👑`, `${L} leads by a whisker. ${S} is right there 😤`, `${L} is ahead… for now 😏`],
    seed,
  );
}
