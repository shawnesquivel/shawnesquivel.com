"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { serverNow, syncClock } from "@/lib/boggled/clock";
import { loadDictionary, type Dictionary } from "@/lib/boggled/dictionary";
import { RoomController } from "@/lib/boggled/room";
import { randomId } from "@/lib/boggled/rng";
import { sound } from "@/lib/boggled/sound";
import Game from "./Game";
import Lobby from "./Lobby";
import Results from "./Results";

const EMOJIS = ["🦊", "🐼", "🐸", "🐙", "🦄", "🐯", "🐵", "🐧", "🦉", "🐢", "🐝", "🐨", "🐶", "🐱", "🦖", "🍄"];
const CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXZ";

function newRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
}

type Identity = { id: string; name: string; emoji: string };

function loadIdentity(): Identity {
  let id = sessionStorage.getItem("boggled:id");
  if (!id) {
    id = randomId(10);
    sessionStorage.setItem("boggled:id", id);
  }
  return {
    id,
    name: localStorage.getItem("boggled:name") ?? "",
    emoji: localStorage.getItem("boggled:emoji") ?? EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  };
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState === "visible") {
        navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
      }
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

function RoomView({
  controller,
  dict,
  onLeave,
}: {
  controller: RoomController;
  dict: Dictionary | null;
  onLeave: () => void;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const rosterSize = state.roster.length;
  const [prevRoster, setPrevRoster] = useState(rosterSize);
  if (rosterSize !== prevRoster) {
    setPrevRoster(rosterSize);
    if (rosterSize > prevRoster) sound.join();
  }
  useWakeLock(true);

  if (state.phase === "lobby" || !state.round) {
    return <Lobby state={state} controller={controller} dictReady={!!dict} onLeave={onLeave} />;
  }
  if (state.phase === "results") return <Results key={state.round.id} state={state} controller={controller} />;
  return <Game state={state} controller={controller} dict={dict} />;
}

export default function BoggledApp() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [dictError, setDictError] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [invite, setInvite] = useState("");
  const [controller, setController] = useState<RoomController | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Client-only state (storage, URL) has to load after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setIdentity(loadIdentity());
    setMuted(sound.muted);
    const fromUrl = normalizeCode(new URLSearchParams(location.search).get("room") ?? "");
    setInvite(fromUrl.length === 4 ? fromUrl : "");
    setJoinCode(fromUrl);
    /* eslint-enable react-hooks/set-state-in-effect */
    void syncClock();
    loadDictionary().then(setDict, () => setDictError(true));
  }, []);

  useEffect(() => {
    if (dict && controller) controller.setDictionary(dict);
  }, [dict, controller]);

  useEffect(() => () => controller?.stop(), [controller]);

  const updateIdentity = (patch: Partial<Identity>) => {
    setIdentity((prev) => {
      const next = { ...prev!, ...patch };
      localStorage.setItem("boggled:name", next.name);
      localStorage.setItem("boggled:emoji", next.emoji);
      return next;
    });
  };

  const enter = (room: string | null) => {
    if (!identity) return;
    sound.unlock();
    const name = identity.name.trim() || "Player";
    const joinedKey = `boggled:joined:${room ?? "solo"}`;
    const joinedAt = Number(sessionStorage.getItem(joinedKey)) || serverNow();
    sessionStorage.setItem(joinedKey, String(joinedAt));
    const c = new RoomController(room, { id: identity.id, name, emoji: identity.emoji, joinedAt });
    if (dict) c.setDictionary(dict);
    c.start();
    if (process.env.NODE_ENV !== "production") (window as unknown as { __boggled: RoomController }).__boggled = c;
    setController(c);
    history.replaceState(null, "", room ? `/boggled?room=${room}` : "/boggled");
  };

  const leave = () => {
    controller?.stop();
    setController(null);
    setJoinCode("");
    setInvite("");
    history.replaceState(null, "", "/boggled");
  };

  if (!identity) return <div className="bg-screen" />;

  if (controller) return <RoomView controller={controller} dict={dict} onLeave={leave} />;

  const code = normalizeCode(joinCode);
  const nameOk = identity.name.trim().length > 0;

  return (
    <div className="bg-screen gap-5" data-testid="home">
      <div className="flex justify-end">
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

      <div className="bg-panel flex flex-col gap-4 p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm opacity-75">Your name</span>
          <input
            className="rounded-xl bg-white px-4 py-3 text-lg font-semibold text-[#2a1670] outline-none"
            maxLength={16}
            placeholder="e.g. Mama"
            value={identity.name}
            onChange={(e) => updateIdentity({ name: e.target.value })}
            data-testid="name"
          />
        </label>
        <div>
          <div className="mb-1.5 text-sm opacity-75">Pick a buddy</div>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className="rounded-xl py-1 text-2xl"
                style={{ background: e === identity.emoji ? "rgb(255 255 255 / 0.9)" : "rgb(255 255 255 / 0.1)" }}
                onClick={() => updateIdentity({ emoji: e })}
                aria-label={`Avatar ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {invite ? (
          <button className="bg-btn bg-btn-primary text-xl" disabled={!nameOk} onClick={() => enter(invite)} data-testid="join-invite">
            Join room {invite}
          </button>
        ) : (
          <button className="bg-btn bg-btn-primary text-xl" disabled={!nameOk} onClick={() => enter(newRoomCode())} data-testid="create">
            Create a room
          </button>
        )}
        <div className="flex gap-2">
          <input
            className="w-0 flex-1 rounded-2xl bg-white/15 px-4 py-3 text-center text-xl font-bold tracking-[0.3em] uppercase outline-none placeholder:tracking-normal placeholder:text-white/50"
            placeholder="Room code"
            value={joinCode}
            maxLength={4}
            autoCapitalize="characters"
            autoCorrect="off"
            onChange={(e) => setJoinCode(normalizeCode(e.target.value))}
            data-testid="code"
          />
          <button className="bg-btn" disabled={!nameOk || code.length !== 4} onClick={() => enter(code)} data-testid="join">
            Join
          </button>
        </div>
        <button className="bg-btn bg-btn-ghost" disabled={!nameOk} onClick={() => enter(null)} data-testid="solo">
          Practice solo
        </button>
        {!nameOk && <p className="text-center text-sm opacity-75">Enter your name to play</p>}
        {dictError && <p className="text-center text-sm text-[var(--bad)]">Couldn&apos;t load the word list. Check your connection and reload.</p>}
      </div>

      <details className="bg-panel mt-auto p-4 text-sm">
        <summary className="font-semibold">How to play</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 opacity-90">
          <li>Swipe across touching letters (diagonals count) to make words. Or tap letters one by one and tap the last one again.</li>
          <li>Each tile once per word. 3+ letters.</li>
          <li>3 letters = 1 pt, 4 = 2, 5 = 3, +1 per extra letter.</li>
          <li>Words nobody else found score double. Longest word gets +3.</li>
        </ul>
      </details>
    </div>
  );
}
