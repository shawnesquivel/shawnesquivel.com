// Shai-Hulud. While travelling it shows only wormsign: "an elongated
// mound-in-motion — a cresting of sand" trailing a dust hiss. When it reaches
// rhythmic vibration on open sand the desert itself erupts — a violent geyser
// of sand and dust blasting skyward where the prey stood.

import * as THREE from "three";
import { terrainHeight, isOnRock } from "./world";
import { clamp } from "./noise";
import { makeDotTexture } from "./dot-texture";

export type WormState =
  | "idle" // no worm in the area
  | "approach" // homing on a vibration source
  | "search" // lost the trail, casting about
  | "breach" // surfacing attack: the sand eruption
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
const BREACH_DURATION = 3.8;
const KILL_RADIUS = 30;

const ERUPT_N = 1400;
const ERUPT_STAGGER = 1.4; // particles launch over this many seconds
const GRAVITY = 24;

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
  private dust: THREE.Points;
  private dustPositions: Float32Array;
  private dustSeeds: Float32Array;

  // the eruption: a staggered ballistic sand geyser + rising dust billows
  private erupt: THREE.Points;
  private eruptMat: THREE.PointsMaterial;
  private eruptPositions: Float32Array;
  private eruptVel: Float32Array; // vx, vy, vz per particle
  private eruptDelay: Float32Array;
  private billows: THREE.Sprite[] = [];

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
    const moundMat = new THREE.MeshStandardMaterial({ color: 0xd49d66, roughness: 1 });
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

    // --- eruption particles (world-space, independent of the group)
    this.eruptPositions = new Float32Array(ERUPT_N * 3);
    this.eruptVel = new Float32Array(ERUPT_N * 3);
    this.eruptDelay = new Float32Array(ERUPT_N);
    const eg = new THREE.BufferGeometry();
    eg.setAttribute("position", new THREE.BufferAttribute(this.eruptPositions, 3));
    this.eruptMat = new THREE.PointsMaterial({
      color: 0xc59a63,
      size: 4.4,
      map: makeDotTexture(),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.erupt = new THREE.Points(eg, this.eruptMat);
    this.erupt.visible = false;
    this.erupt.frustumCulled = false;
    scene.add(this.erupt);

    // --- big soft dust billows that swell out of the eruption
    const billowTex = makeDotTexture();
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: billowTex, color: 0xc69a66, transparent: true, opacity: 0, depthWrite: false })
      );
      sp.visible = false;
      scene.add(sp);
      this.billows.push(sp);
    }
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

  /** Jump the worm to a given distance from its target (sandbox/testing). */
  placeAt(dist: number, angle: number): void {
    if (!this.target) return;
    this.pos.set(this.target.x + Math.cos(angle) * dist, this.target.z + Math.sin(angle) * dist);
  }

  update(dt: number, elapsed: number, playerX: number, playerZ: number): void {
    if (this.satedClock > 0) this.satedClock -= dt;
    if (this.state === "idle") return;

    if (this.state === "breach") {
      this.breachClock += dt;
      this.updateEruption(this.breachClock);
      if (this.breachClock > 0.85 && this.breachClock - dt <= 0.85) {
        // the strike lands beneath the geyser
        this.onBreachHit?.(
          this.breachAt.x,
          this.breachAt.y,
          this.target?.kind ?? "player",
          this.target?.thumperId
        );
      }
      if (this.breachClock >= BREACH_DURATION) {
        this.erupt.visible = false;
        for (const b of this.billows) b.visible = false;
        this.mound.visible = true;
        this.wake.visible = true;
        this.group.visible = true;
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
          this.startBreach();
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

    // place wormsign on the terrain, pitched to follow the dune slope so the
    // long mound never floats above a downhill face
    const h = terrainHeight(this.pos.x, this.pos.y);
    const ahead = terrainHeight(this.pos.x + this.heading.x * 22, this.pos.y + this.heading.y * 22);
    const behind = terrainHeight(this.pos.x - this.heading.x * 22, this.pos.y - this.heading.y * 22);
    this.group.position.set(this.pos.x, Math.min(h, (ahead + behind) / 2) - 2.2, this.pos.y);
    const angle = Math.atan2(this.heading.x, this.heading.y);
    this.group.rotation.y = angle;
    this.group.rotation.x = Math.atan2(behind - ahead, 44) * 0.8;
    // mound undulates as it swims
    const sway = Math.sin(elapsed * 3.1) * 0.5;
    this.mound.position.y = 1.4 + sway * 0.4;
    this.mound.position.x = sway;

    // dust around the cresting head — sprays harder the closer it gets
    const near = this.target
      ? clamp(1 - this.distanceTo(this.target.x, this.target.z) / 260, 0, 1)
      : 0;
    const pos = this.dustPositions;
    const n = this.dustSeeds.length;
    const lift = 9 + near * 13;
    for (let i = 0; i < n; i++) {
      const s = this.dustSeeds[i];
      const life = (elapsed * (0.6 + s) + s * 7) % 1;
      pos[i * 3] = (s - 0.5) * 22 + Math.sin(s * 60 + elapsed) * 2;
      pos[i * 3 + 1] = 2.5 + life * lift;
      pos[i * 3 + 2] = 8 - life * 36;
    }
    this.dust.geometry.attributes.position.needsUpdate = true;
    (this.dust.material as THREE.PointsMaterial).opacity = 0.45 + near * 0.3;
  }

  private startBreach(): void {
    if (!this.target) return;
    this.state = "breach";
    this.breachClock = 0;
    this.breachAt.set(this.target.x, this.target.z);
    this.group.visible = false; // the mound vanishes — then the sand explodes

    // seed the geyser
    const gy = terrainHeight(this.breachAt.x, this.breachAt.y);
    for (let i = 0; i < ERUPT_N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 7;
      this.eruptPositions[i * 3] = this.breachAt.x + Math.cos(a) * r;
      this.eruptPositions[i * 3 + 1] = gy - 6; // hidden under the sand until launch
      this.eruptPositions[i * 3 + 2] = this.breachAt.y + Math.sin(a) * r;
      const ha = Math.random() * Math.PI * 2;
      const hm = 3 + Math.random() * 14; // outward scatter
      this.eruptVel[i * 3] = Math.cos(ha) * hm;
      this.eruptVel[i * 3 + 1] = 26 + Math.random() * 34; // skyward blast
      this.eruptVel[i * 3 + 2] = Math.sin(ha) * hm;
      this.eruptDelay[i] = Math.random() * ERUPT_STAGGER;
    }
    this.erupt.visible = true;
    this.eruptMat.opacity = 0.95;

    for (let b = 0; b < this.billows.length; b++) {
      const sp = this.billows[b];
      sp.visible = true;
      sp.material.opacity = 0;
      sp.position.set(
        this.breachAt.x + (Math.random() - 0.5) * 10,
        gy + 2,
        this.breachAt.y + (Math.random() - 0.5) * 10
      );
      sp.scale.set(4, 4, 1);
    }

    this.onBreachStart?.(this.breachAt.x, this.breachAt.y, this.target.kind);
  }

  private updateEruption(t: number): void {
    const gy = terrainHeight(this.breachAt.x, this.breachAt.y);
    const fade = t > BREACH_DURATION - 0.7 ? (BREACH_DURATION - t) / 0.7 : 1;
    this.eruptMat.opacity = 0.95 * clamp(fade, 0, 1);
    for (let i = 0; i < ERUPT_N; i++) {
      const life = t - this.eruptDelay[i];
      if (life <= 0) continue;
      const a = Math.atan2(
        this.eruptPositions[i * 3 + 2] - this.breachAt.y,
        this.eruptPositions[i * 3] - this.breachAt.x
      );
      const r = Math.hypot(
        this.eruptPositions[i * 3] - this.breachAt.x,
        this.eruptPositions[i * 3 + 2] - this.breachAt.y
      );
      const y = gy + this.eruptVel[i * 3 + 1] * life - 0.5 * GRAVITY * life * life;
      this.eruptPositions[i * 3] = this.breachAt.x + Math.cos(a) * r + this.eruptVel[i * 3] * life * 0.18;
      this.eruptPositions[i * 3 + 2] = this.breachAt.y + Math.sin(a) * r + this.eruptVel[i * 3 + 2] * life * 0.18;
      this.eruptPositions[i * 3 + 1] = Math.max(y, gy - 6);
    }
    this.erupt.geometry.attributes.position.needsUpdate = true;

    // dust billows swell and linger
    for (let b = 0; b < this.billows.length; b++) {
      const sp = this.billows[b];
      const phase = clamp((t - b * 0.22) / (BREACH_DURATION - 0.3), 0, 1);
      const grow = 8 + phase * (42 + b * 9);
      sp.scale.set(grow, grow * 0.85, 1);
      sp.position.y = gy + 5 + phase * (20 + b * 5);
      sp.material.opacity = Math.sin(phase * Math.PI) * 0.55;
    }
  }

  reset(): void {
    this.state = "idle";
    this.target = null;
    this.satedClock = 0;
    this.timesCalled = 0;
    this.group.visible = false;
    this.erupt.visible = false;
    for (const b of this.billows) b.visible = false;
    this.mound.visible = true;
    this.wake.visible = true;
  }
}

export const WORM_KILL_RADIUS = KILL_RADIUS;
