"use client";

import { useState } from "react";
import type { RoomController, RoomState, Settings } from "@/lib/boggled/room";

function Choice<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm opacity-75">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            className="bg-chip"
            aria-pressed={o.value === value}
            disabled={disabled && o.value !== value}
            style={disabled && o.value !== value ? { opacity: 0.35 } : undefined}
            onClick={() => !disabled && onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Lobby({
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
  const [copied, setCopied] = useState(false);
  const isHost = state.hostId === state.me.id;
  const s = state.settings;
  const set = (patch: Partial<Settings>) => controller.updateSettings(patch);
  const host = state.roster.find((m) => m.id === state.hostId);

  const share = async () => {
    const url = `${location.origin}/boggled?room=${state.room}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Boggled", text: `Join my Boggled room: ${state.room}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="bg-screen gap-4" data-testid="lobby">
      <div className="flex items-center justify-between">
        <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={onLeave}>
          ← Leave
        </button>
        {state.status !== "connected" && <span className="bg-chip text-sm">Reconnecting…</span>}
      </div>

      {state.room && (
        <div className="bg-panel p-4 text-center">
          <div className="text-sm opacity-75">Room code</div>
          <div className="bg-title text-6xl tracking-[0.2em]" data-testid="room-code">
            {state.room}
          </div>
          <button className="bg-btn bg-btn-ghost mt-3 w-full" onClick={share}>
            {copied ? "Link copied!" : "🔗 Share invite link"}
          </button>
          {controller.transportKind === "local" && (
            <p className="mt-2 text-xs opacity-80">
              Online multiplayer isn&apos;t configured on this site yet, so rooms only work between tabs of this browser.
            </p>
          )}
        </div>
      )}

      <div className="bg-panel p-4">
        <div className="mb-2 text-sm opacity-75">Players ({state.roster.length})</div>
        <ul className="flex flex-col gap-2" data-testid="roster">
          {state.roster.map((m) => {
            const t = state.tally[m.id];
            return (
              <li key={m.id} className="flex items-center gap-3">
                <span className="text-3xl">{m.emoji}</span>
                <span className="flex-1 truncate text-lg font-semibold">
                  {m.name}
                  {m.id === state.me.id && <span className="opacity-60"> (you)</span>}
                </span>
                {t && t.wins > 0 && <span className="text-sm opacity-80">{t.wins} 🏆</span>}
                {m.id === state.hostId && <span title="Host">👑</span>}
              </li>
            );
          })}
        </ul>
        {state.room && state.roster.length < 2 && (
          <p className="mt-3 text-sm opacity-75">Waiting for friends… share the code above.</p>
        )}
      </div>

      <div className="bg-panel flex flex-col gap-4 p-4">
        <Choice
          label="Board"
          value={s.size}
          disabled={!isHost}
          options={[
            { value: 4, label: "4×4" },
            { value: 5, label: "5×5" },
          ]}
          onChange={(size) => set({ size })}
        />
        <Choice
          label="Timer"
          value={s.duration}
          disabled={!isHost}
          options={[
            { value: 60, label: "1 min" },
            { value: 90, label: "1:30" },
            { value: 120, label: "2 min" },
            { value: 180, label: "3 min" },
          ]}
          onChange={(duration) => set({ duration })}
        />
        <Choice
          label="Shortest word"
          value={s.minLength}
          disabled={!isHost}
          options={[
            { value: 3, label: "3 letters" },
            { value: 4, label: "4 letters" },
          ]}
          onChange={(minLength) => set({ minLength })}
        />
        <Choice
          label="Longest word bonus (+3)"
          value={s.longestBonus}
          disabled={!isHost}
          options={[
            { value: true, label: "On" },
            { value: false, label: "Off" },
          ]}
          onChange={(longestBonus) => set({ longestBonus })}
        />
      </div>

      <div className="mt-auto">
        {isHost ? (
          <button className="bg-btn bg-btn-primary w-full text-xl" disabled={!dictReady} onClick={() => controller.startRound()} data-testid="start">
            {dictReady ? "Start round" : "Loading words…"}
          </button>
        ) : (
          <p className="text-center text-lg opacity-85">Waiting for {host?.name ?? "the host"} to start…</p>
        )}
      </div>
    </div>
  );
}
