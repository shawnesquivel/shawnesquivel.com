"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { compareWords, LONGEST_WORD_BONUS } from "@/lib/boggled/scoring";
import { sound } from "@/lib/boggled/sound";
import type { Member } from "@/lib/boggled/transport";

const VICTORY = ["Transcendent", "Glorious", "Stupendous", "Legendary", "Magnificent", "Flawless", "Spectacular"];

type Step = { word: string; base: number; finders: string[]; unique: boolean };

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / 450);
      const v = Math.round(begin + (value - begin) * (1 - Math.pow(1 - k, 3)));
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

export default function Results({ state, controller }: { state: RoomState; controller: RoomController }) {
  const round = state.round!;
  const outcome = state.outcome;
  const result = outcome?.result;
  const solo = round.players.length === 1;

  const members = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of [...round.players, ...state.roster]) map.set(m.id, m);
    return map;
  }, [round.players, state.roster]);

  const steps = useMemo<Step[]>(() => {
    if (!result) return [];
    const byWord = new Map<string, Step>();
    for (const p of result.players) {
      for (const w of p.words) {
        const s = byWord.get(w.word) ?? { word: w.word, base: w.base, finders: [], unique: w.unique };
        s.finders.push(p.id);
        byWord.set(w.word, s);
      }
    }
    return [...byWord.values()].sort((a, b) => -compareWords(a.word, b.word));
  }, [result]);

  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<"intro" | "reveal" | "bonus" | "podium">("intro");
  const hasBonus = !!result && result.longestWinners.length > 0;

  useEffect(() => {
    if (!result) return;
    let timer: ReturnType<typeof setTimeout>;
    if (stage === "intro") {
      timer = setTimeout(() => setStage("reveal"), 1000);
    } else if (stage === "reveal") {
      if (step < steps.length) {
        const delay = Math.max(140, Math.min(650, 14000 / Math.max(1, steps.length)));
        timer = setTimeout(() => {
          sound.reveal(step, steps[step].unique);
          setStep((s) => s + 1);
        }, delay);
      } else {
        timer = setTimeout(() => setStage(hasBonus ? "bonus" : "podium"), 700);
      }
    } else if (stage === "bonus") {
      sound.bonus();
      timer = setTimeout(() => setStage("podium"), 2200);
    }
    return () => clearTimeout(timer);
  }, [stage, step, steps, hasBonus, result]);

  const playedFanfare = useRef<string | null>(null);
  useEffect(() => {
    if (stage === "podium" && result && playedFanfare.current !== outcome!.roundId) {
      playedFanfare.current = outcome!.roundId;
      sound.fanfare();
    }
  }, [stage, result, outcome]);

  if (!result) {
    return (
      <div className="bg-screen items-center justify-center">
        <p className="text-xl">Tallying…</p>
      </div>
    );
  }

  const skip = () => {
    setStep(steps.length);
    setStage("podium");
  };

  const revealed = steps.slice(0, step);
  const showBonus = stage === "bonus" || stage === "podium";
  const scoreFor = (id: string) =>
    revealed.reduce((sum, s) => (s.finders.includes(id) ? sum + (s.unique ? s.base * 2 : s.base) : sum), 0) +
    (showBonus && result.longestWinners.includes(id) ? LONGEST_WORD_BONUS : 0);

  const columns = round.players.filter((p) => result.players.some((r) => r.id === p.id));
  const winners = result.players.filter((p) => p.rank === 1);
  const longestWord = steps.length ? steps[steps.length - 1].word : "";
  const adjective = VICTORY[(outcome!.roundId.charCodeAt(0) + outcome!.roundId.charCodeAt(1)) % VICTORY.length];
  const name = (id: string) => (id === state.me.id ? "You" : members.get(id)?.name ?? "?");
  const isHost = state.hostId === state.me.id;
  const tallyRounds = Object.values(state.tally).reduce((sum, t) => sum + t.wins, 0) >= 2;

  return (
    <div className="bg-screen gap-4" data-testid="results">
      {stage === "podium" ? (
        <div className="bg-banner relative pt-4 text-center" data-testid="podium">
          <span className="bg-star left-2 top-0 text-3xl">⭐</span>
          <span className="bg-star right-4 top-2 text-2xl" style={{ animationDelay: "0.6s" }}>
            ⭐
          </span>
          {solo ? (
            <>
              <div className="bg-title text-2xl opacity-90">Round over!</div>
              <div className="bg-title text-5xl text-[var(--gold)]">{result.players[0]?.total ?? 0} points</div>
            </>
          ) : winners.length > 1 ? (
            <div className="bg-title text-5xl text-[var(--gold)]">It&apos;s a tie!</div>
          ) : (
            <>
              <div className="bg-title text-2xl opacity-90">{adjective} victory,</div>
              <div className="bg-title truncate text-5xl text-[var(--gold)]">
                {winners[0].id === state.me.id ? "YOU" : name(winners[0].id).toUpperCase()}!
              </div>
            </>
          )}
          {!solo && (
            <div className="mt-4 flex items-end justify-center gap-3">
              {result.players.map((p) => (
                <div key={p.id} className="bg-panel flex w-28 flex-col items-center px-2 py-3">
                  <div className="text-4xl">{members.get(p.id)?.emoji}</div>
                  <div className="w-full truncate text-sm font-semibold">{name(p.id)}</div>
                  <div className="text-xs opacity-75">{p.words.length} words</div>
                  <div className="bg-title text-3xl">{p.rank === 1 ? "1st" : p.rank === 2 ? "2nd" : p.rank === 3 ? "3rd" : `${p.rank}th`}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="bg-title text-2xl">{stage === "intro" ? "Let's see those words!" : stage === "bonus" ? "Bonus!" : "Revealing…"}</div>
          <button className="bg-btn bg-btn-ghost px-4 py-2 text-base" onClick={skip}>
            Skip ⏭
          </button>
        </div>
      )}

      {showBonus && hasBonus && (
        <div className="bg-banner bg-panel px-4 py-3 text-center" data-testid="longest-bonus">
          <div className="text-sm opacity-80">📏 Longest word</div>
          <div className="bg-title text-2xl uppercase">{longestWord}</div>
          <div className="text-sm">
            +{LONGEST_WORD_BONUS} to {result.longestWinners.map(name).join(" & ")}
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, minmax(0, 1fr))` }}>
        {columns.map((p) => {
          const mine = revealed.filter((s) => s.finders.includes(p.id)).reverse();
          return (
            <div key={p.id} className="bg-col bg-panel p-3" data-testid={`col-${p.id}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-3xl">{p.emoji}</span>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{name(p.id)}</div>
                  <div className="bg-score" data-testid="score">
                    <AnimatedNumber value={scoreFor(p.id)} />
                  </div>
                </div>
              </div>
              <div className="flex max-h-[40dvh] flex-col gap-1.5 overflow-y-auto">
                {mine.map((s) => (
                  <div key={s.word} className={`bg-reveal ${solo ? "" : s.unique ? "unique" : "shared"}`}>
                    <span className="bg-reveal-word truncate">{s.word}</span>
                    <span className="shrink-0 text-sm">
                      {!solo && s.unique ? <b className="text-[var(--gold)]">×2 </b> : null}+{s.unique && !solo ? s.base * 2 : s.base}
                    </span>
                  </div>
                ))}
                {stage === "podium" && mine.length === 0 && <div className="text-sm opacity-70">No words this time</div>}
              </div>
            </div>
          );
        })}
      </div>

      {stage === "podium" && (
        <>
          {outcome!.missed.length > 0 && (
            <div className="bg-panel p-3">
              <div className="mb-2 text-sm opacity-80">
                {solo ? "Words you missed" : "Words nobody found"} ({outcome!.allWords} on the board):
              </div>
              <div className="bg-found">
                {outcome!.missed.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
            </div>
          )}

          {!solo && tallyRounds && (
            <div className="bg-panel p-3 text-sm">
              <div className="mb-1 opacity-80">Session</div>
              {Object.entries(state.tally)
                .sort((a, b) => b[1].wins - a[1].wins || b[1].points - a[1].points)
                .map(([id, t]) => (
                  <div key={id} className="flex justify-between">
                    <span>
                      {members.get(id)?.emoji} {name(id)}
                    </span>
                    <span>
                      {t.wins} 🏆 · {t.points} pts
                    </span>
                  </div>
                ))}
            </div>
          )}

          {isHost ? (
            <div className="flex gap-3">
              <button className="bg-btn bg-btn-primary flex-1" onClick={() => controller.startRound()} data-testid="play-again">
                Play again
              </button>
              <button className="bg-btn bg-btn-ghost" onClick={() => controller.backToLobby()}>
                Settings
              </button>
            </div>
          ) : (
            <p className="text-center opacity-80">Waiting for {name(state.hostId)} to start the next round…</p>
          )}
        </>
      )}
    </div>
  );
}
