"use client";

import { useEffect, useRef, useState } from "react";
import type { DuneGame as Engine, HudState } from "@/lib/dune/game";

const INITIAL_HUD: HudState = {
  phase: "intro",
  vibration: 0,
  stepLabel: null,
  wormState: "idle",
  wormDistance: null,
  distanceToGoal: 0,
  thumpers: 2,
  onRock: true,
  onSpice: false,
  message: null,
  messageTone: "info",
  stats: { time: 0, steps: 0, sandwalkSteps: 0, wormsCalled: 0, thumpersUsed: 0 },
};

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function DuneGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const frameSkip = useRef(0);

  useEffect(() => {
    let disposed = false;
    let engine: Engine | null = null;
    void import("@/lib/dune/game").then(({ DuneGame: GameEngine }) => {
      if (disposed || !canvasRef.current) return;
      engine = new GameEngine(canvasRef.current, (h) => {
        // throttle React updates to ~20fps; the canvas runs at full speed
        frameSkip.current = (frameSkip.current + 1) % 3;
        if (frameSkip.current === 0) setHud({ ...h });
      });
      engineRef.current = engine;
    });
    return () => {
      disposed = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  const vibPct = Math.round(hud.vibration * 100);
  const vibColor =
    hud.vibration < 0.35 ? "#7fb069" : hud.vibration < 0.55 ? "#e8a33d" : "#d64933";
  const wormNear = hud.wormDistance !== null && hud.wormDistance < 150;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black font-sans select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* ---------- in-game HUD ---------- */}
      {hud.phase === "playing" && (
        <>
          {/* vibration meter */}
          <div className="pointer-events-none absolute bottom-6 left-1/2 w-[min(420px,80vw)] -translate-x-1/2">
            <div className="mb-1 flex items-end justify-between text-[11px] tracking-[0.2em] text-amber-100/80 uppercase">
              <span>Vibration</span>
              {hud.stepLabel && (
                <span
                  data-testid="step-label"
                  className={
                    hud.stepLabel === "sandwalk"
                      ? "text-lime-300"
                      : hud.stepLabel === "uneven"
                        ? "text-amber-300"
                        : "animate-pulse text-red-400"
                  }
                >
                  {hud.stepLabel === "sandwalk"
                    ? "sandwalk — like the wind"
                    : hud.stepLabel === "uneven"
                      ? "uneven"
                      : "RHYTHMIC — it hears you"}
                </span>
              )}
            </div>
            <div className="h-2.5 overflow-hidden rounded-full border border-amber-100/20 bg-black/45 backdrop-blur-sm">
              <div
                data-testid="vibration-bar"
                className="h-full rounded-full transition-[width] duration-150"
                style={{ width: `${vibPct}%`, background: vibColor }}
              />
            </div>
          </div>

          {/* top-left status */}
          <div className="pointer-events-none absolute top-4 left-4 space-y-1 text-[12px] text-amber-50/90">
            <div className="rounded bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <span className="tracking-[0.18em] text-amber-200/70 uppercase">Sietch&nbsp;</span>
              <span data-testid="distance" className="font-semibold tabular-nums">
                {Math.round(hud.distanceToGoal)}m
              </span>
            </div>
            <div className="rounded bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <span className="tracking-[0.18em] text-amber-200/70 uppercase">Thumpers&nbsp;</span>
              <span className="font-semibold">{"▮".repeat(hud.thumpers) || "—"}</span>
            </div>
            {hud.onRock && (
              <div className="rounded bg-emerald-900/50 px-3 py-1.5 text-emerald-200 backdrop-blur-sm">
                On rock — safe from the worm
              </div>
            )}
          </div>

          {/* wormsign warning */}
          {hud.wormState !== "idle" && (
            <div
              data-testid="wormsign"
              className={`pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded px-4 py-2 text-center backdrop-blur-sm ${
                wormNear ? "animate-pulse bg-red-950/70 text-red-200" : "bg-orange-950/60 text-orange-200"
              }`}
            >
              <div className="text-[11px] tracking-[0.3em] uppercase">
                {hud.wormState === "breach" ? "Shai-Hulud" : "Wormsign"}
              </div>
              {hud.wormDistance !== null && hud.wormState !== "breach" && (
                <div className="text-sm font-semibold tabular-nums">
                  {Math.round(hud.wormDistance)}m {hud.wormState === "leave" ? "— departing" : hud.wormState === "search" ? "— circling" : "— approaching"}
                </div>
              )}
            </div>
          )}

          {/* contextual message */}
          {hud.message && (
            <div
              data-testid="message"
              className={`pointer-events-none absolute bottom-20 left-1/2 w-[min(560px,86vw)] -translate-x-1/2 rounded px-4 py-2 text-center text-[13px] leading-snug backdrop-blur-sm ${
                hud.messageTone === "danger"
                  ? "bg-red-950/65 text-red-100"
                  : hud.messageTone === "good"
                    ? "bg-emerald-950/60 text-emerald-100"
                    : "bg-black/50 text-amber-50"
              }`}
            >
              {hud.message}
            </div>
          )}

          {/* controls hint */}
          <div className="pointer-events-none absolute right-4 bottom-4 hidden rounded bg-black/35 px-3 py-2 text-right text-[10px] leading-relaxed text-amber-100/50 backdrop-blur-sm sm:block">
            tap W/A/S/D — irregular single steps (sandwalk)
            <br />
            hold W — steady walk (loud) · Shift — run (very loud)
            <br />
            mouse / Q E — look · T — plant thumper
          </div>
        </>
      )}

      {/* ---------- intro ---------- */}
      {hud.phase === "intro" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/70 via-black/40 to-black/75 p-6">
          <div className="max-w-xl text-center text-amber-50">
            <div className="text-[11px] tracking-[0.5em] text-amber-300/70 uppercase">Arrakis · Dune · Desert Planet</div>
            <h1 className="mt-2 font-serif text-5xl font-bold tracking-wide text-amber-100 sm:text-6xl">
              THE CROSSING
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-amber-100/85">
              Your ornithopter is down. The sietch cliffs lie across open erg —
              worm territory. The sand carries every footfall to Shai-Hulud.
            </p>
            <blockquote className="mx-auto mt-4 max-w-md border-l-2 border-amber-400/40 pl-3 text-left text-[13px] text-amber-200/75 italic">
              “We must walk without rhythm… they must sound like the natural
              shifting of sand… like the wind. Step… drag… drag… step… step…
              wait… drag… step…”
            </blockquote>
            <div className="mx-auto mt-5 grid max-w-md grid-cols-1 gap-1.5 text-left text-[12px] text-amber-100/70 sm:grid-cols-2">
              <div><b className="text-lime-300">Tap</b> W/A/S/D — single steps. Break your timing.</div>
              <div><b className="text-red-300">Hold</b> W or Shift — fast but rhythmic. It will hear.</div>
              <div><b className="text-amber-200">T</b> — plant a thumper to lure the worm away.</div>
              <div><b className="text-emerald-300">Rock</b> is safe. Pale taut sand is drum sand — never step on it.</div>
            </div>
            <button
              data-testid="start-button"
              onClick={() => engineRef.current?.start()}
              className="mt-7 cursor-pointer rounded border border-amber-300/50 bg-amber-400/10 px-10 py-3 text-sm font-semibold tracking-[0.3em] text-amber-100 uppercase transition hover:bg-amber-400/25"
            >
              Begin the crossing
            </button>
            <div className="mt-3 text-[11px] text-amber-100/40">click the sand to lock the mouse · headphones recommended</div>
            <div className="mt-2 hidden text-[11px] text-red-300/70 [@media(hover:none)]:block">
              This crossing requires a keyboard — visit on a desktop browser.
            </div>
          </div>
        </div>
      )}

      {/* ---------- death ---------- */}
      {hud.phase === "dead" && (
        <div data-testid="death-screen" className="absolute inset-0 flex items-center justify-center bg-red-950/60 p-6 backdrop-blur-[2px]">
          <div className="max-w-lg text-center text-amber-50">
            <h2 className="font-serif text-4xl font-bold text-red-200">TAKEN BY SHAI-HULUD</h2>
            <blockquote className="mx-auto mt-4 max-w-md text-[13px] text-amber-100/80 italic">
              “It appeared to be more than half a league long, and the rise of the
              sandwave at its cresting head was like the approach of a mountain.”
            </blockquote>
            <p className="mt-3 text-[13px] text-amber-200/70">
              Bless the Maker and His water. May His passage cleanse the world.
            </p>
            <StatsBlock hud={hud} />
            <button
              data-testid="restart-button"
              onClick={() => engineRef.current?.restart()}
              className="mt-6 cursor-pointer rounded border border-amber-300/50 bg-amber-400/10 px-8 py-3 text-sm font-semibold tracking-[0.3em] text-amber-100 uppercase transition hover:bg-amber-400/25"
            >
              Walk again
            </button>
          </div>
        </div>
      )}

      {/* ---------- victory ---------- */}
      {hud.phase === "won" && (
        <div data-testid="win-screen" className="absolute inset-0 flex items-center justify-center bg-emerald-950/50 p-6 backdrop-blur-[2px]">
          <div className="max-w-lg text-center text-amber-50">
            <h2 className="font-serif text-4xl font-bold text-emerald-200">YOU REACHED THE SIETCH</h2>
            <p className="mt-4 text-sm text-amber-100/85">
              You crossed the open erg and the worm did not take you. You walked
              as the Fremen walk — without rhythm, like the shifting of sand.
            </p>
            <blockquote className="mt-3 text-[13px] text-amber-200/70 italic">
              “God created Arrakis to train the faithful.”
            </blockquote>
            <StatsBlock hud={hud} />
            <button
              data-testid="restart-button"
              onClick={() => engineRef.current?.restart()}
              className="mt-6 cursor-pointer rounded border border-emerald-300/50 bg-emerald-400/10 px-8 py-3 text-sm font-semibold tracking-[0.3em] text-emerald-100 uppercase transition hover:bg-emerald-400/25"
            >
              Cross again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsBlock({ hud }: { hud: HudState }) {
  const s = hud.stats;
  const pct = s.steps > 0 ? Math.round((s.sandwalkSteps / s.steps) * 100) : 0;
  return (
    <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-x-6 gap-y-1.5 rounded bg-black/40 px-5 py-4 text-left text-[12px] text-amber-100/80">
      <span>Time</span>
      <span className="text-right font-semibold tabular-nums">{formatTime(s.time)}</span>
      <span>Steps taken</span>
      <span className="text-right font-semibold tabular-nums">{s.steps}</span>
      <span>Sandwalk steps</span>
      <span className="text-right font-semibold tabular-nums">{s.sandwalkSteps} ({pct}%)</span>
      <span>Worms drawn</span>
      <span className="text-right font-semibold tabular-nums">{s.wormsCalled}</span>
      <span>Thumpers used</span>
      <span className="text-right font-semibold tabular-nums">{s.thumpersUsed}</span>
    </div>
  );
}
