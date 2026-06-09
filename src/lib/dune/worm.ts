// Shai-Hulud. While travelling it shows only wormsign: "an elongated
// mound-in-motion — a cresting of sand" trailing a dust hiss. When it reaches
// rhythmic vibration on open sand it breaches: a vast round mouth ringed with
// crystal teeth.

import * as THREE from "three";
import { terrainHeight, isOnRock } from "./world";
import { clamp, lerp } from "./noise";
import { makeDotTexture } from "./dot-texture";

export type WormState =
  | "idle" // no worm in the area
  | "approach" // homing on a vibration source
  | "search" // lost the trail, casting about
  | "breach" // surfacing attack animation
  | "leave"; // departing / sated

export interface WormTarget {
  x: number;
  z: number;
  kind: "player" | "thumper";
  thumperId?: number;
}

const SPAWN_DIST = 620;
const DESPAWN_DIST = 950;
const SEARCH_TIME = 11;
const BREACH_TRIGGER_DIST = 16;
const BREACH_DURATION = 2.6;
const KILL_RADIUS = 30;

export class SandWorm {
  state: WormState = "idle";
  pos = new THREE.Vector2(0, 0);
  private heading = new THREE.Vector2(0, 1);
  target: WormTarget | null = null;
  private searchClock = 0;
  private breachClock = 0;
  private breachAt = new THREE.Vector2();
  private satedClock = 0;
  /** number of times the player has drawn a worm (for stats) */
  timesCalled = 0;

  group: THREE.Group;
  private mound: THREE.Mesh;
  private wake: THREE.Mesh;
  private body: THREE.Group;
  private dust: THREE.Points;
  private dustPositions: Float32Array;
  private dustSeeds: Float32Array;

  onBreachStart: ((x: number, z: number, kind: "player" | "thumper") => void) | null = null;
  onBreachHit: ((x: number, z: number, kind: "player" | "thumper", thumperId?: number) => void) | null = null;
  onDeparted: (() => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    // --- the moving mound (wormsign) — sand-colored so it reads as a
    // cresting of sand, not a foreign object
    const moundGeo = new THREE.SphereGeometry(1, 24, 16);
    const moundMat = new THREE.MeshStandardMaterial({ color: 0xd49d66, roughness: 1, flatShading: false });
    this.mound = new THREE.Mesh(moundGeo, moundMat);
    this.mound.scale.set(13, 3.8, 30);
    this.group.add(this.mound);

    const wakeMat = new THREE.MeshStandardMaterial({ color: 0xcc965f, roughness: 1, transparent: true, opacity: 0.9 });
    this.wake = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), wakeMat);
    this.wake.scale.set(8, 1.9, 46);
    this.wake.position.z = -30;
    this.group.add(this.wake);

    // --- dust hiss particles around the cresting head
    const DUST = 260;
    this.dustPositions = new Float32Array(DUST * 3);
    this.dustSeeds = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) this.dustSeeds[i] = Math.random();
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd3a877,
      size: 1.1,
      map: makeDotTexture(),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.dust = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dust);

    // --- breaching body: segmented trunk + maw of crystal teeth
    this.body = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xa1805c, roughness: 0.92 });
    const skinDark = new THREE.MeshStandardMaterial({ color: 0x82654a, roughness: 1 });
    const SEGMENTS = 14;
    for (let i = 0; i < SEGMENTS; i++) {
      const t = i / (SEGMENTS - 1);
      const r = lerp(10.5, 13.5, t);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.04, 6.4, 28), i % 2 ? skin : skinDark);
      seg.position.y = -i * 6.1;
      this.body.add(seg);
    }
    // the maw
    const maw = new THREE.Group();
    const throat = new THREE.Mesh(
      new THREE.CylinderGeometry(8.2, 2.4, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0x140a06 })
    );
    throat.position.y = 1.0;
    maw.add(throat);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(10.6, 2.6, 14, 30), skin);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 5.4;
    maw.add(lip);
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.35, metalness: 0.1 });
    const TEETH = 26;
    for (let ring = 0; ring < 2; ring++) {
      const rr = ring === 0 ? 8.6 : 6.2;
      for (let i = 0; i < TEETH; i++) {
        const a = (i / TEETH) * Math.PI * 2 + ring * 0.12;
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.4, 6), toothMat);
        tooth.position.set(Math.cos(a) * rr, 4.6 - ring * 1.6, Math.sin(a) * rr);
        tooth.lookAt(0, -4, 0);
        maw.add(tooth);
      }
    }
    maw.position.y = 6.0;
    this.body.add(maw);
    this.body.visible = false;
    this.group.add(this.body);
  }

  /** Spawn over the horizon, approaching the given target point. */
  call(target: WormTarget, fromAngleHint: number | null = null): void {
    if (this.state === "breach") return;
    if (this.state === "idle") {
      const a = fromAngleHint ?? Math.random() * Math.PI * 2;
      this.pos.set(target.x + Math.cos(a) * SPAWN_DIST, target.z + Math.sin(a) * SPAWN_DIST);
      this.timesCalled++;
      this.group.visible = true;
    } else if (this.state === "leave") {
      // a departing worm turns back toward the new summons
      this.timesCalled++;
    }
    this.target = { ...target };
    this.state = "approach";
    this.searchClock = 0;
  }

  /** A vibration the worm can hear: retarget if loud enough / closer source. */
  hear(target: WormTarget, loudness: number): void {
    if (this.state === "idle" || this.state === "breach") return;
    if (this.satedClock > 0 && target.kind === "player" && loudness < 0.5) return;
    const d = Math.hypot(this.pos.x - target.x, this.pos.y - target.z);
    // hearing falls off with distance; thumpers and drum sand are very loud
    const heard = loudness * clamp(1 - d / 1400, 0, 1);
    if (heard > 0.018) {
      this.target = { ...target };
      if (this.state === "search" || this.state === "leave") this.state = "approach";
      this.searchClock = 0;
    }
  }

  get distanceTo(): (x: number, z: number) => number {
    return (x, z) => Math.hypot(this.pos.x - x, this.pos.y - z);
  }

  update(dt: number, elapsed: number, playerX: number, playerZ: number): void {
    if (this.satedClock > 0) this.satedClock -= dt;
    if (this.state === "idle") return;

    if (this.state === "breach") {
      this.breachClock += dt;
      const t = this.breachClock / BREACH_DURATION;
      this.animateBreach(clamp(t, 0, 1));
      if (this.breachClock > 0.85 && this.breachClock - dt <= 0.85) {
        // the strike lands
        this.onBreachHit?.(
          this.breachAt.x,
          this.breachAt.y,
          this.target?.kind ?? "player",
          this.target?.thumperId
        );
      }
      if (t >= 1) {
        this.body.visible = false;
        this.mound.visible = true;
        this.wake.visible = true;
        this.satedClock = 14;
        this.state = "leave";
        this.target = null;
      }
      return;
    }

    let speed = 0;
    if (this.state === "approach" && this.target) {
      const dx = this.target.x - this.pos.x;
      const dz = this.target.z - this.pos.y;
      const d = Math.hypot(dx, dz);
      speed = d > 220 ? 46 : d > 80 ? 30 : 17;
      if (d > 1) {
        this.heading.set(dx / d, dz / d).normalize();
      }
      if (d < BREACH_TRIGGER_DIST) {
        const onRock =
          this.target.kind === "player" ? isOnRock(this.target.x, this.target.z) : false;
        if (onRock) {
          // it circles, balked by rock
          this.state = "search";
          this.searchClock = 0;
        } else {
          this.state = "breach";
          this.breachClock = 0;
          // surface a bit short of the prey so the body towers in front of
          // it (and the camera) instead of erupting through it
          this.breachAt.set(
            this.target.x - this.heading.x * 24,
            this.target.z - this.heading.y * 24
          );
          this.body.visible = true;
          this.mound.visible = false;
          this.wake.visible = false;
          this.onBreachStart?.(this.target.x, this.target.z, this.target.kind);
        }
      }
    } else if (this.state === "search") {
      this.searchClock += dt;
      speed = 14;
      // spiral around the last known vibration
      const a = elapsed * 0.55;
      this.heading.set(Math.cos(a), Math.sin(a));
      if (this.searchClock > SEARCH_TIME) {
        this.state = "leave";
        this.target = null;
      }
    } else if (this.state === "leave") {
      speed = 34;
      // head away from the player
      const dx = this.pos.x - playerX;
      const dz = this.pos.y - playerZ;
      const d = Math.max(1, Math.hypot(dx, dz));
      this.heading.set(dx / d, dz / d);
      if (d > DESPAWN_DIST) {
        this.state = "idle";
        this.group.visible = false;
        this.onDeparted?.();
        return;
      }
    }

    this.pos.x += this.heading.x * speed * dt;
    this.pos.y += this.heading.y * speed * dt;

    // worms keep to sand: deflect away from the cliff line
    if (this.pos.y < -230 && this.state !== "leave") {
      this.pos.y = -230;
    }

    // place wormsign on the terrain
    const h = terrainHeight(this.pos.x, this.pos.y);
    this.group.position.set(this.pos.x, h - 1.5, this.pos.y);
    const angle = Math.atan2(this.heading.x, this.heading.y);
    this.group.rotation.y = angle;
    // mound undulates as it swims
    const sway = Math.sin(elapsed * 3.1) * 0.5;
    this.mound.position.y = 1.4 + sway * 0.4;
    this.mound.position.x = sway;

    // dust around the cresting head
    const pos = this.dustPositions;
    const n = this.dustSeeds.length;
    for (let i = 0; i < n; i++) {
      const s = this.dustSeeds[i];
      const life = (elapsed * (0.6 + s) + s * 7) % 1;
      pos[i * 3] = (s - 0.5) * 22 + Math.sin(s * 60 + elapsed) * 2;
      pos[i * 3 + 1] = 2.5 + life * 9;
      pos[i * 3 + 2] = 8 - life * 36;
    }
    this.dust.geometry.attributes.position.needsUpdate = true;
    (this.dust.material as THREE.PointsMaterial).opacity = this.state === "breach" ? 0.8 : 0.5;
  }

  private animateBreach(t: number): void {
    // rise fast, hold, sink back
    let rise: number;
    if (t < 0.32) rise = (t / 0.32) * (t / 0.32); // accelerate up
    else if (t < 0.6) rise = 1;
    else rise = 1 - (t - 0.6) / 0.4;
    const h = terrainHeight(this.breachAt.x, this.breachAt.y);
    this.group.position.set(this.breachAt.x, h, this.breachAt.y);
    // keep facing the prey (group +z points along the final heading)
    this.group.rotation.y = Math.atan2(this.heading.x, this.heading.y);
    this.body.position.y = lerp(-95, 26, rise);
    this.body.rotation.z = Math.sin(t * Math.PI) * 0.1;
    // loom: tip the maw forward over the prey so the teeth show
    const lean = Math.sin(Math.min(1, t / 0.6) * Math.PI * 0.5) * 0.55;
    this.body.rotation.x = lean;
  }

  reset(): void {
    this.state = "idle";
    this.target = null;
    this.satedClock = 0;
    this.timesCalled = 0;
    this.group.visible = false;
    this.body.visible = false;
    this.mound.visible = true;
    this.wake.visible = true;
  }
}

export const WORM_KILL_RADIUS = KILL_RADIUS;
