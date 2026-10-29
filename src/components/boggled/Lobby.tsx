"use client";

import { useState, type ReactNode } from "react";
import { BOMB_WORD_LENGTH, DANGER_ZONE_MS, type RoomController, type RoomState, type Settings } from "@/lib/boggled/room";
import { DANGER_BOOST, LONGEST_WORD_BONUS } from "@/lib/boggled/scoring";
import { ReactionBar, Scoreboard } from "./Extras";

type Option<T> = { value: T; label: string; sub?: string; icon?: ReactNode };

function Cards<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
  testId,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  disabled: boolean;
  testId: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold opacity-80">{label}</div>
      <div className="flex gap-2" data-testid={testId}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            className="bg-opt"
            aria-pressed={o.value === value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
          >
            {o.icon}
            <span>{o.label}</span>
            {o.sub && <span className="bg-opt-sub">{o.sub}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  icon,
  title,
  sub,
  on,
  onChange,
  disabled,
  testId,
}: {
  icon: string;
  title: string;
  sub: string;
  on: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
  testId: string;
}) {
  return (
    <button
      className="bg-toggle-row"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      data-testid={testId}
    >
      <span className="text-3xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-xs opacity-75">{sub}</span>
      </span>
      <span className={`bg-toggle ${on ? "on" : ""}`} />
    </button>
  );
}

function MiniGrid({ size }: { size: number }) {
  return (
    <span className="bg-mini-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size * size }, (_, i) => (
        <span key={i} />
      ))}
    </span>
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

      <Scoreboard state={state} />

      <div className="bg-panel flex flex-col gap-4 p-4" data-testid="settings">
        <div className="flex items-center justify-between">
          <div className="bg-title text-lg">⚙️ Game settings</div>
          {!isHost && <span className="text-xs opacity-70">{host?.name ?? "The host"} picks these</span>}
        </div>
        <Cards
          label="Board"
          testId="opt-size"
          value={s.size}
          disabled={!isHost}
          options={[
            { value: 4, label: "4×4", sub: "Classic", icon: <MiniGrid size={4} /> },
            { value: 5, label: "5×5", sub: "Big Boggle", icon: <MiniGrid size={5} /> },
          ]}
          onChange={(size) => set({ size })}
        />
        <Cards
          label="Timer"
          testId="opt-duration"
          value={s.duration}
          disabled={!isHost}
          options={[
            { value: 60, label: "1:00", sub: "⚡ Blitz" },
            { value: 90, label: "1:30", sub: "Quick" },
            { value: 120, label: "2:00", sub: "Classic" },
            { value: 180, label: "3:00", sub: "🐢 Chill" },
          ]}
          onChange={(duration) => set({ duration })}
        />
        <Cards
          label="Shortest word"
          testId="opt-min"
          value={s.minLength}
          disabled={!isHost}
          options={[
            { value: 3, label: "3+ letters", sub: "Friendly" },
            { value: 4, label: "4+ letters", sub: "Hardcore" },
          ]}
          onChange={(minLength) => set({ minLength })}
        />
        <Toggle
          icon="📏"
          title="Longest word bonus"
          sub={`+${LONGEST_WORD_BONUS} points for the longest word of the round`}
          on={s.longestBonus}
          disabled={!isHost}
          onChange={(longestBonus) => set({ longestBonus })}
          testId="opt-longest"
        />
        {state.room && (
        <Cards
          label="Match"
          testId="opt-series"
          value={s.series}
          disabled={!isHost}
          options={[
            { value: 0, label: "Single", sub: "Round by round" },
            { value: 3, label: "Best of 3", sub: "First to 2" },
            { value: 5, label: "Best of 5", sub: "First to 3" },
          ]}
          onChange={(series) => set({ series })}
        />
        )}
        <Toggle
          icon="☠️"
          title="Danger mode"
          sub={`Attacks (${BOMB_WORD_LENGTH}+ letters earns 💣 / 🙃), 🛡️ combo shields, and +${Math.round(DANGER_BOOST * 100)}% on words in the last ${DANGER_ZONE_MS / 1000}s`}
          on={s.danger}
          disabled={!isHost}
          onChange={(danger) => set({ danger })}
          testId="opt-danger"
        />
      </div>

      {state.roster.length > 1 && <ReactionBar controller={controller} />}

      <div className="sticky bottom-3 mt-auto">
        {isHost ? (
          <button className="bg-btn bg-btn-primary w-full text-xl" disabled={!dictReady} onClick={() => controller.startRound()} data-testid="start">
            {dictReady ? "Start round" : "Loading words…"}
          </button>
        ) : (
          <p className="bg-panel py-3 text-center text-lg">Waiting for {host?.name ?? "the host"} to start…</p>
        )}
      </div>
    </div>
  );
}
