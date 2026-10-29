"use client";

import { useEffect, useRef, useState } from "react";
import { serverNow } from "@/lib/boggled/clock";
import type { Dictionary } from "@/lib/boggled/dictionary";
import { SHIELD_COMBO, SHIELD_WINDOW_MS, type RoomController, type RoomState, type Weapon } from "@/lib/boggled/room";
import { DANGER_BOOST, wordPoints } from "@/lib/boggled/scoring";
import { sound } from "@/lib/boggled/sound";
import { Toasts } from "./Extras";
import Grid, { type SubmitResult } from "./Grid";

type Feedback = { text: string; kind: "good" | "dup" | "bad" | ""; key: number };

export default function Game({
  state,
  controller,
  dict,
  onLeave,
}: {
  state: RoomState;
  controller: RoomController;
  dict: Dictionary | null;
  onLeave: () => void;
}) {
  const round = state.round!;
  const [now, setNow] = useState(() => serverNow());
  const [live, setLive] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [shieldInfo, setShieldInfo] = useState(false);
  const solo = round.players.length === 1;
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
    showFeedback(`${word.toUpperCase()} +${wordPoints(word)}${state.dangerZone ? " ☠️" : ""}`, "good");
    return "valid";
  };

  const myPoints = state.myWords.reduce((sum, w) => sum + wordPoints(w), 0);
  const playing = phase === "playing" && participant;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const present = new Set(state.roster.map((m) => m.id));
  const waitingFor = round.players.filter((p) => present.has(p.id) && !state.finals[p.id]);
  const blocked = new Set(Object.keys(state.blocked).map(Number));
  const flipped = new Set(Object.keys(state.flipped).map(Number));
  const canAttack = playing && controller.attackTargets().length > 0;
  const weapons: { weapon: Weapon; label: string }[] = [
    { weapon: "bomb", label: "💣 Bomb" },
    { weapon: "flip", label: "🙃 Flip" },
  ];
  const fire = (weapon: Weapon) => {
    sound.unlock();
    controller.attack(weapon);
    navigator.vibrate?.(30);
  };
  const series = round.series;
  const danger = state.dangerZone && phase === "playing";

  return (
    <div className={`bg-screen gap-3 ${danger ? "bg-danger" : ""}`} data-testid="game">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`bg-timer text-xl ${phase === "playing" && (remaining <= 10 || danger) ? "urgent" : ""}`} data-testid="timer">
            ⏱ {mm}:{ss}
          </div>
          {solo && phase !== "collecting" && (
            <button className="bg-btn bg-btn-ghost px-3 py-1.5 text-base" onClick={() => setConfirmEnd(true)} data-testid="end-early">
              ✕ End
            </button>
          )}
          {series && (
            <span className="bg-chip text-xs" data-testid="series-chip">
              Game {series.game} · Bo{series.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
        {state.powers.shield > 0 && (
          <button className="bg-shield-chip" aria-label="Shield" onClick={() => setShieldInfo((v) => !v)} data-testid="shield">
            🛡️
          </button>
        )}
        <div className="text-right">
          <div className="text-2xl font-bold leading-none" data-testid="my-score">
            {myPoints}
            <span className="ml-1 text-sm font-semibold opacity-70">pts</span>
          </div>
          <div className="text-xs opacity-75">
            {state.myWords.length} {state.myWords.length === 1 ? "word" : "words"}
          </div>
        </div>
        </div>
      </div>

      {shieldInfo && state.powers.shield > 0 && (
        <button className="bg-shield-info bg-step px-3 py-2 text-left text-sm" onClick={() => setShieldInfo(false)} data-testid="shield-info">
          <b>🛡️ Shield ready.</b> It automatically blocks the next bomb or flip thrown at you. You earn one by finding {SHIELD_COMBO} words
          within {SHIELD_WINDOW_MS / 1000} seconds. <span className="opacity-60">Tap to close</span>
        </button>
      )}

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
              {p.id === state.me.id ? (
                <span className="rounded-full bg-black/25 px-2 tabular-nums">{myPoints}</span>
              ) : state.halftime ? (
                <span key="pts" className="bg-banner rounded-full bg-black/25 px-2 tabular-nums" title="Points so far (before ×2)">
                  {state.livePoints[p.id] ?? 0}
                </span>
              ) : (
                <span className="rounded-full bg-black/25 px-2" title="Scores reveal at halftime">
                  🙈
                </span>
              )}
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
        blocked={blocked}
        flipped={flipped}
        classify={classify}
        onSubmit={onSubmit}
        onPathChange={setLive}
      />

      {canAttack && (state.powers.bomb > 0 || state.powers.flip > 0) && (
        <div className="flex justify-center gap-2">
          {weapons
            .filter((w) => state.powers[w.weapon] > 0)
            .map((w) => (
              <button key={w.weapon} className={`bg-btn bg-attack-btn ${w.weapon}`} onClick={() => fire(w.weapon)} data-testid={w.weapon}>
                {w.label}
                {state.powers[w.weapon] > 1 ? ` ×${state.powers[w.weapon]}` : ""}
              </button>
            ))}
        </div>
      )}

      {danger && (
        <div className="-mb-2 text-center text-xs font-bold tracking-wide text-[#ff9fb2]" data-testid="danger-zone">
          ☠️ DANGER ZONE · +{Math.round(DANGER_BOOST * 100)}% ON EVERY WORD
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div className="bg-found absolute inset-0 overflow-y-auto pt-2" data-testid="found">
          {state.myWords.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <Toasts state={state} controller={controller} />
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

      {confirmEnd && phase !== "collecting" && (
        <div className="bg-modal" onClick={() => setConfirmEnd(false)} role="dialog" aria-modal aria-label="End practice" data-testid="end-confirm">
          <div className="bg-modal-card text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl">🏁</div>
            <div className="bg-title text-2xl">End practice early?</div>
            <p className="text-sm opacity-85">
              You&apos;ve found {state.myWords.length} {state.myWords.length === 1 ? "word" : "words"} for {myPoints} pts with {mm}:{ss} left.
            </p>
            <button
              className="bg-btn bg-btn-primary"
              onClick={() => {
                setConfirmEnd(false);
                controller.endEarly();
              }}
              data-testid="end-score"
            >
              🏆 End &amp; see my score
            </button>
            <button className="bg-btn bg-btn-ghost" onClick={onLeave} data-testid="end-home">
              🏠 Quit to home
            </button>
            <button className="bg-btn bg-btn-ghost" onClick={() => setConfirmEnd(false)} data-testid="end-cancel">
              Keep playing
            </button>
          </div>
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
