import type { Metadata } from "next";
import GuideShell, { CtaBox, guideMetadata } from "@/components/boggled/guide/GuideShell";
import { SITE_NAME } from "@/lib/boggled/site";

const SLUG = "games-like-boggle";
const TITLE = "8 Games Like Boggle (Online, App and Board Game Picks)";
const DESCRIPTION =
  "Love Boggle? The best games like Boggle to play online with friends, on your phone, or at the table: word grids, letter dice and daily word puzzles, compared.";

export const metadata: Metadata = guideMetadata(SLUG, TITLE, DESCRIPTION, [
  "games like boggle",
  "boggle alternatives",
  "word games like boggle",
  "online word games with friends",
  "boggle online",
  "word search games",
]);

type Pick = { name: string; kind: string; good: string; catch: string; best: string };
const PICKS: Pick[] = [
  { name: SITE_NAME, kind: "Browser · free", good: "Real-time Boggle with friends on phones, share a link, daily puzzle and story mode", catch: "English only for now", best: "Playing Boggle with friends, anywhere" },
  { name: "Netflix Boggle Party", kind: "TV + phones", good: "Big-screen party Boggle with a QR code to join", catch: "Host needs Netflix and a supported TV; everyone in one room", best: "Couch nights with a Netflix account" },
  { name: "Boggle With Friends", kind: "iOS / Android app", good: "The official Boggle app, turn-based with friends", catch: "Ads, install required, not live", best: "Slow games across the day" },
  { name: "Word Hunt (GamePigeon)", kind: "iMessage", good: "A Boggle-style 4×4 grid you can send in a text", catch: "iPhone only, one opponent at a time", best: "Quick duels over iMessage" },
  { name: "Ruzzle", kind: "App", good: "Fast 2-minute word grid duels with letter bonuses", catch: "Ads, one opponent at a time", best: "Quick 1-on-1 rounds" },
  { name: "Scattergories", kind: "Board game", good: "Same race-the-timer energy, with categories", catch: "Needs the physical game and paper", best: "Big groups at the table" },
  { name: "Bananagrams", kind: "Board game", good: "Speed crossword with letter tiles, no board", catch: "Everyone has to be at the table", best: "Travel and pubs" },
  { name: "Wordle / Strands", kind: "Daily puzzle", good: "One daily word puzzle to share with friends", catch: "Solo, one puzzle a day", best: "A daily habit" },
];

const FAQ = [
  { q: "What is the best free game like Boggle?", a: `${SITE_NAME} is the closest to real Boggle: the same letter grid for everyone, a shared timer and live scores, free in the browser.` },
  { q: "Is there a Boggle game I can play online with friends?", a: `Yes. ${SITE_NAME} lets you create a room and share a link. Friends join from any phone, no app or sign-up.` },
  { q: "Is Word Hunt the same as Boggle?", a: "Word Hunt in GamePigeon uses a Boggle-style 4×4 grid, but it's iMessage-only and one opponent at a time. Boggle is played by everyone at once on the same board." },
  { q: "Is there a daily Boggle puzzle?", a: `Yes. ${SITE_NAME} has a Daily puzzle: one board per day, the same for everyone, with a streak.` },
];

const LIST = {
  "@type": "ItemList",
  itemListElement: PICKS.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name })),
};

export default function Page() {
  return (
    <GuideShell
      slug={SLUG}
      h1="Games like Boggle"
      faq={FAQ}
      schema={[LIST]}
      intro={<p>The best word games for Boggle fans, whether you want to play with friends tonight, on your own, or at the table.</p>}
    >
      <section aria-labelledby="picks">
        <h2 id="picks">The picks</h2>
        <ol className="bg-guide-picks">
          {PICKS.map((p, i) => (
            <li key={p.name} className={`bg-guide-card ${i === 0 ? "bg-guide-top" : ""}`}>
              <div className="flex items-baseline justify-between gap-2">
                <h3>
                  {i + 1}. {p.name}
                </h3>
                <small className="opacity-70">{p.kind}</small>
              </div>
              <p>✅ {p.good}</p>
              <p>⚠️ {p.catch}</p>
              <p>
                <b>Best for:</b> {p.best}
              </p>
              {i === 0 && (
                <a href="./" className="bg-btn bg-btn-primary bg-guide-cta" data-cta="pick">
                  Play free →
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>

      <CtaBox title="Want the real thing?" body="Same letter grid, same timer, everyone on their own phone. Create a room and send the link." />
    </GuideShell>
  );
}
