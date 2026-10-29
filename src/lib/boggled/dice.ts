import type { Rng } from "./rng";

// "Q" faces are rendered and scored as "QU".
export const CLASSIC_DICE_4X4 = [
  "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
  "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
  "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
  "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ",
];

export const BIG_DICE_5X5 = [
  "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
  "AEEGMU", "AEGMNN", "AFIRSY", "BJKQXZ", "CCENST",
  "CEIILT", "CEILPT", "CEIPST", "DDHNOT", "DHHLOR",
  "DHLNOR", "DHLNOR", "EIIITT", "EMOTTT", "ENSSSU",
  "FIPRSY", "GORRVW", "IPRRRY", "NOOTUW", "OOOTTU",
];

export type BoardSize = 4 | 5;

export function diceFor(size: BoardSize): string[] {
  return size === 5 ? BIG_DICE_5X5 : CLASSIC_DICE_4X4;
}

export function rollDice(size: BoardSize, rng: Rng): string[] {
  const dice = [...diceFor(size)];
  for (let i = dice.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [dice[i], dice[j]] = [dice[j], dice[i]];
  }
  return dice.map((die) => {
    const face = die[Math.floor(rng() * die.length)];
    return face === "Q" ? "QU" : face;
  });
}
