"use client";

import { useEffect, useRef, useState } from "react";
import { serverNow } from "@/lib/boggled/clock";
import type { Dictionary } from "@/lib/boggled/dictionary";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { wordPoints } from "@/lib/boggled/scoring";
import { sound } from "@/lib/boggled/sound";
import Grid, { type SubmitResult } from "./Grid";

type Feedback = { text: string; kind: "good" | "dup" | "bad" | ""; key: number };

export default function Game({
  state,
  controller,
  dict,
}: {
  state: RoomState;
  controller: RoomController;
  dict: Dictionary | null;
}) {
  const round = state.round!;
  const [now, setNow] = useState(() => serverNow());
  const [live, setLive] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSecond = useRef<number | null>(null);
  const participant = round.players.some((p) => p.id === state.me.id);
  const minLength = round.settings.minLength;

  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(id);
  }, []);

  const phase = state.phase;
  const toStart = Math.ceil((round.startsAt - now) / 1000);
  const remaining = Math.max(0, Math.ceil((round.endsAt - now) / 1000));

  useEffect(() => {
    const marker = phase === "countdown" ? -toStart : phase === "playing" ? remaining : null;
    if (marker === null || marker === lastSecond.current) return;
    lastSecond.current = marker;
    if (phase === "countdown" && toStart >= 1 && toStart <= 3) sound.countdown(false);
    if (phase === "playing" && remaining === Math.ceil((round.endsAt - round.startsAt) / 1000)) sound.countdown(true);
    if (phase === "playing" && remaining <= 10 && remaining > 0) sound.tick(remaining <= 5);
  }, [phase, toStart, remaining, round.endsAt, round.startsAt]);

  const prevPhase = useRef(phase);
  useEffect(() => {
    if (prevPhase.current === "playing" && phase === "collecting") sound.roundEnd();
    prevPhase.current = phase;
  }, [phase]);

  const showFeedback = (text: string, kind: Feedback["kind"]) => {
    setFeedback({ text, kind, key: Date.now() });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1100);
  };

  const classify = (word: string) => {
    if (state.myWords.includes(word)) return "dup" as const;
    if (word.length >= minLength && dict?.has(word)) return "good" as const;
    return null;
  };

  const onSubmit = (word: string): SubmitResult => {
    if (word.length < minLength) {
      if (word.length > 1) showFeedback("Too short", "bad");
      return "short";
    }
    if (state.myWords.includes(word)) {
      sound.duplicate();
      showFeedback("Already found", "dup");
      return "dup";
    }
    if (!dict?.has(word)) {
      sound.invalid();
      showFeedback(`${word.toUpperCase()}?`, "bad");
      return "invalid";
    }
    controller.addWord(word);
    sound.valid(word.length);
    showFeedback(`${word.toUpperCase()} +${wordPoints(word)}`, "good");
    return "valid";
  };

  const myPoints = state.myWords.reduce((sum, w) => sum + wordPoints(w), 0);
  const playing = phase === "playing" && participant;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const present = new Set(state.roster.map((m) => m.id));
  const waitingFor = round.players.filter((p) => present.has(p.id) && !state.finals[p.id]);

  return (
    <div className="bg-screen gap-3" data-testid="game">
      <div className="flex items-center justify-between gap-2">
        <div className={`bg-timer text-xl ${phase === "playing" && remaining <= 10 ? "urgent" : ""}`} data-testid="timer">
          ⏱ {mm}:{ss}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold leading-none" data-testid="my-score">
            {myPoints}
            <span className="ml-1 text-sm font-semibold opacity-70">pts</span>
          </div>
          <div className="text-xs opacity-75">{state.myWords.length} words</div>
        </div>
      </div>

      {round.players.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {round.players.map((p) => (
            <div
              key={p.id}
              className="bg-chip flex shrink-0 items-center gap-1.5 text-sm"
              style={p.id === state.me.id ? { background: "rgb(255 210 63 / 0.25)" } : undefined}
            >
              <span className="text-lg leading-none">{p.emoji}</span>
              <span className="max-w-24 truncate">{p.id === state.me.id ? "You" : p.name}</span>
              <span className="rounded-full bg-black/25 px-2 tabular-nums">{state.progress[p.id] ?? 0}</span>
              {!present.has(p.id) && <span title="Disconnected">📵</span>}
            </div>
          ))}
        </div>
      )}

      <div
        key={feedback && !live ? feedback.key : "live"}
        className={`bg-word ${live ? classify(live) ?? "" : feedback ? `${feedback.kind} pop` : ""}`}
        data-testid="word"
      >
        {live ? live.toUpperCase() : feedback?.text ?? (participant ? "" : "Spectating")}
      </div>

      <Grid
        board={round.board}
        disabled={!playing}
        hideLetters={phase === "countdown"}
        classify={classify}
        onSubmit={onSubmit}
        onPathChange={setLive}
      />

      <div className="bg-found min-h-0 flex-1 overflow-y-auto pt-2" data-testid="found">
        {state.myWords.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      {!participant && phase !== "collecting" && (
        <p className="text-center text-sm opacity-80">Round in progress — you&apos;ll join the next one.</p>
      )}

      {phase === "countdown" && (
        <div className="bg-overlay">
          <div key={toStart} className="bg-count">
            {toStart > 0 ? toStart : "GO!"}
          </div>
          <p className="mt-2 text-lg opacity-80">Swipe across letters to make words</p>
        </div>
      )}

      {phase === "collecting" && (
        <div className="bg-overlay">
          <div className="bg-banner bg-title text-6xl">Time&apos;s up!</div>
          <p className="mt-4 text-lg opacity-80">
            {waitingFor.length ? `Collecting words from ${waitingFor.map((p) => p.name).join(", ")}…` : "Tallying…"}
          </p>
        </div>
      )}
    </div>
  );
}
