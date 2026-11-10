import type { Metadata } from "next";
import Image from "next/image";
import { CAST_METHODS } from "@/components/boggled/CastSteps";
import { NetflixSetup, WordBrawlSetup } from "./Diagrams";
import { GUIDE_SLUG, SITE_NAME, SITE_URL } from "@/lib/boggled/site";

const TITLE = "How to Play Netflix Boggle Party (and What to Do When It Won't Load)";
const DESCRIPTION =
  "How to play Boggle Party on Netflix in 6 steps, why it often won't show up, and the easiest free way to play Boggle online with friends on your phones, with or without a TV.";
const URL_ = `${SITE_URL}/${GUIDE_SLUG}`;
const CHECKED = "9 November 2026";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `/${GUIDE_SLUG}` },
  keywords: [
    "how to play netflix boggle party",
    "boggle party netflix",
    "boggle party not showing up",
    "boggle party alternative",
    "how to play boggle online with friends",
    "boggle on tv",
    "boggle chromecast",
  ],
  openGraph: { type: "article", url: `/${GUIDE_SLUG}`, title: TITLE, description: DESCRIPTION, images: ["/boggled/guide/lobby.jpg"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const NETFLIX_STEPS = [
  ["📺", "Open Netflix on a TV or at netflix.com on a computer", "Go to Games → Boggle Party. A phone can't host it."],
  ["▶️", "Choose Play Game", "A QR code shows up on the big screen."],
  ["📱", "Everyone scans the QR code", "iPhones install the Netflix Game Controller app the first time, Android uses the Netflix app."],
  ["🎮", "The first player in is the host", "They pick the grid size and the timer."],
  ["👆", "Swipe words on your phone", "Scores show on the TV. Up to 8 players."],
];

const BROKEN = [
  ["No Games row on your TV", "Netflix games only run on some TVs and countries. Try netflix.com on a laptop instead."],
  ["It vanished from the list", "Boggle Party has gone missing for days at a time (May 2026 was the big one). Update the Netflix app, switch profiles and back, or wait it out."],
  ["You only have phones", "Netflix needs a TV or computer to host. There's no phone-only mode."],
  ["Friends are in another city", "Netflix only lets people join by scanning the QR code on the host screen. No room code, no link."],
  ["Nobody has Netflix", "The host needs a paid Netflix plan."],
];

type Mark = "yes" | "no" | "meh";
const METHODS: { name: string; how: string; phones: Mark; remote: Mark; free: Mark; tv: Mark; verdict: string }[] = [
  { name: SITE_NAME, how: "Open a link in any browser", phones: "yes", remote: "yes", free: "yes", tv: "yes", verdict: "Works everywhere" },
  { name: "Netflix Boggle Party", how: "TV + QR code", phones: "no", remote: "no", free: "meh", tv: "yes", verdict: "Great on a couch, if it loads" },
  { name: "Boggle With Friends (Zynga app)", how: "Install an app", phones: "yes", remote: "yes", free: "meh", tv: "no", verdict: "Turn-based, ads, everyone installs" },
  { name: "Real board on a video call", how: "Point a webcam at the grid", phones: "meh", remote: "yes", free: "meh", tv: "no", verdict: "Blurry letters, manual scoring" },
  { name: "Random Boggle websites", how: "Search and hope", phones: "meh", remote: "meh", free: "yes", tv: "no", verdict: "Mostly solo or desktop-only" },
];
const MARK = { yes: "✅", no: "❌", meh: "⚠️" } as const;

const FEATURES = [
  "Free, no signup, no download",
  "Phones only: no TV or console needed",
  "Create a room, share a link or 4-letter code",
  "Friends join from anywhere",
  "2–8 players, same grid, live scores",
  "4×4 or 5×5 boards, 1 or 2 minute rounds",
  "Daily puzzle, Survival and a 20-level story mode",
  "Optional No chill mode with attacks and bonus points",
  "Cast it to a TV for the Boggle Party feel",
];

const PLAY_STEPS = [
  { img: "home", title: "Tap Create room", body: "You get a room code right away." },
  { img: "lobby", title: "Share the link or code", body: "Friends open it on their phones. The host taps Start." },
  { img: "board", title: "Swipe words", body: "Same letters for everyone. Longer words score more." },
  { img: "results", title: "See who won", body: "Words reveal one by one. Words only you found are highlighted." },
];

const FAQ = [
  {
    q: "How do you play Boggle Party on Netflix?",
    a: "Open Netflix on a TV or at netflix.com on a computer, go to Games → Boggle Party and choose Play Game. Everyone scans the QR code with their phone, then finds words on their phone while the TV keeps score. Up to 8 players.",
  },
  {
    q: "Why can't I find Boggle Party on Netflix?",
    a: "Netflix games only run on some TVs and in some countries, and Boggle Party has disappeared for days at a time during outages. Update the Netflix app, switch profiles, or try netflix.com on a computer. If it's still missing, play a browser version like Word Brawl.",
  },
  {
    q: "Can I play Boggle Party on my phone only?",
    a: "No. Netflix needs a TV or a computer to host the round. Word Brawl runs entirely on phones: one person creates a room and shares the link.",
  },
  {
    q: "Can I play Boggle Party with friends in another city?",
    a: "Netflix only lets players join by scanning the QR code on the host screen, so everyone has to be in the room. Word Brawl rooms work over the internet, so friends can join from anywhere with a link or a 4-letter code.",
  },
  {
    q: "How many people can play?",
    a: "Boggle Party allows up to 8 players. Word Brawl rooms are built for 2–8 players on their own phones.",
  },
  {
    q: "How do I put Word Brawl on my TV?",
    a: "Cast a Chrome tab with Chromecast or Google TV, mirror an iPhone or Mac with AirPlay to an Apple TV, or open wordbrawl.app in your smart TV's browser and join the room. Everyone else plays on their phones.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${URL_}#article`,
      headline: TITLE,
      description: DESCRIPTION,
      url: URL_,
      image: `${SITE_URL}/boggled/guide/lobby.jpg`,
      dateModified: "2026-11-09",
      author: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
    },
    {
      "@type": "HowTo",
      name: "How to play Netflix Boggle Party",
      step: NETFLIX_STEPS.map(([, name, text]) => ({ "@type": "HowToStep", name, text })),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};

function Shot({ name, alt }: { name: string; alt: string }) {
  return <Image src={`/boggled/guide/${name}.jpg`} alt={alt} width={390} height={760} className="bg-guide-shot" sizes="(max-width: 480px) 45vw, 200px" />;
}

export default function GuidePage() {
  return (
    <article className="bg-seo bg-guide">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="bg-guide-nav">
        <a href="./">← {SITE_NAME}</a>
      </nav>

      <header>
        <h1 className="bg-title">How to play Netflix Boggle Party</h1>
        <p>…and what to do when it won&apos;t load, you only have phones, or your friends are somewhere else.</p>
        <figure className="bg-guide-hero">
          <Image
            src="/boggled/guide/boggle-party-tv.jpg"
            alt="Netflix Boggle Party on a TV: a 6×6 letter grid, the word PEAT scoring +2, and two players' score columns"
            width={827}
            height={695}
            priority
            sizes="(max-width: 720px) 100vw, 680px"
          />
          <figcaption>Netflix Boggle Party on our TV. The grid and scores live on the TV; everyone swipes on their phone.</figcaption>
        </figure>
      </header>

      <section className="bg-guide-tldr" aria-label="Quick answer">
        <b>The short version</b>
        <ul>
          <li>Boggle Party needs a TV or computer to host, plus a Netflix plan.</li>
          <li>Players join by scanning a QR code. No links, no room codes.</li>
          <li>It often doesn&apos;t show up, and there&apos;s no phone-only mode.</li>
          <li>
            Easiest fix: <a href="./">play {SITE_NAME}</a>. Free, phones only, share a link.
          </li>
        </ul>
      </section>

      <section aria-labelledby="pick" className="bg-guide-pick">
        <span className="bg-guide-badge">⭐ Our pick</span>
        <h2 id="pick">{SITE_NAME}: Boggle Party on your phones</h2>
        <div className="bg-guide-pick-row">
          <ul className="bg-guide-checks">
            {FEATURES.map((f) => (
              <li key={f}>✅ {f}</li>
            ))}
          </ul>
          <Shot name="lobby" alt="Word Brawl lobby with a room code, share link, QR code and TV button" />
        </div>
        <WordBrawlSetup />
        <a href="./" className="bg-btn bg-btn-primary bg-guide-cta">
          Create a free room →
        </a>
      </section>

      <section aria-labelledby="netflix">
        <h2 id="netflix">How to play Boggle Party on Netflix</h2>
        <NetflixSetup />
        <ol className="bg-seo-steps">
          {NETFLIX_STEPS.map(([icon, title, body], i) => (
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

      <section aria-labelledby="broken">
        <h2 id="broken">Why Boggle Party isn&apos;t working for you</h2>
        <div className="bg-guide-grid">
          {BROKEN.map(([title, body]) => (
            <div key={title} className="bg-guide-card">
              <b>❌ {title}</b>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="methods">
        <h2 id="methods">Every way to play Boggle online, compared</h2>
        <div className="bg-guide-table-wrap">
          <table className="bg-guide-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Phones only</th>
                <th>Far away</th>
                <th>Free</th>
                <th>TV</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.name}>
                  <th scope="row">
                    {m.name}
                    <small>
                      {m.how} · {m.verdict}
                    </small>
                  </th>
                  <td>{MARK[m.phones]}</td>
                  <td>{MARK[m.remote]}</td>
                  <td>{MARK[m.free]}</td>
                  <td>{MARK[m.tv]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="bg-guide-note">⚠️ = sort of: needs a subscription, an install, ads, or a lot of fiddling.</p>
      </section>

      <section aria-labelledby="how">
        <h2 id="how">How to play {SITE_NAME} in 4 taps</h2>
        <ol className="bg-guide-steps">
          {PLAY_STEPS.map((s, i) => (
            <li key={s.img}>
              <Shot name={s.img} alt={`Step ${i + 1}: ${s.title}`} />
              <b>
                {i + 1}. {s.title}
              </b>
              <span>{s.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="tv" id="tv">
        <h2>📺 Play on a TV, like Boggle Party</h2>
        <p>Put the room on the big screen so everyone can watch, while each player swipes on their own phone. Up to 8 players.</p>
        <div className="bg-guide-pick-row bg-guide-tv">
          <div className="bg-cast">
            {CAST_METHODS.map((m) => (
              <div key={m.id} className="bg-cast-card">
                <h3 className="bg-cast-title">
                  <span className="text-2xl">{m.icon}</span> {m.title}
                </h3>
                <ol>
                  {m.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <Shot name="tv" alt="The Play on a TV help inside a Word Brawl room" />
        </div>
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq">Questions</h2>
        {FAQ.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <footer>
        Checked {CHECKED}. {SITE_NAME} is an independent game, not affiliated with Netflix or Hasbro. Boggle is a trademark of Hasbro.
      </footer>
    </article>
  );
}
