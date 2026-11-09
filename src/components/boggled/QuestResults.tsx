"use client";

import { useEffect, useMemo, useState } from "react";
import { click } from "@/lib/boggled/analytics";
import { BOT, botFor } from "@/lib/boggled/bot";
import { adsLeft, formatCountdown, livesLeft, loadQuest, nextLifeAt, pointsToNextStar, questLevel, REGIONS } from "@/lib/boggled/quest";
import { revealOrder, revealTotals } from "@/lib/boggled/reveal";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { compareWords } from "@/lib/boggled/scoring";
import { sound } from "@/lib/boggled/sound";
import { MissedWords } from "./ResultsExtras";
import { Lives, regionStyle, Stars, useNow } from "./QuestUI";
import { AdModal } from "./Shop";

// Total time for the word-by-word reveal; each word gets a beat between these bounds.
const REVEAL_MS = 9000;
const BEAT_MIN_MS = 170;
const BEAT_MAX_MS = 650;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const sorted = (p?: { words: { word: string; points: number }[] }) => [...(p?.words ?? [])].sort((x, y) => -compareWords(x.word, y.word));

// Results for rounds against a quest opponent: a word-by-word reveal where the lead swings back and forth,
// then a verdict and stars. Full word lists sit behind a toggle.
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
  const [stage, setStage] = useState<"reveal" | "verdict" | "done">("reveal");
  const [step, setStep] = useState(0);
  const [words, setWords] = useState(false);
  const [ad, setAd] = useState(false);

  const mine = result?.players.find((p) => p.id === state.me.id);
  const theirs = result?.players.find((p) => p.id === BOT.id);
  const a = mine?.total ?? 0;
  const b = theirs?.total ?? 0;
  const won = a > b;
  const tie = a === b;
  const stars = quest?.stars ?? 0;
  const meId = state.me.id;
  const steps = useMemo(() => {
    const words = (id: string) => result?.players.find((p) => p.id === id)?.words ?? [];
    return result ? revealOrder(words(meId), words(BOT.id)) : [];
  }, [result, meId]);
  const { totals } = useMemo(() => revealTotals(steps), [steps]);

  useEffect(() => {
    if (!result || stage !== "reveal") return;
    if (step >= steps.length) {
      const t = setTimeout(() => {
        setSave(loadQuest());
        setStage("verdict");
      }, 500);
      return () => clearTimeout(t);
    }
    const beat = Math.max(BEAT_MIN_MS, Math.min(BEAT_MAX_MS, REVEAL_MS / steps.length));
    const t = setTimeout(() => {
      const s = steps[step];
      const before = step ? totals[step - 1].leader : 0;
      const after = totals[step].leader;
      if (after && before && after !== before) sound.brag();
      else sound.reveal(step, s.me !== null && s.them !== null);
      setStep(step + 1);
    }, step === 0 ? 800 : beat);
    return () => clearTimeout(t);
  }, [result, stage, step, steps, totals]);

  useEffect(() => {
    if (stage !== "verdict") return;
    if (won) sound.fanfare();
    else if (tie) sound.bonus();
    else sound.defeat();
    const done = setTimeout(() => setStage("done"), 700 + stars * 350);
    const starTimers = Array.from({ length: stars }, (_, i) => setTimeout(() => sound.star(i), 500 + i * 350));
    return () => {
      clearTimeout(done);
      starTimers.forEach(clearTimeout);
    };
  }, [stage, won, tie, stars]);

  if (!result) {
    return (
      <div className="bg-screen items-center justify-center">
        <p className="text-xl">Tallying…</p>
      </div>
    );
  }

  const top = Math.max(1, a, b);
  const verdict = stage !== "reveal";
  const cur = verdict ? { me: a, them: b, leader: won ? 1 : tie ? 0 : -1 } : step ? totals[step - 1] : { me: 0, them: 0, leader: 0 };
  const prevLeader = totals.slice(0, Math.max(0, step - 1)).findLast((t) => t.leader)?.leader ?? 0;
  const leadChange = !verdict && cur.leader !== 0 && cur.leader !== prevLeader;
  const revealed = steps.slice(0, step);
  const skip = () => {
    click("skip_reveal");
    setStep(steps.length);
    setSave(loadQuest());
    setStage("verdict");
  };
  const lives = livesLeft(save, now);
  const next = nextLifeAt(save, now);
  const longest = sorted(mine)[0]?.word;
  const toNext = quest ? pointsToNextStar(a, b) : null;
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
    const score = me ? cur.me : cur.them;
    const winner = verdict && !tie && (me ? won : !won);
    const loser = verdict && !tie && !winner;
    const leading = !verdict && cur.leader === (me ? 1 : -1);
    const recent = revealed.filter((s) => (me ? s.me : s.them) !== null).slice(-3).reverse();
    return (
      <div className={`bg-race-col ${winner ? "winner" : ""} ${loser ? "loser" : ""}`} data-testid={me ? "race-me" : "race-them"}>
        <div className="bg-race-track">
          <div className={`bg-race-fill ${me ? "me" : "them"}`} style={{ height: `${Math.max(4, (score / top) * 100)}%` }}>
            <span key={score} className="bg-race-score bg-title" data-testid={me ? "score-me" : "score-them"}>
              {score}
            </span>
          </div>
        </div>
        <div className="bg-race-avatar">
          {(winner || leading) && <span key={leading ? "lead" : "win"} className="bg-race-crown">👑</span>}
          {me ? state.me.emoji : opp.emoji}
        </div>
        <div className="max-w-full truncate text-sm font-semibold">{me ? "You" : opp.name}</div>
        {!verdict && (
          <div className="bg-reveal-feed" data-testid={me ? "feed-me" : "feed-them"}>
            {recent.map((s, i) => (
              <span key={s.word} className={`bg-reveal-pop ${i ? "old" : ""} ${s.me !== null && s.them !== null ? "shared" : ""}`}>
                {s.word} +{me ? s.me : s.them}
              </span>
            ))}
          </div>
        )}
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
        ) : leadChange ? (
          <div key={step} className="bg-lead-call bg-title" data-testid="lead-call">
            {cur.leader === 1 ? "You take the lead!" : `${opp.emoji} ${opp.name} takes the lead!`}
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
        {verdict && toNext && won && (
          <div className="mt-1 text-sm opacity-85" data-testid="next-star">
            +{toNext.points} pts for {"★".repeat(toNext.stars)}
          </div>
        )}
      </div>

      <div className="bg-race" data-testid="reveal">
        {col("me")}
        <div className="bg-race-vs bg-title">VS</div>
        {col("them")}
      </div>

      {!verdict && steps.length > 0 && (
        <button className="bg-btn bg-btn-ghost mx-auto px-4 py-2 text-base" onClick={skip} data-testid="skip-reveal">
          Skip ⏭
        </button>
      )}

      {verdict && outcome?.coins && outcome.coins.total > 0 && (
        <div className="bg-coin-reward" data-testid="coin-reward">
          <span className="bg-coin-total bg-title">+{outcome.coins.total} 🪙</span>
          <span className="flex flex-wrap justify-center gap-1" title="Coins: words, win, stars, first clear">
            {outcome.coins.parts.map(([label, n]) => (
              <span key={label} className="bg-chip px-2 py-0.5 text-xs">
                {label} +{n}
              </span>
            ))}
          </span>
        </div>
      )}

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
              ) : adsLeft(save, now) > 0 ? (
                <button className="bg-btn bg-btn-primary flex-1 text-base" onClick={() => { click("ad"); setAd(true); }} data-testid="watch-ad">
                  📺 Watch ad · +1 ❤️
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

      {ad && <AdModal onReward={setSave} onClose={() => setAd(false)} />}

      {words && (
        <>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="bg-chip">📝 {plural(mine?.words.length ?? 0, "word")}</span>
            {longest && <span className="bg-chip uppercase">📏 {longest}</span>}
            <span className="bg-chip">
              {opp.emoji} {plural(theirs?.words.length ?? 0, "word")}
            </span>
          </div>
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
