// The world of Arrakis: analytic heightfield + zone definitions shared by
// rendering, player physics and worm AI.

import { fbm2, smoothstep, clamp } from "./noise";

export const WORLD_SIZE = 1500;

/** Player starting rock islet. */
export const START = { x: 0, z: 250, r: 22 };

/** Reaching this z means the cliffs of the sietch: safety / victory. */
export const GOAL_Z = -250;
export const CLIFF_Z = -270; // where the cliff wall begins to rise

/** Small rock refuges scattered along the crossing. Worms cannot reach rock. */
export const REFUGES: { x: number; z: number; r: number }[] = [
  { x: -68, z: 138, r: 13 },
  { x: 55, z: 16, r: 12 },
  { x: -42, z: -120, r: 13 },
];

/** Drum sand: taut, pale patches that BOOM when stepped on (instant wormsign). */
export const DRUM_PATCHES: { x: number; z: number; r: number }[] = [
  { x: -14, z: 190, r: 12 },
  { x: 30, z: 96, r: 14 },
  { x: -52, z: 58, r: 11 },
  { x: 12, z: -36, r: 13 },
  { x: -20, z: -88, r: 10 },
  { x: 58, z: -150, r: 14 },
  { x: -6, z: -196, r: 12 },
  { x: 96, z: -60, r: 12 },
];

/** Spice blows: rust-cinnamon shimmer on the sand. Cosmetic + flavor text. */
export const SPICE_PATCHES: { x: number; z: number; r: number }[] = [
  { x: -110, z: 80, r: 24 },
  { x: 88, z: -10, r: 20 },
  { x: -70, z: -180, r: 22 },
  { x: 130, z: 150, r: 26 },
];

/** Soft playfield boundary; beyond this the player is nudged back. */
export const BOUND = { x: 420, zMin: -320, zMax: 330 };

function rockPad(x: number, z: number, cx: number, cz: number, r: number): number {
  const d = Math.hypot(x - cx, z - cz);
  // flat-topped pad, ~2.6m above the surrounding sand
  return smoothstep(r + 10, r - 4, d) * 2.6;
}

/** Pure dune field height (no rock features). */
export function duneHeight(x: number, z: number): number {
  const warp = fbm2(x * 0.004 + 11.3, z * 0.004 - 4.7, 3) * 120;
  // long crescent dune rows running roughly east-west, ~230m wavelength
  const ridge = Math.sin((z + warp) * 0.027 + fbm2(x * 0.012, z * 0.012, 3) * 2.2);
  let h = Math.pow((ridge + 1) / 2, 1.6) * 9.5;
  h += fbm2(x * 0.016 + 7.1, z * 0.016 - 3.4, 4) * 4.2;
  h += fbm2(x * 0.085 + 1.7, z * 0.085 + 9.2, 2) * 0.55;
  return h;
}

/** Full terrain height: dunes + rock pads + sietch cliff wall. */
export function terrainHeight(x: number, z: number): number {
  let h = duneHeight(x, z);
  h += rockPad(x, z, START.x, START.z, START.r);
  for (const rf of REFUGES) h += rockPad(x, z, rf.x, rf.z, rf.r);
  // sietch cliff: rises steeply past CLIFF_Z, with a rocky apron before it
  const cliff = smoothstep(CLIFF_Z, CLIFF_Z - 90, z);
  h += cliff * cliff * 90;
  h += smoothstep(GOAL_Z + 14, GOAL_Z - 10, z) * 2.0; // rock apron
  return h;
}

/** Worms cannot move through rock; the player is safe here. */
export function isOnRock(x: number, z: number): boolean {
  if (z < GOAL_Z + 6) return true;
  if (Math.hypot(x - START.x, z - START.z) < START.r) return true;
  for (const rf of REFUGES) {
    if (Math.hypot(x - rf.x, z - rf.z) < rf.r) return true;
  }
  return false;
}

export function isOnDrumSand(x: number, z: number): boolean {
  if (isOnRock(x, z)) return false;
  for (const p of DRUM_PATCHES) {
    if (Math.hypot(x - p.x, z - p.z) < p.r) return true;
  }
  return false;
}

export function isOnSpice(x: number, z: number): boolean {
  for (const p of SPICE_PATCHES) {
    if (Math.hypot(x - p.x, z - p.z) < p.r) return true;
  }
  return false;
}

/** 0..1 factor of how strongly a point sits inside any drum patch (for tinting). */
export function drumFactor(x: number, z: number): number {
  let f = 0;
  for (const p of DRUM_PATCHES) {
    const d = Math.hypot(x - p.x, z - p.z);
    f = Math.max(f, smoothstep(p.r, p.r - 6, d));
  }
  return f;
}

export function spiceFactor(x: number, z: number): number {
  let f = 0;
  for (const p of SPICE_PATCHES) {
    const d = Math.hypot(x - p.x, z - p.z);
    f = Math.max(f, smoothstep(p.r, p.r - 10, d));
  }
  return f;
}

export function rockFactor(x: number, z: number): number {
  let f = 0;
  const pads = [START, ...REFUGES];
  for (const p of pads) {
    const d = Math.hypot(x - p.x, z - p.z);
    f = Math.max(f, smoothstep(p.r + 8, p.r - 4, d));
  }
  f = Math.max(f, smoothstep(GOAL_Z + 16, GOAL_Z - 6, z));
  return clamp(f, 0, 1);
}
