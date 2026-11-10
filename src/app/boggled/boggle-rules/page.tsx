import type { Metadata } from "next";
import GuideShell, { CtaBox, guideMetadata } from "@/components/boggled/guide/GuideShell";

const SLUG = "boggle-rules";
const TITLE = "Boggle Rules and Scoring: How to Play Boggle (Quick Guide)";
const DESCRIPTION =
  "Official Boggle rules in plain English: setup, how to find words, what counts, and the Boggle scoring chart for 4×4 and Big Boggle 5×5. With pictures.";

export const metadata: Metadata = guideMetadata(SLUG, TITLE, DESCRIPTION, [
  "boggle rules",
  "how to play boggle",
  "boggle scoring",
  "boggle points",
  "big boggle rules",
  "boggle word rules",
]);

const SCORING = [
  ["3", "1"],
  ["4", "1"],
  ["5", "2"],
  ["6", "3"],
  ["7", "5"],
  ["8+", "11"],
];

const OK = ["Words of 3+ letters (4+ in Big Boggle)", "Plurals and other forms: CAT and CATS both count", "Words hidden inside other words: HEART, EAR, ART", "Letters touching sideways, up, down or diagonally"];
const NOT_OK = ["Names and places (proper nouns)", "Abbreviations and words with hyphens or apostrophes", "Using the same die twice in one word", "Jumping over a die to reach one that isn't touching"];

const FAQ = [
  { q: "How many letters does a Boggle word need?", a: "At least 3 letters in classic 4×4 Boggle, and at least 4 in Big Boggle (5×5). The Qu die counts as two letters." },
  { q: "Can you use the same letter twice in Boggle?", a: "You can use the same letter twice if it appears on two different dice. You can't use the same die twice in one word." },
  { q: "Do plurals count in Boggle?", a: "Yes. CAT and CATS are two different words and both score, as long as both can be traced on the board." },
  { q: "What happens if two players find the same word?", a: "In the board game, every player who wrote it crosses it out and nobody scores it. That's why rare words win games." },
  { q: "How long is a round of Boggle?", a: "Three minutes with the sand timer in the board game. Online, 1 or 2 minute rounds are popular because they feel faster on a phone." },
  { q: "How is scoring different in Word Brawl?", a: "Word Brawl gives 1 point for 3 letters and 1 more for every extra letter, so long words always pay. With 3+ players, words only you found score double." },
];

// 4×4 board with the path for "HEART" and its hidden words.
const DEMO = ["H", "E", "S", "T", "A", "A", "R", "O", "L", "T", "N", "P", "I", "C", "E", "D"];
const PATH = [0, 1, 5, 6, 9];

function DemoBoard() {
  return (
    <figure className="bg-guide-fig">
      <div className="bg-solver-grid bg-rules-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }} role="img" aria-label="A Boggle board with the word HEART traced through touching letters">
        {DEMO.map((t, i) => {
          const k = PATH.indexOf(i);
          return (
            <span key={i} className={`bg-solver-tile ${k >= 0 ? "on" : ""} ${k === 0 ? "first" : ""}`}>
              {t}
              {k >= 0 && <small>{k + 1}</small>}
            </span>
          );
        })}
      </div>
      <figcaption>H → E → A → R → T: every letter touches the one before it, diagonals included. EAR and ART are hiding in there too.</figcaption>
    </figure>
  );
}

export default function Page() {
  return (
    <GuideShell
      slug={SLUG}
      h1="Boggle rules and scoring"
      faq={FAQ}
      intro={<p>Everything you need to play Boggle in 2 minutes: setup, what counts as a word, and the scoring chart.</p>}
    >
      <section className="bg-guide-tldr" aria-label="Quick answer">
        <b>Boggle in 5 lines</b>
        <ul>
          <li>Shake 16 letter dice into a 4×4 grid and flip the 3-minute timer.</li>
          <li>Find words by chaining letters that touch, diagonals included.</li>
          <li>Each die once per word. Words need 3+ letters.</li>
          <li>When time&apos;s up, read your lists. Words someone else also found are crossed out.</li>
          <li>Longer words score more. Most points wins.</li>
        </ul>
      </section>

      <section aria-labelledby="how">
        <h2 id="how">How to find a word</h2>
        <DemoBoard />
      </section>

      <section aria-labelledby="counts">
        <h2 id="counts">What counts, and what doesn&apos;t</h2>
        <div className="bg-guide-grid">
          <div className="bg-guide-card">
            <b>✅ Allowed</b>
            <ul className="bg-guide-checks">
              {OK.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="bg-guide-card">
            <b>❌ Not allowed</b>
            <ul className="bg-guide-checks">
              {NOT_OK.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="scoring">
        <h2 id="scoring">Boggle scoring chart</h2>
        <div className="bg-guide-table-wrap">
          <table className="bg-guide-table">
            <thead>
              <tr>
                <th>Word length</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {SCORING.map(([len, pts]) => (
                <tr key={len}>
                  <th scope="row">{len} letters</th>
                  <td>{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bg-guide-note">Qu counts as two letters, so QUIT is a 4-letter word. Big Boggle (5×5) uses the same chart but words start at 4 letters.</p>
      </section>

      <section aria-labelledby="variants">
        <h2 id="variants">Popular house rules</h2>
        <div className="bg-guide-grid">
          {[
            ["⏱ Speed round", "1 or 2 minutes instead of 3. Faster, more chaotic, great for big groups."],
            ["🎯 Everything counts", "Skip the cross-outs. Every valid word scores, so beginners still get points."],
            ["🔤 4-letter minimum", "No 3-letter words on a 4×4 board. Forces longer, higher-scoring finds."],
            ["🏆 Best of 3", "Play three boards and add the scores, or count round wins."],
          ].map(([t, b]) => (
            <div key={t} className="bg-guide-card">
              <b>{t}</b>
              <p>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBox
        title="Skip the dice and the scorekeeping"
        body="Word Brawl deals the board, checks every word against the dictionary and adds up the scores for you. Free, on your phones, with friends anywhere."
      />
    </GuideShell>
  );
}
