"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DuneGame as Engine, HudState } from "@/lib/dune/game";

const INITIAL_HUD: HudState = {
  phase: "intro",
  vibration: 0,
  stepLabel: null,
  wormState: "idle",
  wormDistance: null,
  wormBearing: null,
  distanceToGoal: 0,
  thumpers: 2,
  onRock: true,
  onSpice: false,
  message: null,
  messageTone: "info",
  px: 0,
  pz: 250,
  yaw: 0,
  wormX: null,
  wormZ: null,
  thumperPos: [],
  flightUnlocked: false,
  altitude: 0,
  airspeed: 0,
  stats: { time: 0, steps: 0, sandwalkSteps: 0, wormsCalled: 0, thumpersUsed: 0 },
};

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function DuneGame({ sandbox = false }: { sandbox?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [hud, setHud] = useState<HudState>(sandbox ? { ...INITIAL_HUD, phase: "sandbox" } : INITIAL_HUD);
  const frameSkip = useRef(0);

  useEffect(() => {
    let disposed = false;
    let engine: Engine | null = null;
    void import("@/lib/dune/game").then(({ DuneGame: GameEngine }) => {
      if (disposed || !canvasRef.current) return;
      engine = new GameEngine(
        canvasRef.current,
        (h) => {
          // throttle React updates to ~20fps; the canvas runs at full speed
          frameSkip.current = (frameSkip.current + 1) % 3;
          if (frameSkip.current === 0) setHud({ ...h });
        },
        { sandbox }
      );
      engineRef.current = engine;
    });
    return () => {
      disposed = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [sandbox]);

  const vibPct = Math.round(hud.vibration * 100);
  const vibColor =
    hud.vibration < 0.35 ? "#7fb069" : hud.vibration < 0.55 ? "#e8a33d" : "#d64933";
  const wormNear = hud.wormDistance !== null && hud.wormDistance < 150;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black font-sans select-none">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* ---------- sandbox controls ---------- */}
      {sandbox && <SandboxPanel hud={hud} />}

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
              <span className="tracking-[0.18em] text-amber-200/70 uppercase">Sietch Tabr&nbsp;</span>
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

          {/* minimap */}
          <MiniMap hud={hud} />

          {/* wormsign warning + directional arrow */}
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
                <div className="flex items-center justify-center gap-2 text-sm font-semibold tabular-nums">
                  {hud.wormBearing !== null && (
                    <span
                      data-testid="worm-arrow"
                      className={`inline-block text-lg leading-none ${wormNear ? "text-red-300" : "text-orange-300"}`}
                      style={{ transform: `rotate(${(hud.wormBearing * 180) / Math.PI}deg)` }}
                    >
                      ➤
                    </span>
                  )}
                  <span>
                    {Math.round(hud.wormDistance)}m{" "}
                    {hud.wormState === "leave" ? "— departing" : hud.wormState === "search" ? "— circling" : "— approaching"}
                  </span>
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
          <div className="pointer-events-none absolute bottom-4 left-4 hidden rounded bg-black/35 px-3 py-2 text-[10px] leading-relaxed text-amber-100/50 backdrop-blur-sm sm:block">
            tap W/A/S/D — irregular single steps (sandwalk)
            <br />
            hold W — steady walk (loud) · Shift — run (very loud)
            <br />
            mouse / Q E — look · T — plant thumper
          </div>
        </>
      )}

      {/* ---------- flight HUD ---------- */}
      {hud.phase === "flight" && (
        <>
          <div className="pointer-events-none absolute top-4 left-4 space-y-1 text-[12px] text-sky-50/90">
            <div className="rounded bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <span className="tracking-[0.18em] text-sky-200/70 uppercase">Ornithopter</span>
            </div>
            <div className="rounded bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <span className="tracking-[0.18em] text-sky-200/70 uppercase">Alt&nbsp;</span>
              <span data-testid="flight-alt" className="font-semibold tabular-nums">
                {Math.round(hud.altitude)}m
              </span>
              <span className="tracking-[0.18em] text-sky-200/70 uppercase">&nbsp;&nbsp;Spd&nbsp;</span>
              <span className="font-semibold tabular-nums">{Math.round(hud.airspeed)}</span>
            </div>
          </div>
          <MiniMap hud={hud} />
          {hud.message && (
            <div className="pointer-events-none absolute bottom-20 left-1/2 w-[min(560px,86vw)] -translate-x-1/2 rounded bg-emerald-950/60 px-4 py-2 text-center text-[13px] text-emerald-100 backdrop-blur-sm">
              {hud.message}
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 hidden rounded bg-black/35 px-3 py-2 text-[10px] leading-relaxed text-sky-100/50 backdrop-blur-sm sm:block">
            W/S — throttle · A/D — bank · mouse — pitch
            <br />
            R / Space — climb · F / Shift — dive
          </div>
          <button
            data-testid="end-flight"
            onClick={() => engineRef.current?.endFlight()}
            className="absolute right-4 bottom-4 cursor-pointer rounded border border-sky-300/40 bg-sky-400/10 px-4 py-2 text-[11px] font-semibold tracking-[0.25em] text-sky-100 uppercase backdrop-blur-sm transition hover:bg-sky-400/25"
          >
            Land
          </button>
        </>
      )}

      {/* ---------- intro ---------- */}
      {hud.phase === "intro" && (
        <Link
          href="/"
          className="pointer-events-auto absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded border border-amber-300/50 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.25em] text-amber-100 uppercase backdrop-blur-sm transition hover:bg-amber-400/25"
        >
          ← Home
        </Link>
      )}
      {hud.phase === "intro" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-black/70 via-black/40 to-black/75 p-6">
          <div className="max-w-xl text-center text-amber-50">
            <div className="text-[11px] tracking-[0.5em] text-amber-300/70 uppercase">Arrakis · Dune · Desert Planet</div>
            <h1 className="mt-2 font-serif text-5xl font-bold tracking-wide text-amber-100 sm:text-6xl">
              THE CROSSING
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-amber-100/85">
              Your ornithopter is down. <b className="text-amber-200">Objective: reach Sietch Tabr</b> — the
              cliff stronghold across the open erg, marked on your minimap.
            </p>
            <div className="mx-auto mt-6 flex max-w-md flex-wrap items-end justify-center gap-x-7 gap-y-4 text-amber-100/80">
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <Key>W</Key>
                  <div className="flex gap-1">
                    <Key>A</Key>
                    <Key>S</Key>
                    <Key>D</Key>
                  </div>
                </div>
                <span className="text-[10px] tracking-[0.2em] text-amber-200/60 uppercase">move / sandwalk</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  <Key>←</Key>
                  <Key>→</Key>
                </div>
                <span className="text-[10px] tracking-[0.2em] text-amber-200/60 uppercase">look</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Key>T</Key>
                <span className="text-[10px] tracking-[0.2em] text-amber-200/60 uppercase">plant thumper</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Key>Shift</Key>
                <span className="text-[10px] tracking-[0.2em] text-amber-200/60 uppercase">run (loud)</span>
              </div>
            </div>
            <div className="mx-auto mt-5 max-w-md text-[13px] text-amber-200/75">
              Pale drum sand = death. <span className="text-amber-100">Walk without rhythm.</span>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                data-testid="start-button"
                onClick={() => engineRef.current?.start()}
                className="cursor-pointer rounded border border-amber-300/50 bg-amber-400/10 px-10 py-3 text-sm font-semibold tracking-[0.3em] text-amber-100 uppercase transition hover:bg-amber-400/25"
              >
                Begin the crossing
              </button>
              {hud.flightUnlocked && (
                <button
                  data-testid="intro-fly-button"
                  onClick={() => engineRef.current?.startFlight()}
                  className="cursor-pointer rounded border border-sky-300/50 bg-sky-400/10 px-6 py-3 text-sm font-semibold tracking-[0.3em] text-sky-100 uppercase transition hover:bg-sky-400/25"
                >
                  Fly the Ornithopter
                </button>
              )}
            </div>
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
            <h2 className="font-serif text-4xl font-bold text-emerald-200">SIETCH TABR</h2>
            <p className="mt-4 text-sm text-amber-100/85">
              You crossed the open erg and the worm did not take you. You walked
              as the Fremen walk — and the sietch opens its doors.
            </p>
            <p className="mt-2 text-sm font-semibold text-sky-200">
              The Fremen grant you a restored ornithopter. Flight over Arrakis is unlocked.
            </p>
            <blockquote className="mt-3 text-[13px] text-amber-200/70 italic">
              “God created Arrakis to train the faithful.”
            </blockquote>
            <StatsBlock hud={hud} />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                data-testid="fly-button"
                onClick={() => engineRef.current?.startFlight()}
                className="cursor-pointer rounded border border-sky-300/50 bg-sky-400/15 px-8 py-3 text-sm font-semibold tracking-[0.3em] text-sky-100 uppercase transition hover:bg-sky-400/30"
              >
                Take the Ornithopter
              </button>
              <button
                data-testid="restart-button"
                onClick={() => engineRef.current?.restart()}
                className="cursor-pointer rounded border border-emerald-300/50 bg-emerald-400/10 px-6 py-3 text-sm font-semibold tracking-[0.3em] text-emerald-100 uppercase transition hover:bg-emerald-400/25"
              >
                Cross again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ minimap

const MAP_W = 138;
const MAP_H = 168;
const WORLD_X = [-260, 260];
const WORLD_Z = [-340, 340];

function toMap(x: number, z: number): [number, number] {
  const mx = ((x - WORLD_X[0]) / (WORLD_X[1] - WORLD_X[0])) * MAP_W;
  const my = ((z - WORLD_Z[0]) / (WORLD_Z[1] - WORLD_Z[0])) * MAP_H;
  return [mx, my];
}

/** Static layer: sand, hazards, refuges, the sietch — drawn once. */
function drawMapBase(g: CanvasRenderingContext2D, world: typeof import("@/lib/dune/world")) {
  g.fillStyle = "#8a6238";
  g.fillRect(0, 0, MAP_W, MAP_H);
  // spice
  for (const p of world.SPICE_PATCHES) {
    const [x, y] = toMap(p.x, p.z);
    g.fillStyle = "rgba(170,80,30,0.75)";
    g.beginPath();
    g.arc(x, y, (p.r / 520) * MAP_W, 0, Math.PI * 2);
    g.fill();
  }
  // drum sand
  for (const p of world.DRUM_PATCHES) {
    const [x, y] = toMap(p.x, p.z);
    g.fillStyle = "rgba(238,226,190,0.92)";
    g.beginPath();
    g.arc(x, y, (p.r / 520) * MAP_W, 0, Math.PI * 2);
    g.fill();
  }
  // refuges + start
  g.fillStyle = "#3c322b";
  for (const rf of [world.START, ...world.REFUGES]) {
    const [x, y] = toMap(rf.x, rf.z);
    g.beginPath();
    g.arc(x, y, Math.max(2.5, (rf.r / 520) * MAP_W), 0, Math.PI * 2);
    g.fill();
  }
  // the sietch cliff band
  const [, cy] = toMap(0, world.GOAL_Z);
  g.fillStyle = "#332a24";
  g.fillRect(0, 0, MAP_W, cy);
  g.fillStyle = "#ffb45e";
  g.beginPath();
  g.arc(MAP_W / 2, cy - 5, 2.6, 0, Math.PI * 2);
  g.fill();
  g.font = "7px sans-serif";
  g.textAlign = "center";
  g.fillStyle = "#ffd9a0";
  g.fillText("SIETCH TABR", MAP_W / 2, cy - 10);
}

function MiniMap({ hud }: { hud: HudState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/dune/world").then((world) => {
      if (cancelled) return;
      const base = document.createElement("canvas");
      base.width = MAP_W;
      base.height = MAP_H;
      drawMapBase(base.getContext("2d")!, world);
      baseRef.current = base;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const c = ref.current;
    const base = baseRef.current;
    if (!c || !base) return;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, MAP_W, MAP_H);
    g.drawImage(base, 0, 0);
    // thumpers
    g.fillStyle = "#ffd84a";
    for (const th of hud.thumperPos) {
      const [x, y] = toMap(th.x, th.z);
      g.beginPath();
      g.arc(x, y, 2, 0, Math.PI * 2);
      g.fill();
    }
    // worm
    if (hud.wormX !== null && hud.wormZ !== null) {
      const [x, y] = toMap(hud.wormX, hud.wormZ);
      const r = 3 + Math.sin(Date.now() / 160) * 1.2;
      g.fillStyle = "#e23b25";
      g.beginPath();
      g.arc(Math.max(2, Math.min(MAP_W - 2, x)), Math.max(2, Math.min(MAP_H - 2, y)), r, 0, Math.PI * 2);
      g.fill();
    }
    // player arrow
    const [px, py] = toMap(hud.px, hud.pz);
    g.save();
    g.translate(px, py);
    g.rotate(-hud.yaw);
    g.fillStyle = "#e8f3ff";
    g.beginPath();
    g.moveTo(0, -5);
    g.lineTo(3.4, 4);
    g.lineTo(-3.4, 4);
    g.closePath();
    g.fill();
    g.restore();
  }, [hud]);

  return (
    <div className="pointer-events-none absolute top-4 right-4 rounded border border-amber-100/20 bg-black/45 p-1.5 backdrop-blur-sm">
      <canvas data-testid="minimap" ref={ref} width={MAP_W} height={MAP_H} className="block rounded-sm opacity-90" />
    </div>
  );
}

// ------------------------------------------------------------------ sandbox

declare global {
  interface Window {
    __DUNE__?: {
      sandbox?: {
        spawn: (angleDeg: number, dist?: number) => void;
        breach: () => void;
        reset: () => void;
      };
    };
  }
}

function SandboxPanel({ hud }: { hud: HudState }) {
  const call = (fn: (sb: NonNullable<NonNullable<Window["__DUNE__"]>["sandbox"]>) => void) => {
    const sb = window.__DUNE__?.sandbox;
    if (sb) fn(sb);
  };
  return (
    <div className="absolute top-4 left-4 w-60 space-y-2 rounded bg-black/60 p-3 text-[12px] text-amber-50 backdrop-blur-sm">
      <div className="text-[11px] tracking-[0.3em] text-amber-300/80 uppercase">Worm Sandbox</div>
      <div data-testid="sandbox-state" className="font-mono text-amber-200">
        state: {hud.wormState}
        {hud.wormX !== null &&
          hud.wormZ !== null &&
          ` · ${Math.round(Math.hypot(hud.wormX - 0, hud.wormZ - 60))}m`}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          ["North", 270],
          ["East", 0],
          ["South", 90],
          ["West", 180],
        ].map(([label, deg]) => (
          <button
            key={label}
            data-testid={`spawn-${String(label).toLowerCase()}`}
            onClick={() => call((sb) => sb.spawn(Number(deg)))}
            className="cursor-pointer rounded border border-amber-300/40 bg-amber-400/10 px-2 py-1.5 hover:bg-amber-400/25"
          >
            Approach {label}
          </button>
        ))}
        <button
          data-testid="sandbox-breach"
          onClick={() => call((sb) => sb.breach())}
          className="col-span-2 cursor-pointer rounded border border-red-300/40 bg-red-400/10 px-2 py-1.5 text-red-200 hover:bg-red-400/25"
        >
          Instant eruption
        </button>
        <button
          data-testid="sandbox-reset"
          onClick={() => call((sb) => sb.reset())}
          className="col-span-2 cursor-pointer rounded border border-amber-100/30 px-2 py-1.5 hover:bg-white/10"
        >
          Reset
        </button>
      </div>
      <div className="text-[10px] text-amber-100/50">Camera orbits the proving ground automatically.</div>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-7 items-center justify-center rounded border border-amber-200/40 bg-amber-100/5 px-2 py-1 font-mono text-xs font-semibold text-amber-100">
      {children}
    </span>
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
