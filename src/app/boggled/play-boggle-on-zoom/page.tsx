import type { Metadata } from "next";
import Image from "next/image";
import GuideShell, { CtaBox, guideMetadata } from "@/components/boggled/guide/GuideShell";

const SLUG = "play-boggle-on-zoom";
const TITLE = "How to Play Boggle on Zoom (or Any Video Call), Free";
const DESCRIPTION =
  "The easiest way to play Boggle on Zoom, FaceTime, Teams or Google Meet: everyone gets the same board on their own phone, no webcam squinting. Plus the old-school way with a real board.";

export const metadata: Metadata = guideMetadata(SLUG, TITLE, DESCRIPTION, [
  "boggle on zoom",
  "how to play boggle on zoom",
  "boggle video call",
  "virtual boggle",
  "boggle online with friends",
  "zoom games",
]);

const WAYS = [
  {
    title: "✅ Easiest: everyone plays on their phone",
    steps: [
      "Start the call as usual (Zoom, FaceTime, Meet, Teams, Discord).",
      "One person opens wordbrawl.app and taps Create room.",
      "Paste the invite link in the call chat, or read out the 4-letter code.",
      "Everyone swipes words on their own phone. Scores add up automatically.",
    ],
    note: "Everyone sees the same crisp board, the timer is shared, and nobody has to read their list out loud.",
  },
  {
    title: "⚠️ Old school: a real board on a webcam",
    steps: [
      "The host shakes a real Boggle board and points a webcam straight down at it.",
      "Everyone writes words on paper for 3 minutes.",
      "Take turns reading lists out loud and crossing out duplicates.",
      "The host adds up scores.",
    ],
    note: "Works, but small letters blur on video, the Qu die is hard to read, and scoring takes longer than the round.",
  },
];

const FAQ = [
  { q: "Can you play Boggle on Zoom for free?", a: "Yes. Start your Zoom call, then share a free Word Brawl room link in the chat. Everyone plays on their phone while you talk." },
  { q: "Do I need to share my screen?", a: "No. Each player has the board on their own phone, so there's nothing to screen-share. You can share the lobby if you want everyone to see the room code." },
  { q: "Does it work on FaceTime, Google Meet or Teams?", a: "Yes. The game runs in a web browser, separate from the call, so any video app works." },
  { q: "How many people can play Boggle on a video call?", a: "Word Brawl rooms are made for 2–8 players. For bigger groups, split into a few rooms." },
  { q: "Is it good for a classroom or work team?", a: "Yes. There's no sign-up, so students and coworkers can join from a link in seconds. Turn on Chill mode for a classic game with no attacks." },
];

export default function Page() {
  return (
    <GuideShell
      slug={SLUG}
      h1="How to play Boggle on Zoom"
      faq={FAQ}
      intro={<p>Two ways to play Boggle on a video call. One takes 30 seconds, one takes a webcam stand.</p>}
    >
      {WAYS.map((w) => (
        <section key={w.title} className="bg-guide-card">
          <h2>{w.title}</h2>
          <ol className="bg-guide-numbered">
            {w.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="bg-guide-note">{w.note}</p>
        </section>
      ))}

      <section aria-labelledby="looks">
        <h2 id="looks">What your friends see</h2>
        <div className="bg-guide-steps">
          {[
            ["lobby", "The room: share the link in the chat"],
            ["board", "The board: swipe words on your phone"],
            ["results", "Results: words reveal one by one"],
          ].map(([img, cap]) => (
            <figure key={img}>
              <Image src={`/boggled/guide/${img}.jpg`} alt={cap} width={390} height={760} className="bg-guide-shot" sizes="(max-width: 480px) 45vw, 200px" />
              <figcaption className="mt-1 text-sm">{cap}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="tips">
        <h2 id="tips">Tips for a good video call game</h2>
        <ul className="bg-guide-checks">
          <li>🎧 Use headphones so the game sounds don&apos;t echo through the call.</li>
          <li>⏱ 1-minute rounds keep energy up. Play best of 3.</li>
          <li>🔥 Turn on No chill for bombs and flips if your group likes chaos.</li>
          <li>📺 Watching on a big screen? Cast the room to your TV.</li>
        </ul>
      </section>

      <CtaBox title="Start a room for your call" body="Free, no sign-up, works next to Zoom, FaceTime, Meet and Teams. Drop the link in the chat and go." />
    </GuideShell>
  );
}
