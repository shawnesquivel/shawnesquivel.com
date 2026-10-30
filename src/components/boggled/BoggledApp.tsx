"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { initAnalytics, setScreen, type Screen } from "@/lib/boggled/analytics";
import { serverNow, syncClock } from "@/lib/boggled/clock";
import { loadDictionary, type Dictionary } from "@/lib/boggled/dictionary";
import type { SoloMode } from "@/lib/boggled/modes";
import { RoomController } from "@/lib/boggled/room";
import { randomId } from "@/lib/boggled/rng";
import { sound } from "@/lib/boggled/sound";
import { FloatingReactions, useRoomEffects } from "./Extras";
import Game from "./Game";
import Home, { EMOJIS, normalizeCode, type Identity } from "./Home";
import Lobby from "./Lobby";
import SoloIntro from "./QuickIntro";
import Results from "./Results";

const CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXZ";

const FUN_NAMES = ["Wordsmith", "Letter Ninja", "Vowel Bandit", "Spelling Bee", "Word Nerd", "Lexi Con", "Captain Swipe", "Scrabbler"];

function newRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}


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
  onIdentity,
}: {
  controller: RoomController;
  dict: Dictionary | null;
  onLeave: () => void;
  onIdentity: (patch: Partial<Identity>) => void;
}) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const rosterSize = state.roster.length;
  const [prevRoster, setPrevRoster] = useState(rosterSize);
  if (rosterSize !== prevRoster) {
    setPrevRoster(rosterSize);
    if (rosterSize > prevRoster) sound.join();
  }
  useWakeLock(true);
  useRoomEffects(state);
  const tracked: Screen =
    state.phase === "lobby" || !state.round
      ? state.room
        ? "lobby"
        : (`intro_${state.mode}` as Screen)
      : state.phase === "results"
        ? "results"
        : "game";
  useEffect(() => setScreen(tracked), [tracked]);

  let screen;
  if (state.phase === "lobby" || !state.round) {
    screen = state.room ? (
      <Lobby state={state} controller={controller} dictReady={!!dict} onLeave={onLeave} onIdentity={onIdentity} />
    ) : (
      <SoloIntro state={state} controller={controller} dictReady={!!dict} onLeave={onLeave} />
    );
  } else if (state.phase === "results") {
    screen = <Results key={state.round.id} state={state} controller={controller} onLeave={onLeave} />;
  } else {
    screen = <Game state={state} controller={controller} dict={dict} onLeave={onLeave} />;
  }
  return (
    <>
      {screen}
      <FloatingReactions state={state} />
    </>
  );
}

export default function BoggledApp() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [dictError, setDictError] = useState(false);
  const [invite, setInvite] = useState("");
  const [controller, setController] = useState<RoomController | null>(null);
  const [autoplay, setAutoplay] = useState<SoloMode | null>(null);

  useEffect(() => {
    // Client-only state (storage, URL) has to load after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setIdentity(loadIdentity());
    const fromUrl = normalizeCode(new URLSearchParams(location.search).get("room") ?? "");
    setInvite(fromUrl.length === 4 ? fromUrl : "");
    const play = new URLSearchParams(location.search).get("play");
    if (!fromUrl && (play === "daily" || play === "survival" || play === "quick")) setAutoplay(play);
    /* eslint-enable react-hooks/set-state-in-effect */
    initAnalytics();
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

  const enter = (room: string | null, mode: SoloMode = "quick") => {
    if (!identity) return;
    sound.unlock();
    let name = identity.name.trim();
    if (!name) {
      name = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
      updateIdentity({ name });
    }
    const joinedKey = `boggled:joined:${room ?? "solo"}`;
    const joinedAt = Number(sessionStorage.getItem(joinedKey)) || serverNow();
    sessionStorage.setItem(joinedKey, String(joinedAt));
    const c = new RoomController(room, { id: identity.id, name, emoji: identity.emoji, joinedAt }, mode);
    if (dict) c.setDictionary(dict);
    c.start();
    if (process.env.NODE_ENV !== "production") (window as unknown as { __boggled: RoomController }).__boggled = c;
    setController(c);
    history.replaceState(null, "", room ? `${location.pathname}?room=${room}` : location.pathname);
  };

  const leave = () => {
    controller?.stop();
    setController(null);
    setInvite("");
    setAutoplay(null);
    history.replaceState(null, "", location.pathname);
  };

  if (!identity) return <div className="bg-screen" />;

  const rename = (patch: Partial<Identity>) => {
    updateIdentity(patch);
    controller?.updateMe(patch);
  };

  if (controller) return <RoomView controller={controller} dict={dict} onLeave={leave} onIdentity={rename} />;

  return (
    <Home
      key={invite}
      identity={identity}
      onIdentity={updateIdentity}
      invite={invite}
      autoplay={autoplay}
      onEnter={enter}
      dictError={dictError}
      newRoomCode={newRoomCode}
    />
  );
}
