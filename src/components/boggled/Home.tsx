"use client";

import { useState } from "react";
import { sound } from "@/lib/boggled/sound";

export const EMOJIS = [
  "🦊", "🐼", "🐸", "🐙", "🦄", "🐯", "🐵", "🐧", "🦉", "🐢", "🐝", "🐨",
  "🐶", "🐱", "🦖", "🍄", "🌮", "🍕", "👻", "🤖", "👽", "🦋", "🌵", "💅",
];

export type Identity = { id: string; name: string; emoji: string };

type Step = "menu" | "create" | "code" | "join";

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

// First user-perceived character, only if it's an emoji (keeps ZWJ families, skin tones and flags intact).
export function firstEmoji(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const first = segmenter ? segmenter.segment(trimmed)[Symbol.iterator]().next().value?.segment ?? "" : Array.from(trimmed)[0];
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(first) ? first : null;
}

export function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
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
          onChange={(e) => {
            const v = e.target.value;
            setCustom(v);
            const emoji = firstEmoji(v);
            setError(!!v.trim() && !emoji);
            if (emoji) onChange(emoji);
          }}
          data-testid="emoji-input"
        />
        <span className="text-3xl" aria-label="Selected avatar">
          {value}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-[var(--bad)]">That isn&apos;t an emoji. Try the emoji keyboard 🙂</p>}
    </div>
  );
}

export default function Home({
  identity,
  onIdentity,
  invite,
  onEnter,
  dictError,
  newRoomCode,
}: {
  identity: Identity;
  onIdentity: (patch: Partial<Identity>) => void;
  invite: string;
  onEnter: (room: string | null) => void;
  dictError: boolean;
  newRoomCode: () => string;
}) {
  const [step, setStep] = useState<Step>(invite ? "join" : "menu");
  const [code, setCode] = useState(invite);
  const [muted, setMuted] = useState(sound.muted);
  const nameOk = identity.name.trim().length > 0;
  const go = (next: Step) => {
    sound.unlock();
    setStep(next);
  };

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
        <button
          className="bg-btn bg-btn-ghost px-3 py-2 text-base"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            sound.setMuted(!muted);
            setMuted(!muted);
            sound.unlock();
            if (muted) sound.join();
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="text-center">
        <div className="mb-2 flex justify-center gap-1.5">
          {"BOGGLED".split("").map((l, i) => (
            <span
              key={i}
              className="bg-tile bg-title flex h-11 w-11 text-2xl"
              style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (3 + (i % 3))}deg)` }}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="bg-title text-xl opacity-90">online</div>
      </div>

      {step === "menu" && (
        <div className="bg-step flex flex-col gap-3" data-testid="menu">
          <button className="bg-menu-btn" onClick={() => { sound.unlock(); onEnter(null); }} data-testid="solo">
            <span className="bg-menu-icon">🧘</span>
            <span>
              <span className="block text-xl font-bold">Practice solo</span>
              <span className="block text-sm opacity-75">Warm up on your own, no room needed</span>
            </span>
          </button>
          <button className="bg-menu-btn primary" onClick={() => go("create")} data-testid="menu-create">
            <span className="bg-menu-icon">🎉</span>
            <span>
              <span className="block text-xl font-bold">Create a room</span>
              <span className="block text-sm opacity-80">Get a code to share with friends</span>
            </span>
          </button>
          <button className="bg-menu-btn" onClick={() => go("code")} data-testid="menu-join">
            <span className="bg-menu-icon">🚪</span>
            <span>
              <span className="block text-xl font-bold">Join a room</span>
              <span className="block text-sm opacity-75">Got a 4-letter code? Hop in</span>
            </span>
          </button>
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

      {(step === "create" || step === "join") && (
        <form
          className="bg-step bg-panel flex flex-col gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nameOk) return;
            onEnter(step === "create" ? newRoomCode() : code);
          }}
        >
          <div className="bg-title text-center text-2xl">
            {step === "create" ? "Who's hosting?" : <>Joining room <span className="text-[var(--gold)] tracking-widest">{code}</span></>}
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
          <button className="bg-btn bg-btn-primary text-xl" disabled={!nameOk} data-testid={step === "create" ? "create" : "join"}>
            {step === "create" ? "Create room 🎉" : "Join room 🚪"}
          </button>
          {!nameOk && <p className="-mt-2 text-center text-sm opacity-75">Enter your name to continue</p>}
        </form>
      )}

      {dictError && <p className="text-center text-sm text-[var(--bad)]">Couldn&apos;t load the word list. Check your connection and reload.</p>}

      {step === "menu" && (
        <details className="bg-panel mt-auto p-4 text-sm">
          <summary className="font-semibold">How to play</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 opacity-90">
            <li>Swipe across touching letters (diagonals count) to make words. Or tap letters one by one and tap the last one again.</li>
            <li>Each tile once per word. 3+ letters.</li>
            <li>3 letters = 1 pt, 4 = 2, 5 = 3, +1 per extra letter.</li>
            <li>Words nobody else found score double. Longest word gets +3.</li>
            <li>Find a 6+ letter word to earn a 💣 bomb: it blocks a random letter on a rival&apos;s board for 5 seconds.</li>
          </ul>
        </details>
      )}
    </div>
  );
}
