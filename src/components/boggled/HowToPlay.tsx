"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/boggled/analytics";
import { BOMB_WORD_LENGTH } from "@/lib/boggled/room";
import { LONGEST_WORD_BONUS } from "@/lib/boggled/scoring";

const DEMO = ["S", "T", "A", "R", "E", "O", "N", "E", "P", "L", "I", "D", "W", "A", "K", "E"];
const STARE = [0, 1, 2, 3, 7];
const TICK_MS = 550;

function MiniBoard({
  path = [],
  state,
  blocked,
  finger,
}: {
  path?: number[];
  state?: "good";
  blocked?: number;
  finger?: boolean;
}) {
  const center = (i: number) => [((i % 4) + 0.5) * 25, (Math.floor(i / 4) + 0.5) * 25];
  const last = path.length ? center(path[path.length - 1]) : center(STARE[0]);
  return (
    <div className="bg-mini-board">
      <div className="grid h-full grid-cols-4 grid-rows-4">
        {DEMO.map((l, i) => (
          <div key={i} style={{ padding: "7%" }}>
            <div
              className={`bg-tile h-full ${path.includes(i) ? `sel ${state ?? ""}` : ""} ${blocked === i ? "blocked" : ""}`}
              style={{ fontSize: "1.2rem" }}
            >
              {blocked === i ? <span className="bg-bomb-tile">💣</span> : l}
            </div>
          </div>
        ))}
      </div>
      {path.length > 1 && (
        <svg className="bg-trail" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={path.map((i) => center(i).join(",")).join(" ")}
            fill="none"
            stroke={state === "good" ? "#1f9a55" : "#ff8a00"}
            strokeOpacity={0.55}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {finger && (
        <span className="bg-finger" style={{ left: `${last[0]}%`, top: `${last[1]}%`, opacity: path.length ? 1 : 0 }}>
          👆
        </span>
      )}
    </div>
  );
}

function WordChip({ word, points, kind, show = true }: { word: string; points: string; kind?: "unique" | "shared" | "bonus"; show?: boolean }) {
  return (
    <div className={`bg-reveal ${kind === "bonus" ? "unique" : kind ?? ""}`} style={{ visibility: show ? "visible" : "hidden" }}>
      <span>{word}</span>
      <span className="shrink-0 text-sm">{points}</span>
    </div>
  );
}

type Slide = { title: string; body: ReactNode; loop: number; demo: (t: number) => ReactNode };

const SLIDES: Slide[] = [
  {
    title: "Swipe to make words",
    body: "Drag across touching letters, diagonals too. Let go to submit. Each tile once per word.",
    loop: 11,
    demo: (t) => {
      const k = Math.min(t, STARE.length);
      const done = t > STARE.length && t < 9;
      return (
        <>
          <div className={`bg-word ${done ? "good pop" : ""}`} key={done ? "done" : "live"}>
            {done ? "STARE +3" : STARE.slice(0, k).map((i) => DEMO[i]).join("")}
          </div>
          <MiniBoard path={t < 9 ? STARE.slice(0, k) : []} state={done ? "good" : undefined} finger />
        </>
      );
    },
  },
  {
    title: "Longer words, more points",
    body: (
      <>
        Every extra letter is +1. Fill the ⚡ combo ring (4 words in 4 s) for bonus time in Quick Start. Prefer tapping? Tap letters one at a time, then tap the last one again to submit. <b>Qu</b> counts as 2 letters.
      </>
    ),
    loop: 7,
    demo: (t) => (
      <div className="flex w-full flex-col gap-1.5">
        {[
          ["TEN", "1 pt"],
          ["STAR", "2 pts"],
          ["STARE", "3 pts"],
          ["STONED", "4 pts"],
          ["WAKENED", "5 pts"],
        ].map(([w, p], i) => (
          <WordChip key={w} word={w} points={p} show={t > i} />
        ))}
      </div>
    ),
  },
  {
    title: "Be original: ×2",
    body: "With 3 or more players, words nobody else found score double. Head-to-head, every word scores normally.",
    loop: 8,
    demo: (t) => (
      <div className="grid w-full grid-cols-3 gap-2">
        {[
          { who: "🦊 You", words: [["TONE", "+2", "shared"], ["STARE", "+6", "unique"]], total: t > 2 ? 8 : t > 1 ? 2 : 0 },
          { who: "🐼", words: [["TONE", "+2", "shared"], ["LAKE", "+4", "unique"]], total: t > 3 ? 6 : t > 1 ? 2 : 0 },
          { who: "🐸", words: [["TONE", "+2", "shared"], ["SEA", "+2", "unique"]], total: t > 4 ? 4 : t > 1 ? 2 : 0 },
        ].map((col, c) => (
          <div key={col.who} className="bg-panel flex min-w-0 flex-col gap-1.5 p-1.5 text-sm">
            <div className="flex items-center justify-between font-semibold">
              <span>{col.who}</span>
              <span className="bg-title text-xl tabular-nums">{col.total}</span>
            </div>
            {col.words.map(([w, p, k], i) => (
              <WordChip key={w} word={w} points={p} kind={k as "unique" | "shared"} show={t > (i === 0 ? 1 : 2 + c)} />
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: `Longest word: +${LONGEST_WORD_BONUS}`,
    body: "In No chill mode, whoever finds the single longest word gets a bonus.",
    loop: 6,
    demo: (t) => (
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full flex-col gap-1.5">
          <WordChip word="STAR" points="🐼" />
          <WordChip word="STONED" points="🦊" kind={t > 1 ? "bonus" : undefined} />
          <WordChip word="LAKE" points="🐼" />
        </div>
        <div className={`bg-panel px-4 py-2 text-center ${t > 1 ? "bg-banner" : ""}`} style={{ visibility: t > 1 ? "visible" : "hidden" }}>
          📏 <b className="uppercase">stoned</b> · +{LONGEST_WORD_BONUS} to 🦊
        </div>
      </div>
    ),
  },
  {
    title: "🔥 No chill mode",
    body: `Rooms are chill by default. Flip on No chill and ${BOMB_WORD_LENGTH}+ letter words earn a 💣 bomb (covers a rival's letter for 5 s) or a 🙃 flip (turns 2 letters upside down). Fill the combo ring (4 words in 4 s) for a 🛡️ shield. The last 15 s are worth +10%.`,
    loop: 11,
    demo: (t) => (
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex h-12 items-center">
          {t < 2 && <span className="bg-word good">STONED +4</span>}
          {t >= 2 && t < 4 && <span className="bg-btn bg-bomb-btn">💣 Bomb a rival</span>}
          {t >= 4 && <span className="bg-toast hit">💣 Fox bombed your board! {Math.max(1, 9 - t)}s</span>}
        </div>
        <div className="text-xs opacity-75">🐼 Rival&apos;s board</div>
        <MiniBoard blocked={t >= 4 && t < 10 ? 6 : undefined} />
      </div>
    ),
  },
  {
    title: "Keep playing, keep score",
    body: "Rooms play best of 3 by default (first to 2 wins), or go Continuous and keep score forever. Scores stay hidden until halftime 🙈. Beat your personal best!",
    loop: 6,
    demo: (t) => (
      <div className="flex w-full flex-col gap-2">
        {[
          ["🦊", "You", 1 + Math.min(t, 2), "Letter Legend"],
          ["🐼", "Rival", 1, ""],
        ].map(([e, n, w, title], i) => (
          <div key={n as string} className={`bg-standing ${i === 0 ? "top" : ""}`}>
            <span className="relative text-3xl">
              {e}
              {i === 0 && <span className="bg-crown">👑</span>}
            </span>
            <span className="flex-1 font-semibold">
              {n}
              {title && <span className="bg-title-badge ml-2">{(w as number) >= 3 ? "Vocab Villain" : title}</span>}
            </span>
            <span key={String(w)} className="bg-banner text-lg font-bold">
              {w} 🏆
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Playing alone?",
    body: (
      <>
        ⚡ <b>Quick Start</b> pits you against Dr. Hoot 🦉. 📅 <b>Daily Puzzle</b> gives everyone the same board each day, and your first try counts. ⏳{" "}
        <b>Survival</b> starts you at 30 seconds, and every word adds time.
      </>
    ),
    loop: 4,
    demo: (t) => (
      <div className="grid w-full grid-cols-3 gap-2 text-center">
        {[
          ["⚡", "Quick"],
          ["📅", "Daily"],
          ["⏳", "Survival"],
        ].map(([e, n], i) => (
          <div key={n} className={`bg-standing flex-col !gap-1 py-3 ${t % 3 === i ? "top" : ""}`}>
            <span className="text-3xl">{e}</span>
            <span className="text-sm font-semibold">{n}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const [tick, setTick] = useState(0);
  const furthest = useRef(0);
  useEffect(() => {
    furthest.current = Math.max(furthest.current, slide + 1);
  }, [slide]);
  useEffect(() => () => track("howto", { slide: furthest.current, of: SLIDES.length }), []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const go = (d: number) => {
    setSlide((s) => Math.min(SLIDES.length - 1, Math.max(0, s + d)));
    setTick(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const s = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  return (
    <div className="bg-modal" onClick={onClose} role="dialog" aria-modal aria-label="How to play" data-testid="how-to-play">
      <div className="bg-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-70">
            {slide + 1} / {SLIDES.length}
          </span>
          <button className="bg-btn bg-btn-ghost px-3 py-1.5 text-base" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div key={slide} className="bg-step flex flex-1 flex-col items-center gap-3">
          <div className="bg-title text-center text-2xl">{s.title}</div>
          <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-2">{s.demo(tick % s.loop)}</div>
          <p className="text-center text-sm opacity-90">{s.body}</p>
        </div>
        <div className="flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`bg-dot ${i === slide ? "on" : ""}`}
              aria-label={`Step ${i + 1}`}
              onClick={() => {
                setSlide(i);
                setTick(0);
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button className="bg-btn bg-btn-ghost flex-1" disabled={slide === 0} onClick={() => go(-1)}>
            ← Back
          </button>
          <button className="bg-btn bg-btn-primary flex-1" onClick={() => (last ? onClose() : go(1))} data-testid="how-next">
            {last ? "Let's play!" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
