// Canonical home of the game. Point this at the purchased domain once it's attached in Vercel.
export const SITE_URL = (process.env.NEXT_PUBLIC_WORDBRAWL_URL ?? "https://wordbrawl.vercel.app").replace(/\/$/, "");

export const SITE_NAME = "Word Brawl";
export const SITE_TITLE = "Play Boggle Online With Friends Free | Word Brawl";
export const SITE_DESCRIPTION =
  "Play Boggle online free with friends. No signup, no download: share a link and play real-time multiplayer Boggle on your phone. Daily Boggle puzzle too.";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I play Boggle online for free?",
    a: "Yes. Word Brawl is free online Boggle with no ads, no account and no in-app purchases.",
  },
  {
    q: "Do I need to download a Boggle app?",
    a: "No. It runs in the browser on any phone, tablet or computer. You can add it to your home screen if you want it to feel like an app.",
  },
  {
    q: "How do I play Boggle online with friends?",
    a: "Tap Create a room, then share the link, the 4-letter room code or the QR code. Friends open it on their own phones, and the host taps Start. Everyone gets the same letter grid and races to find words before the timer runs out.",
  },
  {
    q: "Can we play Boggle online with friends in different places?",
    a: "Yes. Rooms work over the internet, so friends can join from anywhere. It's also great on a video call or at a party with everyone on their own phone.",
  },
  {
    q: "How many people can play Boggle online together?",
    a: "Rooms work best with 2 to 8 players. When 3 or more people play, words that only one person found score double.",
  },
  {
    q: "Is this like Netflix Boggle Party?",
    a: "Yes, it's a free Boggle Party alternative. It has the same swipe-to-spell Boggle grid, party rooms for up to 8 players, a daily Boggle puzzle and Survival mode, but it runs in any browser with no Netflix subscription or TV needed.",
  },
  {
    q: "How does Boggle scoring work here?",
    a: "Words need at least 3 letters (or 4, if the host picks it). A 3-letter word scores 1 point and every extra letter adds 1 more. With 3+ players, unique words score double. No chill mode adds a longest-word bonus, attacks and a danger zone at the end.",
  },
  {
    q: "Can I play Boggle alone?",
    a: "Yes. Quick Start puts you against Dr. Hoot, a computer opponent who levels up when you beat him. The Daily Puzzle gives everyone the same board each day, and in Survival every word you find adds time to the clock.",
  },
  {
    q: "Is there a daily Boggle puzzle?",
    a: "Yes. The Daily Puzzle is one 4×4 Boggle board per day, the same for everyone. Your first try counts toward today's ranking and your streak, and you can share your score.",
  },
  {
    q: "Can I use it for Boggle in the classroom?",
    a: "Yes. Create a room, put the QR code or 4-letter code on the projector, and students join from phones, tablets or Chromebooks. No student accounts or emails needed. It works well for kids practicing spelling, too.",
  },
];
