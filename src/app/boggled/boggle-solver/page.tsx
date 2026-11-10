import type { Metadata } from "next";
import GuideShell, { CtaBox, guideMetadata } from "@/components/boggled/guide/GuideShell";
import Solver from "@/components/boggled/guide/Solver";

const SLUG = "boggle-solver";
const TITLE = "Boggle Solver: Find Every Word on a Boggle Board (Free)";
const DESCRIPTION =
  "Free Boggle solver. Type the letters on your 4×4 or 5×5 Boggle board and instantly see every word, its points, and the path to trace it. Works on your phone.";

export const metadata: Metadata = guideMetadata(SLUG, TITLE, DESCRIPTION, [
  "boggle solver",
  "boggle word finder",
  "boggle board solver",
  "boggle cheat",
  "big boggle solver",
  "boggle helper",
]);

const FAQ = [
  { q: "How do I enter a Boggle board?", a: "Type the letters row by row, left to right: 16 letters for a 4×4 board or 25 for Big Boggle 5×5. Spaces are ignored. Type Q for the Qu die." },
  { q: "What dictionary does the solver use?", a: "The same list Word Brawl uses in the game: about 170,000 English words. Names, abbreviations and hyphenated words aren't in it." },
  { q: "Why does the solver find words I've never heard of?", a: "Word lists include rare words like AALS or ETNA. They're legal in most word games. Use them to settle arguments, not to win friends." },
  { q: "Can I use this to check words after a game?", a: "Yes. After a round, type in the board and compare your lists against everything that was possible." },
];

const APP = {
  "@type": "WebApplication",
  name: "Boggle solver",
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function Page() {
  return (
    <GuideShell
      slug={SLUG}
      h1="Boggle solver"
      faq={FAQ}
      schema={[APP]}
      intro={<p>Type your board and see every word hiding in it, with points and the path to trace each one.</p>}
    >
      <Solver />

      <section aria-labelledby="use">
        <h2 id="use">How to use it</h2>
        <ol className="bg-seo-steps">
          {[
            ["⌨️", "Type the letters", "Row by row, left to right. Q means Qu."],
            ["🔎", "Read the list", "Longest words first, with Boggle points."],
            ["👆", "Tap a word", "The board lights up the path, numbered in order."],
          ].map(([icon, t, b], i) => (
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

      <section aria-labelledby="fair">
        <h2 id="fair">Solver vs. playing for real</h2>
        <p>
          A typical 4×4 board hides 50 to 150 words, and most players find 10 to 20 in three minutes. The solver is great for learning the patterns that
          keep showing up (-ING, -ER, -EST, RE-), checking words after a game, and finding out what you missed.
        </p>
      </section>

      <CtaBox title="Now try it against the clock" body="Word Brawl gives everyone the same board on their phone. No dice, no solver, just you, your friends and a timer." />
    </GuideShell>
  );
}
