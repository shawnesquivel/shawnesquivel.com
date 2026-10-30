"use client";

import { useEffect, useState } from "react";
import { click, setScreen } from "@/lib/boggled/analytics";
import { dayKey, loadDaily, loadStreak, type SoloMode } from "@/lib/boggled/modes";
import { sound } from "@/lib/boggled/sound";
import HowToPlay from "./HowToPlay";

export const EMOJIS = [
  "🦊", "🐼", "🐸", "🐙", "🦄", "🐯", "🐵", "🐧", "🦉", "🐢", "🐝", "🐨",
  "🐶", "🐱", "🦖", "🍄", "🌮", "🍕", "👻", "🤖", "👽", "🦋", "🌵", "💅",
];

export type Identity = { id: string; name: string; emoji: string };

type Step = "menu" | "code" | "join";

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

// Most recently typed emoji anywhere in the text, ignoring letters and spaces
// (keeps ZWJ families, skin tones and flags intact).
export function lastEmoji(text: string): string | null {
  const chars = segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
  return chars.findLast((c) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(c)) ?? null;
}

export function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState(false);
  const options = EMOJIS.includes(value) ? EMOJIS : [value, ...EMOJIS.slice(0, -1)];
  return (
    <div>
      <div className="mb-1.5 text-sm opacity-75">Pick your buddy</div>
      <div className="grid grid-cols-8 gap-1.5" data-testid="emoji-grid">
        {options.map((e) => (
          <button
            key={e}
            className="rounded-xl py-1 text-2xl transition-transform active:scale-90"
            style={{ background: e === value ? "rgb(255 255 255 / 0.9)" : "rgb(255 255 255 / 0.1)" }}
            onClick={() => onChange(e)}
            aria-label={`Avatar ${e}`}
            aria-pressed={e === value}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          className="w-0 flex-1 rounded-xl bg-white/15 px-3 py-2 text-base outline-none placeholder:text-white/55"
          placeholder="…or type any emoji 😎"
          value={custom}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value;
            const emoji = lastEmoji(v);
            setError(!emoji && !!v.trim());
            setCustom(emoji ?? v);
            if (emoji) onChange(emoji);
          }}
          data-testid="emoji-input"
        />
        <span className="text-3xl" aria-label="Selected avatar">
          {value}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-[var(--bad)]">Letters can&apos;t be a buddy. Switch to the emoji keyboard 🙂</p>}
    </div>
  );
}

export default function Home({
  identity,
  onIdentity,
  invite,
  autoplay,
  onEnter,
  dictError,
  newRoomCode,
}: {
  identity: Identity;
  onIdentity: (patch: Partial<Identity>) => void;
  invite: string;
  autoplay?: SoloMode | null;
  onEnter: (room: string | null, mode?: SoloMode) => void;
  dictError: boolean;
  newRoomCode: () => string;
}) {
  const [step, setStep] = useState<Step>(invite ? "join" : "menu");
  const [code, setCode] = useState(invite);
  const [muted, setMuted] = useState(sound.muted);
  const [help, setHelp] = useState(false);
  const [daily] = useState(() => {
    const day = dayKey();
    return { played: loadDaily(day).first !== null, streak: loadStreak(day) };
  });
  const nameOk = identity.name.trim().length > 0;
  const go = (next: Step) => {
    sound.unlock();
    setStep(next);
  };
  const solo = (mode: SoloMode) => {
    click(mode === "quick" ? "quick_start" : mode);
    sound.unlock();
    onEnter(null, mode);
  };

  useEffect(() => {
    if (autoplay) onEnter(null, autoplay);
  }, [autoplay, onEnter]);

  useEffect(() => {
    setScreen(step === "menu" ? "home" : step === "code" ? "join_code" : "join_name");
  }, [step]);

  return (
    <div className="bg-screen gap-5" data-testid="home">
      <div className="flex items-center justify-between">
        {step !== "menu" ? (
          <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={() => go(step === "join" && !invite ? "code" : "menu")} data-testid="back">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
        <button className="bg-btn bg-btn-ghost w-11 px-0 py-2 text-base font-bold" aria-label="How to play" onClick={() => { click("howto"); setHelp(true); }} data-testid="help">
          ?
        </button>
        <button
          className="bg-btn bg-btn-ghost px-3 py-2 text-base"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            click(muted ? "unmute" : "mute");
            sound.setMuted(!muted);
            setMuted(!muted);
            sound.unlock();
            if (muted) sound.join();
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5" aria-label="Word Brawl" data-testid="logo">
        {["WORD", "BRAWL"].map((row, r) => (
          <div key={row} className="flex justify-center gap-1.5" aria-hidden>
            {row.split("").map((l, i) => (
              <span
                key={i}
                className={`bg-tile bg-title flex h-12 w-12 text-2xl ${r === 1 ? "bg-logo-hot" : ""}`}
                style={{ transform: `rotate(${((i + r) % 2 ? 1 : -1) * (3 + ((i + r) % 3))}deg)` }}
              >
                {l}
              </span>
            ))}
          </div>
        ))}
        <div className="mt-1 text-sm opacity-80">Swipe words. Beat your friends.</div>
      </div>

      {step === "menu" && (
        <div className="bg-step flex flex-col gap-3" data-testid="menu">
          <button className="bg-menu-btn primary" onClick={() => solo("quick")} data-testid="solo">
            <span className="bg-menu-icon">⚡</span>
            <span>
              <span className="block text-xl font-bold">Quick Start</span>
              <span className="block text-sm opacity-80">1v1 against Dr. Hoot 🦉 right now</span>
            </span>
          </button>
          <button className="bg-menu-btn" onClick={() => { click("create_room"); sound.unlock(); onEnter(newRoomCode()); }} data-testid="menu-create">
            <span className="bg-menu-icon">🎉</span>
            <span>
              <span className="block text-xl font-bold">Create a room</span>
              <span className="block text-sm opacity-75">Play friends with a link</span>
            </span>
          </button>
          <button className="bg-menu-btn" onClick={() => { click("join_room"); go("code"); }} data-testid="menu-join">
            <span className="bg-menu-icon">🚪</span>
            <span>
              <span className="block text-xl font-bold">Join a room</span>
              <span className="block text-sm opacity-75">Got a 4-letter code? Hop in</span>
            </span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-menu-btn bg-menu-mini" onClick={() => solo("daily")} data-testid="menu-daily">
              <span className="text-2xl">📅</span>
              <span>
                <span className="block font-bold">Daily Puzzle</span>
                <span className="block text-xs opacity-75">
                  {daily.played ? `Done today${daily.streak > 1 ? ` · 🔥${daily.streak}` : " ✓"}` : daily.streak > 0 ? `🔥 ${daily.streak}-day streak` : "Same board for everyone"}
                </span>
              </span>
            </button>
            <button className="bg-menu-btn bg-menu-mini" onClick={() => solo("survival")} data-testid="menu-survival">
              <span className="text-2xl">⏳</span>
              <span>
                <span className="block font-bold">Survival</span>
                <span className="block text-xs opacity-75">Words add time</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {step === "code" && (
        <form
          className="bg-step bg-panel flex flex-col gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 4) go("join");
          }}
        >
          <div className="bg-title text-center text-2xl">Enter the room code</div>
          <input
            className="rounded-2xl bg-white px-4 py-4 text-center text-4xl font-bold tracking-[0.4em] text-[#2a1670] uppercase outline-none placeholder:tracking-[0.2em] placeholder:text-[#2a1670]/30"
            placeholder="ABCD"
            value={code}
            maxLength={4}
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            data-testid="code"
          />
          <button className="bg-btn bg-btn-primary text-xl" disabled={code.length !== 4} data-testid="code-next">
            Next →
          </button>
        </form>
      )}

      {step === "join" && (
        <form
          className="bg-step bg-panel flex flex-col gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nameOk) return;
            onEnter(code);
          }}
        >
          <div className="bg-title text-center text-2xl">
            Joining room <span className="text-[var(--gold)] tracking-widest">{code}</span>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm opacity-75">Your name</span>
            <input
              className="rounded-xl bg-white px-4 py-3 text-lg font-semibold text-[#2a1670] outline-none"
              maxLength={16}
              placeholder="e.g. Mama"
              autoFocus={!identity.name}
              value={identity.name}
              onChange={(e) => onIdentity({ name: e.target.value })}
              data-testid="name"
            />
          </label>
          <EmojiPicker value={identity.emoji} onChange={(emoji) => onIdentity({ emoji })} />
          <button className="bg-btn bg-btn-primary text-xl" disabled={!nameOk} data-testid="join">
            Join room 🚪
          </button>
          {!nameOk && <p className="-mt-2 text-center text-sm opacity-75">Enter your name to continue</p>}
        </form>
      )}

      {dictError && <p className="text-center text-sm text-[var(--bad)]">Couldn&apos;t load the word list. Check your connection and reload.</p>}

      {step === "menu" && (
        <button className="bg-btn bg-btn-ghost mt-auto" onClick={() => { click("howto"); setHelp(true); }}>
          ❓ How to play
        </button>
      )}

      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </div>
  );
}
