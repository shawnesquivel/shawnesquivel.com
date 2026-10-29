"use client";

import { useEffect, useRef } from "react";
import { leaderLine, leaderTitle, standings } from "@/lib/boggled/banter";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { sound } from "@/lib/boggled/sound";

export const REACTIONS = ["😂", "🔥", "😭", "😤", "👏", "💀", "😘", "🤯"];

// Sounds and haptics for toasts/reactions that arrive from the room, whatever screen is showing.
export function useRoomEffects(state: RoomState) {
  const seen = useRef(new Set<string>());
  const lastBurst = useRef(0);
  useEffect(() => {
    if (state.comboBurst && state.comboBurst !== lastBurst.current) {
      lastBurst.current = state.comboBurst;
      if (state.round && state.round.players.length > 1) sound.combo();
    }
  }, [state.comboBurst, state.round]);
  useEffect(() => {
    for (const t of state.toasts) {
      if (seen.current.has(t.id)) continue;
      seen.current.add(t.id);
      if (t.kind === "earned") sound.bombEarned();
      if (t.kind === "launch") sound.bombLaunch();
      if (t.kind === "brag") sound.brag();
      if (t.kind === "hit") {
        sound.bombHit();
        navigator.vibrate?.([60, 40, 120]);
      }
      if (t.kind === "flip-hit") {
        sound.flipHit();
        navigator.vibrate?.([40, 30, 40]);
      }
      if (t.kind === "shield" || t.kind === "blocked") sound.shieldBlock();
      if (t.kind === "halftime") sound.whistle();
      if (t.kind === "combo") sound.combo();
      if (t.kind === "danger") {
        sound.siren();
        navigator.vibrate?.([100, 60, 100]);
      }
    }
    for (const r of state.reactions) {
      if (seen.current.has(r.id)) continue;
      seen.current.add(r.id);
      if (r.from !== state.me.id) sound.pop();
    }
  }, [state.toasts, state.reactions, state.me.id]);
}

export function Toasts({ state, controller }: { state: RoomState; controller: RoomController }) {
  if (!state.toasts.length) return null;
  return (
    <div className="bg-toasts" data-testid="toasts">
      {state.toasts.map((t) => (
        <button key={t.id} className={`bg-toast ${t.kind}`} onClick={() => controller.dismissToast(t.id)}>
          {t.text}
        </button>
      ))}
    </div>
  );
}

export function FloatingReactions({ state }: { state: RoomState }) {
  const emojiOf = (id: string) => state.roster.find((m) => m.id === id)?.emoji ?? "";
  return (
    <div className="bg-reactions" aria-hidden>
      {state.reactions.map((r) => {
        const lane = (r.id.charCodeAt(0) * 7 + r.id.charCodeAt(1)) % 70;
        return (
          <div key={r.id} className="bg-reaction" style={{ left: `${10 + lane}%` }}>
            <span className="text-5xl">{r.emoji}</span>
            <span className="bg-reaction-from">{emojiOf(r.from)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReactionBar({ controller }: { controller: RoomController }) {
  return (
    <div className="flex justify-between gap-1" data-testid="reaction-bar">
      {REACTIONS.map((e) => (
        <button
          key={e}
          className="bg-react-btn"
          aria-label={`React ${e}`}
          onClick={() => {
            sound.unlock();
            sound.pop();
            controller.react(e);
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function Scoreboard({ state }: { state: RoomState }) {
  const table = standings(state.tally);
  if (!table.length || state.roundsPlayed === 0) return null;
  const line = leaderLine(table, state.roundsPlayed);
  const leader = table[0];
  const soleLeader = leader.wins > 0 && (table.length < 2 || table[1].wins < leader.wins);
  return (
    <div className="bg-panel bg-scoreboard p-4" data-testid="scoreboard">
      <div className="mb-2 flex items-center justify-between">
        <div className="bg-title text-lg">🏆 Scoreboard</div>
        <div className="bg-chip text-xs">
          {state.roundsPlayed} {state.roundsPlayed === 1 ? "round" : "rounds"} played
        </div>
      </div>
      {line && (
        <div className="bg-banner mb-3 rounded-xl bg-white/10 px-3 py-2 text-center font-semibold" data-testid="banter">
          {line}
        </div>
      )}
      <ol className="flex flex-col gap-2">
        {table.map((t, i) => {
          const top = i === 0 && soleLeader;
          return (
            <li key={t.id} className={`bg-standing ${top ? "top" : ""}`}>
              <span className="w-5 text-center font-bold opacity-70">{i + 1}</span>
              <span className="relative text-3xl">
                {t.emoji}
                {top && <span className="bg-crown">👑</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {t.name}
                  {t.id === state.me.id && <span className="opacity-60"> (you)</span>}
                </span>
                {top && <span className="bg-title-badge">{leaderTitle(t.wins)}</span>}
              </span>
              <span className="text-right tabular-nums">
                <span className="block text-lg font-bold">
                  {t.series > 0 && <span className="mr-1.5 text-sm">{t.series} 🏅</span>}
                  {t.wins} 🏆
                </span>
                <span className="block text-xs opacity-75">{t.points} pts</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
