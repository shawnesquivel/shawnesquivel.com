"use client";

import { BOT, BOT_TAGLINES, loadBotLevel, MAX_BOT_LEVEL } from "@/lib/boggled/bot";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { useState } from "react";

export default function QuickIntro({
  state,
  controller,
  dictReady,
  onLeave,
}: {
  state: RoomState;
  controller: RoomController;
  dictReady: boolean;
  onLeave: () => void;
}) {
  const [level] = useState(loadBotLevel);
  const minutes = state.settings.duration / 60;
  const you = state.tally[state.me.id]?.wins ?? 0;
  const hoot = state.tally[BOT.id]?.wins ?? 0;

  return (
    <div className="bg-screen gap-5" data-testid="quick-intro">
      <div className="flex items-center justify-between">
        <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={onLeave} data-testid="leave">
          ← Home
        </button>
        <span className="bg-chip text-sm">⚡ Quick Start</span>
      </div>

      <div className="bg-title mt-2 text-center text-4xl leading-tight">
        You <span className="text-[var(--gold)]">vs.</span> {BOT.name}
      </div>

      <div className="bg-panel bg-vs flex items-center justify-around px-3 py-6">
        <div className="flex w-24 flex-col items-center gap-1">
          <span className="bg-vs-avatar">{state.me.emoji}</span>
          <span className="max-w-full truncate font-semibold">{state.me.name}</span>
        </div>
        <span className="bg-vs-badge bg-title">VS</span>
        <div className="flex w-24 flex-col items-center gap-1">
          <span className="bg-vs-avatar bg-vs-bot">{BOT.emoji}</span>
          <span className="font-semibold">{BOT.name}</span>
          <span className="bg-chip px-2 py-0.5 text-xs" data-testid="bot-level">
            Lv {level}
            {level === MAX_BOT_LEVEL ? " · MAX" : ""}
          </span>
        </div>
      </div>

      <div className="bg-bubble text-center text-sm" data-testid="bot-tagline">
        “{BOT_TAGLINES[level]}”
      </div>

      <ul className="flex flex-col gap-2 text-base">
        <li>👆 Swipe across letters to make words.</li>
        <li>📏 Longer words score more points.</li>
        <li>⏱ Most points in {minutes} {minutes === 1 ? "minute" : "minutes"} wins.</li>
        <li>🎓 Beat him and he levels up. Lose and he gets insufferable.</li>
      </ul>

      {(you > 0 || hoot > 0) && (
        <div className="text-center text-sm opacity-85" data-testid="bot-record">
          This session: You {you} – {hoot} {BOT.name}
        </div>
      )}

      <div className="sticky bottom-3 mt-auto">
        <button className="bg-btn bg-btn-primary w-full text-xl" disabled={!dictReady} onClick={() => controller.startRound()} data-testid="start">
          {dictReady ? "Start ⚡" : "Loading words…"}
        </button>
      </div>
    </div>
  );
}
