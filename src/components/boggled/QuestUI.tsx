"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { BOT, botFor } from "@/lib/boggled/bot";
import { formatCountdown, livesLeft, loadQuest, MAX_LIVES, nextLifeAt, questLevel, REGIONS, ruleChips, totalStars, type QuestSave } from "@/lib/boggled/quest";
import type { RoomState, Round } from "@/lib/boggled/room";
import { sound } from "@/lib/boggled/sound";

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function regionStyle(region: number): CSSProperties {
  const r = REGIONS[region];
  return { "--ground-a": r.ground[0], "--ground-b": r.ground[1], "--path": r.path } as CSSProperties;
}

// broke: animate the heart that was just lost
export function Lives({ save, now, broke = false }: { save: QuestSave; now: number; broke?: boolean }) {
  const lives = livesLeft(save, now);
  const next = nextLifeAt(save, now);
  return (
    <div className="bg-lives" data-testid="lives" aria-label={`${lives} of ${MAX_LIVES} lives`}>
      <span className="flex">
        {Array.from({ length: MAX_LIVES }, (_, i) => (
          <span key={i} className={`bg-heart ${i < lives ? "" : "empty"} ${broke && i === lives ? "broke" : ""}`}>
            {i < lives ? "❤️" : "🖤"}
          </span>
        ))}
      </span>
      {next && lives < MAX_LIVES && (
        <span className="bg-lives-timer" data-testid="lives-timer">
          +1 in {formatCountdown(next - now)}
        </span>
      )}
    </div>
  );
}

export function Stars({ n, size = "", animate = false }: { n: number; size?: string; animate?: boolean }) {
  return (
    <span className={`bg-stars ${size}`} data-testid="stars" data-stars={n}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`bg-star-slot ${i < n ? "on" : ""} ${animate ? "pop" : ""}`} style={{ animationDelay: `${i * 0.35}s` }}>
          ★
        </span>
      ))}
    </span>
  );
}

// Plays over the countdown of every bot round: you vs. them, the level, the stakes.
export function VsIntro({ state, round, toStart }: { state: RoomState; round: Round; toStart: number }) {
  const level = questLevel(round.bot!.level);
  const region = REGIONS[level.region];
  const opp = round.players.find((p) => p.id === BOT.id) ?? botFor(level.level);
  const practice = !round.bot!.quest;
  const [stars] = useState(() => totalStars(loadQuest()));
  useEffect(() => {
    const t = setTimeout(() => sound.slam(), 700);
    return () => clearTimeout(t);
  }, []);
  const chips = ruleChips({ ...round.settings, powers: level.powers });
  return (
    <div className={`bg-vsx ${level.boss ? "boss" : ""} ${level.final ? "final" : ""}`} style={regionStyle(level.region)} data-testid="vs-intro">
      <div className="bg-vsx-head">
        {level.boss && <div className="bg-vsx-boss bg-title">{level.final ? "🐉 FINAL BOSS" : "⚔️ BOSS BATTLE"}</div>}
        <div className="bg-vsx-region">
          {region.emoji} {region.name}
        </div>
        <div className="bg-vsx-level bg-title" data-testid="vs-level">
          LEVEL {level.level}
          {practice && <span className="bg-chip ml-2 align-middle text-xs">🎯 Practice</span>}
        </div>
      </div>
      <div className="bg-vsx-row">
        <div className="bg-vsx-card left">
          <div className="bg-vsx-avatar">{state.me.emoji}</div>
          <div className="bg-vsx-name">{state.me.name}</div>
          <div className="bg-chip px-2 py-0.5 text-xs">⭐ {stars}</div>
        </div>
        <div className="bg-vsx-vs bg-title">VS</div>
        <div className="bg-vsx-card right">
          <div className="bg-vsx-avatar">{opp.emoji}</div>
          <div className="bg-vsx-name">{opp.name}</div>
          <div className="bg-chip px-2 py-0.5 text-xs">Lv {level.level}</div>
        </div>
      </div>
      <div className="bg-bubble bg-vsx-taunt">“{level.taunt}”</div>
      <div className="bg-vsx-chips">
        {chips.map((c) => (
          <span key={c} className="bg-chip text-sm">
            {c}
          </span>
        ))}
      </div>
      {toStart <= 3 && (
        <div key={toStart} className="bg-vsx-count bg-title">
          {toStart > 0 ? toStart : "GO!"}
        </div>
      )}
    </div>
  );
}
