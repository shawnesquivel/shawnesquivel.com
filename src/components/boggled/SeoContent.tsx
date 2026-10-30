import { FAQ, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/boggled/site";

const STEPS = [
  ["🎉", "Create a room", "One tap, no sign-up. You get a 4-letter room code."],
  ["🔗", "Share the link", "Send the invite link, read out the code, or let friends scan the QR code."],
  ["👆", "Swipe words", "Everyone gets the same grid. Most points when the timer hits zero wins."],
];

const MODES = [
  ["🎉", "Rooms with friends", "Private party rooms for 2–8 players. Best of 3, best of 5 or continuous scoring, 1 or 2 minute rounds, and 4×4 or 5×5 boards."],
  ["⚡", "Quick Start", "Play right now against Dr. Hoot 🦉, a bot that levels up when you win and eases off when you lose."],
  ["📅", "Daily Puzzle", "One board per day, the same for everyone. Your first try counts toward the daily ranking and your streak."],
  ["⏳", "Survival", "Start with 30 seconds. Every word adds time, and longer words add more. How long can you last?"],
  ["🔥", "No chill mode", "Longest-word bonus, bombs and flips to mess with rivals, shields, and a danger zone that boosts the last 15 seconds."],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": ["VideoGame", "WebApplication"],
      "@id": `${SITE_URL}/#game`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}/boggled/opengraph-image`,
      genre: ["Word game", "Party game", "Puzzle"],
      gamePlatform: ["Web browser", "iOS", "Android"],
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      playMode: ["MultiPlayer", "SinglePlayer"],
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: 1, maxValue: 8 },
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      inLanguage: "en",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};

// Server-rendered, crawlable description of the game. Sits under the home menu and hides once you're in a game.
export default function SeoContent() {
  return (
    <article className="bg-seo">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header>
        <h1 className="bg-title">Play a Boggle-style word game online with friends</h1>
        <p>
          Word Brawl is a free multiplayer word game for your phone. Find words in a grid of letter dice, race the timer, and beat your
          friends. No download, no account, and it works on any phone, tablet or computer.
        </p>
      </header>

      <section aria-labelledby="seo-how">
        <h2 id="seo-how">How to play with friends</h2>
        <ol className="bg-seo-steps">
          {STEPS.map(([icon, title, body], i) => (
            <li key={title}>
              <span className="bg-seo-num" aria-hidden>
                {icon}
              </span>
              <span>
                <b>
                  {i + 1}. {title}
                </b>
                <br />
                {body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="seo-modes">
        <h2 id="seo-modes">Game modes</h2>
        <ul className="bg-seo-modes">
          {MODES.map(([icon, title, body]) => (
            <li key={title}>
              <h3>
                {icon} {title}
              </h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="seo-rules">
        <h2 id="seo-rules">Rules and scoring</h2>
        <ul className="bg-seo-list">
          <li>Swipe across touching letters (sideways, up, down or diagonally) to spell a word. Each letter tile can be used once per word.</li>
          <li>Words need 3+ letters. 3 letters = 1 point, and every extra letter is +1. “Qu” counts as two letters.</li>
          <li>With 3 or more players, words nobody else found score double, so dig for the weird ones.</li>
          <li>Rooms play best of 3 by default. The first to win 2 rounds is the champion.</li>
        </ul>
      </section>

      <section aria-labelledby="seo-faq">
        <h2 id="seo-faq">FAQ</h2>
        {FAQ.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <footer>
        <p>
          Word Brawl is an independent fan-made game inspired by classic word-search dice games and Netflix Boggle Party. It is not
          affiliated with Hasbro or Netflix.
        </p>
      </footer>
    </article>
  );
}
