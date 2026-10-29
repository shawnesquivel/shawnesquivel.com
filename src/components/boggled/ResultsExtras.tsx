"use client";

import { useEffect, useMemo, useState } from "react";
import { applyRound, bestKey, loadBests, saveBests } from "@/lib/boggled/bests";
import type { Round, RoomState, RoundOutcome } from "@/lib/boggled/room";
import { wordPoints } from "@/lib/boggled/scoring";
import { seriesStatus } from "@/lib/boggled/series";
import { sound } from "@/lib/boggled/sound";

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function SeriesPanel({ state, round }: { state: RoomState; round: Round }) {
  const series = round.series;
  const status = series ? seriesStatus(state.seriesRecords, series) : null;
  const champion = status?.champion ?? null;
  useEffect(() => {
    if (champion) sound.champion();
  }, [champion]);
  if (!series || !status) return null;
  const name = (id: string) => (id === state.me.id ? "You" : round.players.find((p) => p.id === id)?.name ?? "?");
  const emoji = (id: string) => round.players.find((p) => p.id === id)?.emoji ?? "";
  return (
    <div className={`bg-panel p-4 ${champion ? "bg-champion" : ""}`} data-testid="series">
      {champion ? (
        <div className="bg-banner mb-3 text-center" data-testid="champion">
          <div className="text-5xl">🏆</div>
          <div className="bg-title text-sm tracking-widest opacity-90">SERIES CHAMPION</div>
          <div className="bg-title text-4xl text-[var(--gold)]">
            {emoji(champion)} {champion === state.me.id ? "YOU!" : name(champion).toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="mb-2 flex items-center justify-between">
          <div className="bg-title text-lg">
            Best of {series.length} · Game {series.game}
          </div>
          <span className="bg-chip text-xs">First to {status.needed}</span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {round.players.map((p) => {
          const wins = status.wins[p.id] ?? 0;
          const matchPoint = !champion && wins === status.needed - 1;
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-2xl">{p.emoji}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">
                {name(p.id)}
                {matchPoint && <span className="bg-title-badge ml-2">Match point</span>}
              </span>
              <span className="flex gap-1">
                {Array.from({ length: status.needed }, (_, i) => (
                  <span key={i} className={`bg-pip ${i < wins ? "on" : ""}`} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BattleLog({ state, round }: { state: RoomState; round: Round }) {
  if (!state.feed.length) return null;
  const name = (id: string) => (id === state.me.id ? "You" : round.players.find((p) => p.id === id)?.name ?? "?");
  const icon = { bomb: "💣", flip: "🙃" };
  const thrown = new Map<string, number>();
  const blocked = new Map<string, number>();
  for (const f of state.feed) {
    thrown.set(f.from, (thrown.get(f.from) ?? 0) + 1);
    if (f.blocked) blocked.set(f.to, (blocked.get(f.to) ?? 0) + 1);
  }
  const [topId, topCount] = [...thrown.entries()].sort((a, b) => b[1] - a[1])[0];
  return (
    <div className="bg-panel p-4" data-testid="battle-log">
      <div className="mb-2 flex items-center justify-between">
        <div className="bg-title text-lg">⚔️ Battle log</div>
        <span className="bg-chip text-xs">{state.feed.length} attacks</span>
      </div>
      <p className="mb-2 text-sm font-semibold">
        {topCount >= 2 ? `${name(topId)} came in hot with ${topCount} attacks 🔥` : `${name(topId)} drew first blood 🩸`}
        {[...blocked.entries()].map(([id, n]) => ` · ${name(id)} blocked ${n} with a shield 🛡️`).join("")}
      </p>
      <ol className="flex flex-col gap-1 text-sm">
        {state.feed.map((f) => (
          <li key={f.id} className="bg-feed-row">
            <span className="w-10 shrink-0 tabular-nums opacity-60">{fmt(f.at)}</span>
            <span className="min-w-0 flex-1 truncate">
              <b>{name(f.from)}</b> {icon[f.weapon]} → <b>{name(f.to)}</b>
            </span>
            {f.blocked && <span className="shrink-0 text-xs">🛡️ blocked</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function BestsPanel({ state, round, outcome }: { state: RoomState; round: Round; outcome: RoundOutcome }) {
  const me = outcome.result.players.find((p) => p.id === state.me.id);
  // Snapshot before this round is saved, so "was X" stays correct.
  const [before] = useState(loadBests);
  const key = bestKey(round.settings.size, round.settings.duration);
  const score = me?.total ?? 0;
  const words = useMemo(() => me?.words.map((w) => w.word) ?? [], [me]);
  const update = useMemo(() => applyRound(before, { key, score, words }), [before, key, score, words]);

  useEffect(() => {
    if (me) saveBests(update.next);
  }, [me, update]);
  useEffect(() => {
    if (update.newScore) sound.bonus();
  }, [update.newScore]);

  if (!me) return null;

  const multiplayer = outcome.result.players.length > 1;
  const winner = outcome.result.players[0];
  const margin = winner.total - me.total;
  const bigMisses = outcome.missed.filter((w) => w.length >= 6).slice(0, 3);
  const setup = `${round.settings.size}×${round.settings.size} · ${fmt(round.settings.duration)}`;
  const prev = update.prevScore;

  return (
    <div className="bg-panel flex flex-col gap-3 p-4" data-testid="bests">
      {update.newScore ? (
        <div className="bg-banner bg-pb text-center" data-testid="new-pb">
          <div className="text-sm font-bold tracking-widest">🎉 NEW PERSONAL BEST 🎉</div>
          <div className="bg-title text-4xl">{score} pts</div>
          <div className="text-sm opacity-80">
            was {prev} on {setup}
          </div>
        </div>
      ) : prev !== null ? (
        <div data-testid="pb-progress">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold">
              {prev === score
                ? "Tied your best! 🤝"
                : prev - score <= Math.max(3, prev * 0.15)
                  ? `So close! ${prev - score} pts off your best 😩`
                  : "Your best"}
            </span>
            <span className="opacity-80">
              {score} / {prev} pts
            </span>
          </div>
          <div className="bg-progress">
            <span style={{ width: `${Math.min(100, (score / Math.max(1, prev)) * 100)}%` }} />
          </div>
          <div className="mt-1 text-xs opacity-70">{setup}</div>
        </div>
      ) : score > 0 ? (
        <div className="text-sm">
          <b>{score} pts</b> is your first record on {setup}. Beat it next round 💪
        </div>
      ) : null}

      {(update.newLongest || update.newMostWords) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {update.newLongest && <span className="bg-chip">📏 Longest word ever: {update.next.longest.toUpperCase()}</span>}
          {update.newMostWords && <span className="bg-chip">📚 Most words ever: {update.next.mostWords}</span>}
        </div>
      )}

      {multiplayer && me.rank > 1 && margin > 0 && margin <= 4 && (
        <div className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold" data-testid="near-miss">
          😤 Lost by {margin} {margin === 1 ? "point" : "points"}. One more word would&apos;ve done it.
        </div>
      )}

      {bigMisses.length > 0 && (
        <div className="text-sm" data-testid="missed-big">
          <div className="mb-1 font-semibold">😱 Right under your nose:</div>
          <div className="flex flex-wrap gap-1.5">
            {bigMisses.map((w) => (
              <span key={w} className="bg-chip uppercase">
                {w} <span className="text-[var(--gold)]">+{wordPoints(w)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
