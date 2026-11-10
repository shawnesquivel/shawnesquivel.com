// Every guide page. Drives the sitemap, the wordbrawl.app rewrites (next.config.ts), related links and /stats labels.
// Keep imports out of this file: next.config.ts loads it directly.

export type Guide = { slug: string; title: string; short: string; emoji: string; updated: string };

export const GUIDES: Guide[] = [
  { slug: "how-to-play-boggle-party", title: "How to play Netflix Boggle Party", short: "Boggle Party setup, and fixes when it won't load", emoji: "📺", updated: "2026-11-10" },
  { slug: "boggle-rules", title: "Boggle rules and scoring", short: "How to play Boggle in 2 minutes", emoji: "📜", updated: "2026-11-10" },
  { slug: "boggle-solver", title: "Boggle solver", short: "Type a board, see every word", emoji: "🔍", updated: "2026-11-10" },
  { slug: "play-boggle-on-zoom", title: "How to play Boggle on Zoom", short: "Boggle on a video call without the webcam squint", emoji: "💻", updated: "2026-11-10" },
  { slug: "games-like-boggle", title: "Games like Boggle", short: "8 word games for Boggle fans", emoji: "🎲", updated: "2026-11-10" },
  { slug: "boggle-tips", title: "Boggle tips to win", short: "11 tricks that find more words", emoji: "🧠", updated: "2026-11-10" },
];

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
