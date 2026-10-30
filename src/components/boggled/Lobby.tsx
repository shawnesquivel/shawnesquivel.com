"use client";

import { useState, type ReactNode } from "react";
import { BOMB_WORD_LENGTH, DANGER_ZONE_MS, isNoChill, type RoomController, type RoomState, type Settings } from "@/lib/boggled/room";
import { DANGER_BOOST, LONGEST_WORD_BONUS } from "@/lib/boggled/scoring";
import { ReactionBar, Scoreboard } from "./Extras";
import { EmojiPicker, type Identity } from "./Home";

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

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
  testId,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled: boolean;
  testId: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1.5 text-sm font-semibold opacity-80">{label}</div>
      <div className="bg-seg" data-testid={testId}>
        {options.map((o) => (
          <button key={String(o.value)} aria-pressed={o.value === value} disabled={disabled} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChillToggle({ noChill, onChange, disabled }: { noChill: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
  const [explain, setExplain] = useState(false);
  return (
    <div>
      <button
        className={`bg-toggle-row ${noChill ? "hot" : ""}`}
        role="switch"
        aria-checked={noChill}
        onClick={() => {
          if (!disabled) onChange(!noChill);
          setExplain(true);
        }}
        data-testid="opt-chill"
      >
        <span className="text-3xl">{noChill ? "🔥" : "🧘"}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{noChill ? "No chill mode" : "Chill mode"}</span>
          <span className="block text-xs opacity-75">{noChill ? "Attacks, shields and bonus points" : "Just you, the letters and the clock"}</span>
        </span>
        <span className={`bg-toggle ${noChill ? "on" : ""}`} />
      </button>
      {explain && (
        <div className="bg-step mt-2 flex flex-col gap-2 text-sm" data-testid="chill-explainer">
          <div className={`bg-mode-card ${noChill ? "" : "current"}`}>
            <b>🧘 Chill mode.</b> Classic word hunt. Every word scores its length, nothing gets in your way.
          </div>
          <div className={`bg-mode-card ${noChill ? "current" : ""}`}>
            <b>🔥 No chill mode.</b> {BOMB_WORD_LENGTH}+ letter words earn 💣 bombs and 🙃 flips to mess up a rival&apos;s board. A
            quick combo earns a 🛡️ shield. Longest word gets +{LONGEST_WORD_BONUS}, and the last {DANGER_ZONE_MS / 1000}s are
            worth +{Math.round(DANGER_BOOST * 100)}%.
          </div>
          <button className="self-end text-xs underline opacity-70" onClick={() => setExplain(false)}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

const MATCH_HELP: Record<number, string> = {
  3: "Play up to 3 games. First to win 2 takes the match 🏅",
  5: "Play up to 5 games. First to win 3 takes the match 🏅",
  0: "No finish line. Keep playing rounds; wins and points add up on the scoreboard.",
};

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
  onIdentity,
}: {
  state: RoomState;
  controller: RoomController;
  dictReady: boolean;
  onLeave: () => void;
  onIdentity: (patch: Partial<Identity>) => void;
}) {
  const [copied, setCopied] = useState<"" | "code" | "link">("");
  const [editing, setEditing] = useState(false);
  const isHost = state.hostId === state.me.id;
  const s = state.settings;
  const set = (patch: Partial<Settings>) => controller.updateSettings(patch);
  const host = state.roster.find((m) => m.id === state.hostId);
  const alone = state.roster.length < 2;

  const flash = (what: "code" | "link") => {
    setCopied(what);
    setTimeout(() => setCopied(""), 1600);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.room ?? "");
      flash("code");
    } catch {
      window.getSelection()?.selectAllChildren(document.querySelector("[data-testid=room-code]")!);
    }
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}?room=${state.room}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Word Brawl", text: `Join my Word Brawl room: ${state.room}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("link");
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

      <div className="bg-panel relative p-4 text-center">
        <div className="text-sm opacity-75">Room code</div>
        <button
          className={`bg-copy ${copied === "code" ? "done" : ""}`}
          onClick={copyCode}
          aria-label="Copy room code"
          data-testid="copy-code"
        >
          {copied === "code" ? "✓ Copied" : "⧉ Copy"}
        </button>
        <div className="bg-title bg-selectable text-6xl tracking-[0.2em]" data-testid="room-code">
          {state.room}
        </div>
        <button className={`bg-btn mt-3 w-full ${alone ? "bg-btn-primary" : "bg-btn-ghost"}`} onClick={share} data-testid="share">
          {copied === "link" ? "✓ Link copied!" : "🔗 Share invite link"}
        </button>
        {controller.transportKind === "local" && (
          <p className="mt-2 text-xs opacity-80">
            Online multiplayer isn&apos;t configured on this site yet, so rooms only work between tabs of this browser.
          </p>
        )}
      </div>

      <div className="bg-panel p-4">
        <div className="mb-2 text-sm opacity-75">Players ({state.roster.length})</div>
        <ul className="flex flex-col gap-2" data-testid="roster">
          {state.roster.map((m) => {
            const t = state.tally[m.id];
            const mine = m.id === state.me.id;
            return (
              <li key={m.id} className="flex items-center gap-3">
                <span className="text-3xl">{m.emoji}</span>
                <span className="flex-1 truncate text-lg font-semibold">
                  {m.name}
                  {mine && <span className="opacity-60"> (you)</span>}
                </span>
                {t && t.wins > 0 && <span className="text-sm opacity-80">{t.wins} 🏆</span>}
                {m.id === state.hostId && <span title="Host">👑</span>}
                {mine && (
                  <button className="bg-chip px-2.5 py-1 text-sm" onClick={() => setEditing((v) => !v)} aria-label="Edit name" data-testid="edit-me">
                    ✏️
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {editing && (
          <form
            className="bg-step mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setEditing(false);
            }}
          >
            <input
              className="rounded-xl bg-white px-4 py-3 text-lg font-semibold text-[#2a1670] outline-none"
              maxLength={16}
              autoFocus
              value={state.me.name}
              onChange={(e) => onIdentity({ name: e.target.value })}
              onBlur={() => !state.me.name.trim() && onIdentity({ name: "Player" })}
              data-testid="name"
            />
            <EmojiPicker value={state.me.emoji} onChange={(emoji) => onIdentity({ emoji })} />
            <button className="bg-btn bg-btn-primary" data-testid="edit-done">
              Done
            </button>
          </form>
        )}
        {alone && (
          <p className="mt-3 text-center text-base font-semibold" data-testid="quiet">
            🦗 It&apos;s quiet in here. Share the link with your friends!
          </p>
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
            { value: 5, label: "5×5", sub: "Big board", icon: <MiniGrid size={5} /> },
          ]}
          onChange={(size) => set({ size })}
        />
        <div className="flex gap-3">
          <Segmented
            label="⏱ Timer"
            testId="opt-duration"
            value={s.duration}
            disabled={!isHost}
            options={[
              { value: 60, label: "1 min" },
              { value: 120, label: "2 min" },
            ]}
            onChange={(duration) => set({ duration })}
          />
          <Segmented
            label="🔤 Shortest word"
            testId="opt-min"
            value={s.minLength}
            disabled={!isHost}
            options={[
              { value: 3, label: "3 letters" },
              { value: 4, label: "4 letters" },
            ]}
            onChange={(minLength) => set({ minLength })}
          />
        </div>
        <ChillToggle noChill={isNoChill(s)} disabled={!isHost} onChange={(on) => set({ danger: on, longestBonus: on })} />
        <div>
          <Cards
            label="Match"
            testId="opt-series"
            value={s.series}
            disabled={!isHost}
            options={[
              { value: 3, label: "Best of 3" },
              { value: 5, label: "Best of 5" },
              { value: 0, label: "Continuous" },
            ]}
            onChange={(series) => set({ series })}
          />
          <p className="mt-1.5 text-xs opacity-80" data-testid="match-help">
            {MATCH_HELP[s.series]}
          </p>
        </div>
      </div>

      {!alone && <ReactionBar controller={controller} />}

      <div className="sticky bottom-3 mt-auto">
        {isHost ? (
          <button className="bg-btn bg-btn-primary w-full text-xl" disabled={!dictReady} onClick={() => controller.startRound()} data-testid="start">
            {dictReady ? (alone ? "Start anyway" : "Start round") : "Loading words…"}
          </button>
        ) : (
          <p className="bg-panel py-3 text-center text-lg">Waiting for {host?.name ?? "the host"} to start…</p>
        )}
      </div>
    </div>
  );
}
