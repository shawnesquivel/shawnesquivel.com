// Canonical home of the game. Point this at the purchased domain once it's attached in Vercel.
export const SITE_URL = (process.env.NEXT_PUBLIC_WORDBRAWL_URL ?? "https://wordbrawl.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "Word Brawl";
export const SITE_TITLE = "Word Brawl: Free Boggle-Style Word Game Online With Friends";
export const SITE_DESCRIPTION =
  "Play a free Boggle-style word game online with friends. No download or sign-up: share a link, swipe words on your phone, and race the clock. Daily Puzzle, Survival and solo modes too.";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Is Word Brawl free?",
    a: "Yes. Word Brawl is completely free, with no ads, no account and no in-app purchases.",
  },
  {
    q: "Do I need to download an app?",
    a: "No. It runs in the browser on any phone, tablet or computer. You can add it to your home screen if you want it to feel like an app.",
  },
  {
    q: "How do I play Boggle online with friends?",
    a: "Tap Create a room, then share the link, the 4-letter room code or the QR code. Friends open it on their own phones, and the host taps Start. Everyone gets the same letter grid and races to find words before the timer runs out.",
  },
  {
    q: "Can we play from different places?",
    a: "Yes. Rooms work over the internet, so friends can join from anywhere. It's also great on a video call or at a party with everyone on their own phone.",
  },
  {
    q: "How many people can play?",
    a: "Rooms work best with 2 to 8 players. When 3 or more people play, words that only one person found score double.",
  },
  {
    q: "Is this like Netflix Boggle Party?",
    a: "It's a free alternative inspired by Netflix Boggle Party. It has the same swipe-to-spell grid, party rooms, a Daily Puzzle and Survival mode, but it runs in any browser with no Netflix subscription or TV needed.",
  },
  {
    q: "How does scoring work?",
    a: "Words need at least 3 letters (or 4, if the host picks it). A 3-letter word scores 1 point and every extra letter adds 1 more. With 3+ players, unique words score double. No chill mode adds a longest-word bonus, attacks and a danger zone at the end.",
  },
  {
    q: "Can I play alone?",
    a: "Yes. Quick Start puts you against Dr. Hoot, a bot who levels up when you beat him. The Daily Puzzle gives everyone the same board each day, and in Survival every word you find adds time to the clock.",
  },
];
