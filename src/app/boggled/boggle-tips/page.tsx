import type { Metadata } from "next";
import GuideShell, { CtaBox, guideMetadata } from "@/components/boggled/guide/GuideShell";

const SLUG = "boggle-tips";
const TITLE = "11 Boggle Tips and Strategies to Find More Words";
const DESCRIPTION =
  "Boggle tips that actually work: hunt for endings like -ING and -ER, chase plurals, scan the board in patterns, and spot rare words nobody else finds.";

export const metadata: Metadata = guideMetadata(SLUG, TITLE, DESCRIPTION, [
  "boggle tips",
  "boggle strategy",
  "how to win at boggle",
  "how to get better at boggle",
  "boggle tricks",
]);

const TIPS: [string, string, string][] = [
  ["🔚", "Hunt for endings first", "Find -ING, -ED, -ER, -EST, -LY on the board, then work backwards. One ending can unlock five words."],
  ["➕", "Add an S to everything", "Found CART next to an S? CARTS is a second, longer word for one extra swipe."],
  ["🔁", "Build families", "RATE → RATES → RATED → RATER → GRATE. Once you have a root, squeeze it dry."],
  ["🧩", "Look for prefixes", "RE-, UN-, IN-, DE- in a corner often lead to long words."],
  ["🔤", "Spot common pairs", "TH, ST, CH, SH, ER, EA and Qu are the glue of English. Find them, then grow outwards."],
  ["👀", "Scan in a pattern", "Go tile by tile, row by row, so you don't keep staring at the same corner."],
  ["⏳", "Short words early, long words late", "Bank easy 3–4 letter words in the first 30 seconds, then hunt for the big ones."],
  ["🦄", "Go weird", "Common words get crossed out (or score less when everyone finds them). Rare words like OAST or TOR win games."],
  ["🔄", "Turn the board", "Turning your head (or the board) breaks the patterns your eyes are stuck on."],
  ["📏", "Count the vowels", "Few vowels? Look for consonant clusters like STR and CHR. Lots of vowels? Look for EA, OU, IE pairs."],
  ["🧪", "Practise with a solver", "After a game, put the board in a solver and read what you missed. You'll start seeing the same patterns."],
];

const FAQ = [
  { q: "What's the best Boggle strategy?", a: "Find common endings (-ING, -ER, -ED) and plurals first, then extend words you already have. Long words score far more than short ones." },
  { q: "How many words is a good Boggle score?", a: "On a 4×4 board in 3 minutes, 10–15 words is solid, 20+ is strong, and 30+ is expert level." },
  { q: "How do you practise Boggle?", a: "Play short daily rounds, then check the board in a solver to see the words you missed. The daily puzzle in Word Brawl is a good habit." },
];

export default function Page() {
  return (
    <GuideShell
      slug={SLUG}
      h1="Boggle tips to win"
      faq={FAQ}
      intro={<p>11 tricks good Boggle players use to find more words, and longer ones, before the timer runs out.</p>}
    >
      <section aria-labelledby="tips">
        <h2 id="tips">The tips</h2>
        <ol className="bg-seo-steps">
          {TIPS.map(([icon, t, b], i) => (
            <li key={t}>
              <span className="bg-seo-num" aria-hidden>
                {icon}
              </span>
              <span>
                <b>
                  {i + 1}. {t}
                </b>
                <br />
                {b}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="practice">
        <h2 id="practice">Where to practise</h2>
        <div className="bg-guide-grid">
          {[
            ["📅 Daily puzzle", "One board a day, same for everyone. See how you rank."],
            ["🗺️ Story mode", "20 levels against computer opponents that get smarter."],
            ["⏳ Survival", "Every word adds time. Great for speed."],
            ["🔍 Solver", "Check any board and see every word you missed."],
          ].map(([t, b]) => (
            <div key={t} className="bg-guide-card">
              <b>{t}</b>
              <p>{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-2">
          <a href="boggle-solver" data-cta="guide:boggle-solver">
            Open the Boggle solver →
          </a>
        </p>
      </section>

      <CtaBox title="Put the tips to work" body="Play the daily puzzle, a story level, or a room with friends. Free on your phone." />
    </GuideShell>
  );
}
