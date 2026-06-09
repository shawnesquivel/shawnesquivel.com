// "We must walk without rhythm... they must sound like the natural shifting
// of sand... like the wind." — Dune, ch. 21
//
// Tracks the timing of the player's footfalls. Regular intervals = rhythm =
// loud to a worm. Broken, irregular intervals (step... drag... wait... step)
// read as natural sand-shift and are nearly silent.

import { clamp, lerp } from "./noise";

const WINDOW = 6; // steps considered
const MAX_GAP = 2.4; // a pause longer than this breaks any rhythm

export type StepKind = "step" | "walk" | "run";

export interface StepJudgement {
  /** 0 = perfect sandwalk, 1 = mechanical rhythm */
  rhythm: number;
  /** vibration loudness this footfall transmits through the sand */
  loudness: number;
  label: "sandwalk" | "uneven" | "rhythmic";
}

const BASE_LOUDNESS: Record<StepKind, number> = {
  step: 0.035, // a single deliberate footfall
  walk: 0.055, // continuous walking pace
  run: 0.115, // pounding run
};

export class RhythmTracker {
  private times: number[] = [];

  reset(): void {
    this.times = [];
  }

  /** Register a footfall at time t (seconds). Returns how a worm hears it. */
  onStep(t: number, kind: StepKind): StepJudgement {
    const last = this.times[this.times.length - 1];
    if (last !== undefined && t - last > MAX_GAP) {
      // long pause: rhythm broken, start fresh
      this.times = [];
    }
    this.times.push(t);
    if (this.times.length > WINDOW) this.times.shift();

    const rhythm = this.measure(kind);
    // a true sandwalk reads as natural sand-shift: nearly silent
    const loud = BASE_LOUDNESS[kind] * lerp(0.2, 3.4, rhythm);
    const label = rhythm < 0.34 ? "sandwalk" : rhythm < 0.62 ? "uneven" : "rhythmic";
    return { rhythm, loudness: loud, label };
  }

  /** Current rhythm estimate 0..1 (1 = metronome). */
  private measure(kind: StepKind): number {
    // Running is always pounding and loud regardless of timing.
    if (kind === "run") return 1;
    // A continuous walking gait is inherently rhythmic — only deliberate
    // single steps with broken timing can pass as natural sand-shift.
    if (kind === "walk") return Math.max(0.8, this.measureTimings());
    return this.measureTimings();
  }

  private measureTimings(): number {
    const n = this.times.length;
    if (n < 3) return 0.18; // too few footfalls to form a pattern
    const intervals: number[] = [];
    for (let i = 1; i < n; i++) intervals.push(this.times[i] - this.times[i - 1]);
    const recent = intervals.slice(-4);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    if (mean <= 0) return 1;
    const variance =
      recent.reduce((a, b) => a + (b - mean) * (b - mean), 0) / recent.length;
    const cv = Math.sqrt(variance) / mean; // coefficient of variation
    // cv >= 0.42 → convincing sandwalk; cv <= 0.07 → metronome
    return clamp(1 - (cv - 0.07) / (0.42 - 0.07), 0, 1);
  }
}
