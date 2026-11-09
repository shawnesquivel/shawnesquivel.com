"use client";

import { useEffect, useState } from "react";
import { click } from "@/lib/boggled/analytics";
import { BOT, botFor } from "@/lib/boggled/bot";
import { formatCountdown, livesLeft, loadQuest, nextLifeAt, questLevel, REGIONS } from "@/lib/boggled/quest";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { compareWords } from "@/lib/boggled/scoring";
import { sound } from "@/lib/boggled/sound";
import { MissedWords } from "./ResultsExtras";
import { Lives, regionStyle, Stars, useNow } from "./QuestUI";

const RACE_MS = 2200;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const sorted = (p?: { words: { word: string; points: number }[] }) => [...(p?.words ?? [])].sort((x, y) => -compareWords(x.word, y.word));

// Results for rounds against a quest opponent: a score race, a verdict, stars. Word lists sit behind a toggle.
export default function QuestResults({ state, controller, onLeave }: { state: RoomState; controller: RoomController; onLeave: () => void }) {
  const round = state.round!;
  const outcome = state.outcome;
  const result = outcome?.result;
  const quest = outcome?.quest;
  const practice = !round.bot?.quest;
  const level = questLevel(round.bot?.level ?? 1);
  const region = REGIONS[level.region];
  const opp = round.players.find((p) => p.id === BOT.id) ?? botFor(level.level);
  const now = useNow();
  const [save, setSave] = useState(loadQuest);
  const [stage, setStage] = useState<"race" | "verdict" | "done">("race");
  const [shown, setShown] = useState(0);
  const [words, setWords] = useState(false);

  const mine = result?.players.find((p) => p.id === state.me.id);
  const theirs = result?.players.find((p) => p.id === BOT.id);
  const a = mine?.total ?? 0;
  const b = theirs?.total ?? 0;
  const won = a > b;
  const tie = a === b;
  const stars = quest?.stars ?? 0;

  useEffect(() => {
    if (!result) return;
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / RACE_MS);
      setShown(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const t1 = setTimeout(() => {
      setStage("verdict");
      setSave(loadQuest());
      if (won) sound.fanfare();
      else if (tie) sound.bonus();
      else sound.defeat();
    }, RACE_MS + 200);
    const t2 = setTimeout(() => setStage("done"), RACE_MS + 900 + stars * 350);
    const starTimers = Array.from({ length: stars }, (_, i) => setTimeout(() => sound.star(i), RACE_MS + 700 + i * 350));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      starTimers.forEach(clearTimeout);
    };
  }, [result, won, tie, stars]);

  if (!result) {
    return (
      <div className="bg-screen items-center justify-center">
        <p className="text-xl">Tallying…</p>
      </div>
    );
  }

  const top = Math.max(1, a, b);
  const lives = livesLeft(save, now);
  const next = nextLifeAt(save, now);
  const verdict = stage !== "race";
  const longest = sorted(mine)[0]?.word;
  const toMap = () => {
    click("quest_map");
    controller.backToLobby();
  };
  const replay = () => {
    click(practice ? "practice_again" : won ? "quest_replay" : "quest_retry");
    sound.unlock();
    controller.startRound();
  };

  const col = (who: "me" | "them") => {
    const me = who === "me";
    const score = me ? a : b;
    const winner = verdict && !tie && (me ? won : !won);
    const loser = verdict && !tie && !winner;
    return (
      <div className={`bg-race-col ${winner ? "winner" : ""} ${loser ? "loser" : ""}`} data-testid={me ? "race-me" : "race-them"}>
        <div className="bg-race-track">
          <div className={`bg-race-fill ${me ? "me" : "them"}`} style={{ height: `${Math.max(4, (score / top) * 100 * shown)}%` }}>
            <span className="bg-race-score bg-title" data-testid={me ? "score-me" : "score-them"}>
              {Math.round(score * shown)}
            </span>
          </div>
        </div>
        <div className="bg-race-avatar">
          {winner && <span className="bg-race-crown">👑</span>}
          {me ? state.me.emoji : opp.emoji}
        </div>
        <div className="max-w-full truncate text-sm font-semibold">{me ? "You" : opp.name}</div>
      </div>
    );
  };

  return (
    <div className={`bg-screen bg-quest-results gap-4 ${verdict ? (won ? "won" : tie ? "tied" : "lost") : ""}`} style={regionStyle(level.region)} data-testid="results">
      <div className="flex items-center justify-between">
        <button className="bg-btn bg-btn-ghost w-12 px-0 py-2 text-base" onClick={() => { click("home"); onLeave(); }} aria-label="Home" data-testid="home-button">
          🏠
        </button>
        <span className="bg-chip text-sm">
          {region.emoji} Lv {level.level}
          {practice ? " · 🎯 Practice" : level.boss ? " · BOSS" : ""}
        </span>
        <span className="w-12" />
      </div>

      <div className="bg-verdict-wrap" data-testid="podium">
        {verdict ? (
          <div className="bg-verdict bg-title" data-testid="verdict">
            {won ? "VICTORY!" : tie ? "DRAW" : "DEFEAT"}
          </div>
        ) : (
          <div className="bg-verdict pending bg-title">⚔️</div>
        )}
        {verdict && quest && (
          <div className="mt-1">
            <Stars n={stars} size="big" animate />
          </div>
        )}
        {verdict && quest?.newBest && !quest.advanced && (
          <div className="bg-title-badge mt-2 inline-block">New best!</div>
        )}
      </div>

      <div className="bg-race">
        {col("me")}
        <div className="bg-race-vs bg-title">VS</div>
        {col("them")}
      </div>

      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <span className="bg-chip">📝 {plural(mine?.words.length ?? 0, "word")}</span>
        {longest && <span className="bg-chip uppercase">📏 {longest}</span>}
        <span className="bg-chip">
          {opp.emoji} {plural(theirs?.words.length ?? 0, "word")}
        </span>
      </div>

      {!practice && (
        <div className="flex justify-center">
          <Lives save={save} now={now} broke={verdict && !won && !tie} />
        </div>
      )}

      {stage === "done" && (
        <div className="bg-quest-actions flex gap-3">
          {practice ? (
            <>
              <button className="bg-btn bg-btn-ghost w-14 px-0" onClick={toMap} aria-label="Settings" data-testid="settings-button">
                ⚙️
              </button>
              <button className="bg-btn bg-btn-primary flex-1" onClick={replay} data-testid="play-again">
                Practice again 🔁
              </button>
            </>
          ) : won ? (
            <>
              {lives > 0 && (
                <button className="bg-btn bg-btn-ghost w-14 px-0" onClick={replay} aria-label="Replay level" data-testid="replay">
                  ↻
                </button>
              )}
              <button className="bg-btn bg-btn-primary flex-1 text-xl" onClick={toMap} data-testid="continue">
                {quest?.questComplete && quest.advanced ? "Claim the crown 👑" : "Continue ➜"}
              </button>
            </>
          ) : (
            <>
              <button className="bg-btn bg-btn-ghost w-14 px-0" onClick={toMap} aria-label="Map" data-testid="map-button">
                🗺️
              </button>
              {lives > 0 ? (
                <button className="bg-btn bg-btn-primary flex-1 text-xl" onClick={replay} data-testid="play-again">
                  Try again ❤️
                </button>
              ) : (
                <button className="bg-btn bg-btn-primary flex-1 text-base" disabled data-testid="out-of-lives">
                  💔 Next life in {next ? formatCountdown(next - now) : "…"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {stage === "done" && (
        <button className="bg-btn bg-btn-ghost text-base" onClick={() => setWords((w) => !w)} data-testid="words-toggle">
          📖 {words ? "Hide words" : "See the words"}
        </button>
      )}

      {words && (
        <>
          <div className="grid grid-cols-2 gap-3" data-testid="word-lists">
            {[mine, theirs].map((p, i) => (
              <div key={i} className="bg-panel flex max-h-[40dvh] flex-col overflow-y-auto p-3">
                <div className="mb-1 font-semibold">{i === 0 ? `${state.me.emoji} You` : `${opp.emoji} ${opp.name}`}</div>
                {sorted(p).map((w) => (
                  <div key={w.word} className="bg-reveal mb-1">
                    <span className="bg-reveal-word truncate">{w.word}</span>
                    <span className="shrink-0 text-sm">+{w.points}</span>
                  </div>
                ))}
                {!p?.words.length && <div className="text-sm opacity-70">No words</div>}
              </div>
            ))}
          </div>
          <MissedWords words={outcome!.missed} total={outcome!.allWords} title="Words nobody found" />
        </>
      )}
    </div>
  );
}
