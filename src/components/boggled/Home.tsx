"use client";

import { useEffect, useState } from "react";
import { click, setScreen } from "@/lib/boggled/analytics";
import { dayKey, loadDaily, loadStreak, type SoloMode } from "@/lib/boggled/modes";
import { DAILY_REWARDS, dailyRewardFor, livesLeft, loadQuest, MAX_LEVEL, questLevel, REGIONS } from "@/lib/boggled/quest";
import { guidePath } from "@/lib/boggled/site";
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
    const played = loadDaily(day).first !== null;
    const streak = loadStreak(day);
    // Not played yet: today's reward continues the streak. Played: preview tomorrow's.
    return { played, streak, reward: dailyRewardFor(streak + 1) };
  });
  const [questLine] = useState(() => {
    const q = loadQuest();
    if (q.unlocked === 1) return "20 levels · 4 bosses";
    if (q.unlocked > MAX_LEVEL) return "👑 Complete · go for ⭐⭐⭐";
    const l = questLevel(q.unlocked);
    return `Level ${l.level} · ${REGIONS[l.region].name} · ❤️ ${livesLeft(q)}`;
  });
  const nameOk = identity.name.trim().length > 0;
  // Sub-steps get their own history entry so the phone's back gesture steps back through them.
  const go = (next: Step) => {
    sound.unlock();
    if (next !== "menu") history.pushState({ wb: "step" }, "", location.href);
    setStep(next);
  };
  const back = () => {
    if (history.state?.wb === "step") history.back();
    else setStep("menu");
  };
  useEffect(() => {
    const onPop = () => setStep((s) => (s === "join" && !invite ? "code" : "menu"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [invite]);
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
          <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={back} data-testid="back">
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
          <div className="bg-home-label">🎉 Play with friends</div>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-big-btn create" onClick={() => { click("create_room"); sound.unlock(); onEnter(newRoomCode()); }} data-testid="menu-create">
              <span className="bg-big-icon">➕</span>
              <span className="bg-title text-2xl leading-none">CREATE</span>
              <span className="text-sm opacity-85">a room</span>
            </button>
            <button className="bg-big-btn join" onClick={() => { click("join_room"); go("code"); }} data-testid="menu-join">
              <span className="bg-big-icon">🚪</span>
              <span className="bg-title text-2xl leading-none">JOIN</span>
              <span className="text-sm opacity-85">with a code</span>
            </button>
          </div>
          <div className="bg-home-label mt-2">🕹️ Play solo</div>
          <button className="bg-menu-btn" onClick={() => solo("quick")} data-testid="solo">
            <span className="bg-menu-icon">🗺️</span>
            <span className="min-w-0 flex-1">
              <span className="bg-title block text-xl tracking-wide">STORY MODE</span>
              <span className="block truncate text-sm opacity-80" data-testid="quest-progress">
                {questLine}
              </span>
            </span>
            <span className="text-xl opacity-70">›</span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button className={`bg-menu-btn bg-half-btn bg-daily-btn ${daily.played ? "" : "ready"}`} onClick={() => solo("daily")} data-testid="menu-daily">
              <span className="text-3xl">{daily.played ? "📅" : <span className="bg-gift">🎁</span>}</span>
              <span className="bg-title block text-lg leading-tight">DAILY</span>
              <span className="block text-xs opacity-80">
                {daily.played ? `Done ✓${daily.streak > 1 ? ` · 🔥${daily.streak}` : ""}` : `+${daily.reward.coins} 🪙${daily.streak > 0 ? ` · 🔥${daily.streak}` : ""}`}
              </span>
              <span className="bg-daily-dots" aria-hidden>
                {DAILY_REWARDS.map((_, i) => {
                  const done = i < daily.reward.day - 1;
                  return <span key={i} className={done ? "done" : i === daily.reward.day - 1 && !daily.played ? "today" : ""} />;
                })}
              </span>
            </button>
            <button className="bg-menu-btn bg-half-btn" onClick={() => solo("survival")} data-testid="menu-survival">
              <span className="text-3xl">⏳</span>
              <span className="bg-title block text-lg leading-tight">SURVIVAL</span>
              <span className="block text-xs opacity-80">Words add time</span>
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
        <div className="mt-auto flex justify-center gap-4 text-sm opacity-80">
          <button className="underline" onClick={() => { click("howto"); setHelp(true); }}>
            How to play
          </button>
          <a className="underline" href={guidePath("#tv")} data-testid="guide-link">
            📺 Play on a TV
          </a>
        </div>
      )}

      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </div>
  );
}
