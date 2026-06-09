// Arrakis Crossing — main engine. Owns the three.js scene, the player
// (sandwalk mechanics), the worm, thumpers, ambience and the HUD feed.

import * as THREE from "three";
import {
  WORLD_SIZE,
  START,
  GOAL_Z,
  CLIFF_Z,
  BOUND,
  terrainHeight,
  isOnRock,
  isOnDrumSand,
  isOnSpice,
  drumFactor,
  spiceFactor,
  rockFactor,
  REFUGES,
  SPICE_PATCHES,
} from "./world";
import { fbm2, clamp, lerp } from "./noise";
import { RhythmTracker, StepKind } from "./rhythm";
import { SandWorm, WormState, WORM_KILL_RADIUS } from "./worm";
import { DuneAudio } from "./audio";

export type Phase = "intro" | "playing" | "dead" | "won";

export interface HudState {
  phase: Phase;
  vibration: number;
  stepLabel: "sandwalk" | "uneven" | "rhythmic" | null;
  wormState: WormState;
  wormDistance: number | null;
  distanceToGoal: number;
  thumpers: number;
  onRock: boolean;
  onSpice: boolean;
  message: string | null;
  messageTone: "info" | "danger" | "good";
  stats: {
    time: number;
    steps: number;
    sandwalkSteps: number;
    wormsCalled: number;
    thumpersUsed: number;
  };
}

interface Thumper {
  id: number;
  x: number;
  z: number;
  mesh: THREE.Group;
  clapper: THREE.Mesh;
  ttl: number;
  tick: number;
}

const PLAYER_EYE = 1.7;
const FRICTION = 5.5;
const VIBRATION_TRIGGER = 0.55;

export class DuneGame {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private elapsed = 0;
  private raf = 0;
  private disposed = false;

  // player
  private pos = new THREE.Vector3(START.x, 0, START.z);
  private vel = new THREE.Vector3();
  private yaw = Math.PI; // facing -z (toward the sietch)
  private pitch = 0;
  private keys = new Set<string>();
  private moveHeldTime = 0;
  private autoStepTimer = 0;
  private bob = 0;
  private bobPhase = 0;
  private shake = 0;
  private rhythm = new RhythmTracker();
  private vibration = 0;
  private stepLabelTtl = 0;

  // entities
  private worm: SandWorm;
  private thumpers: Thumper[] = [];
  private thumperInventory = 2;
  private nextThumperId = 1;

  // ambience
  private audio = new DuneAudio();
  private windPoints!: THREE.Points;
  private windData!: Float32Array;
  private spicePoints!: THREE.Points;
  private skyMat!: THREE.ShaderMaterial;

  // state
  phase: Phase = "intro";
  private startTime = 0;
  private steps = 0;
  private sandwalkSteps = 0;
  private thumpersUsed = 0;
  private message: string | null = null;
  private messageTone: "info" | "danger" | "good" = "info";
  private messageTtl = 0;
  private spiceNoticed = false;
  private wormsignAnnounced = false;

  hud: HudState;
  onHud: (h: HudState) => void;

  constructor(canvas: HTMLCanvasElement, onHud: (h: HudState) => void) {
    this.onHud = onHud;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xcf9a64, 0.00115);

    this.camera = new THREE.PerspectiveCamera(
      72,
      canvas.clientWidth / Math.max(1, canvas.clientHeight),
      0.1,
      5000
    );

    this.buildSky();
    this.buildLights();
    this.buildTerrain();
    this.buildRocks();
    this.buildSietchGlow();
    this.buildWind();
    this.buildSpiceGlitter();

    this.worm = new SandWorm(this.scene);
    this.worm.onBreachStart = (x, z, kind) => {
      this.shake = Math.max(this.shake, kind === "player" ? 1.4 : 0.7);
      this.audio.wormBreach();
      if (kind === "player") {
        this.showMessage("Shai-Hulud rises — a gaping round mouth, crystal teeth glinting!", "danger", 4);
      } else {
        this.showMessage("The Maker breaches and takes the thumper.", "info", 4);
      }
    };
    this.worm.onBreachHit = (x, z, kind, thumperId) => {
      if (kind === "thumper" && thumperId !== undefined) {
        this.removeThumper(thumperId);
      } else {
        const d = Math.hypot(this.pos.x - x, this.pos.z - z);
        if (d < WORM_KILL_RADIUS && !isOnRock(this.pos.x, this.pos.z)) {
          this.die();
        } else {
          this.showMessage("The strike misses — sand rains down around you.", "danger", 3.5);
          this.shake = Math.max(this.shake, 1.0);
        }
      }
    };
    this.worm.onDeparted = () => {
      this.wormsignAnnounced = false;
      this.showMessage("The drumming fades. The desert is still again.", "good", 4);
    };

    this.hud = this.makeHud();

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.onResize);
    canvas.addEventListener("click", this.onCanvasClick);
    document.addEventListener("mousemove", this.onMouseMove);

    this.installTestHooks();
    this.loop();
  }

  // ---------------------------------------------------------------- scene

  private buildSky(): void {
    const geo = new THREE.SphereGeometry(2400, 32, 20);
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a2240) },
        midColor: { value: new THREE.Color(0x7a5a78) },
        horizonColor: { value: new THREE.Color(0xeFa45c) },
        sunDir: { value: new THREE.Vector3(0.55, 0.13, -0.82).normalize() },
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 midColor; uniform vec3 horizonColor; uniform vec3 sunDir;
        varying vec3 vDir;
        void main() {
          float t = max(vDir.y, 0.0);
          vec3 col = mix(horizonColor, midColor, smoothstep(0.0, 0.22, t));
          col = mix(col, topColor, smoothstep(0.12, 0.65, t));
          float s = max(dot(normalize(vDir), sunDir), 0.0);
          col += vec3(1.0, 0.62, 0.3) * pow(s, 110.0) * 1.6;   // sun disc glow
          col += vec3(1.0, 0.55, 0.25) * pow(s, 7.0) * 0.28;   // dawn haze
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(geo, this.skyMat));

    // stars in the upper dome
    const N = 1100;
    const sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const y = 0.18 + Math.random() * 0.82;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      sp[i * 3] = Math.cos(a) * r * 2200;
      sp[i * 3 + 1] = y * 2200;
      sp[i * 3 + 2] = Math.sin(a) * r * 2200;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(
      sg,
      new THREE.PointsMaterial({ color: 0xdde6ff, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0.75, fog: false, depthWrite: false })
    );
    this.scene.add(stars);

    // the two moons of Arrakis
    const moonTex = (tint: string, dark: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(54, 50, 8, 64, 64, 62);
      grad.addColorStop(0, tint);
      grad.addColorStop(0.75, dark);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(64, 64, 62, 0, Math.PI * 2);
      g.fill();
      // mottling
      g.globalAlpha = 0.18;
      for (let i = 0; i < 26; i++) {
        g.fillStyle = "#00000088";
        g.beginPath();
        g.arc(20 + Math.random() * 88, 20 + Math.random() * 88, 2 + Math.random() * 7, 0, Math.PI * 2);
        g.fill();
      }
      const tx = new THREE.CanvasTexture(c);
      return tx;
    };
    const m1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex("#f5ead8", "#b9a98c"), fog: false, depthWrite: false }));
    m1.scale.set(210, 210, 1);
    m1.position.set(-900, 1150, -1500);
    this.scene.add(m1);
    const m2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex("#cdd8ea", "#8b96ad"), fog: false, depthWrite: false }));
    m2.scale.set(110, 110, 1);
    m2.position.set(1100, 800, -1100);
    this.scene.add(m2);
  }

  private buildLights(): void {
    const sun = new THREE.DirectionalLight(0xffc890, 1.55);
    sun.position.set(550, 190, -820);
    this.scene.add(sun);
    const hemi = new THREE.HemisphereLight(0x9db4d8, 0xc69058, 0.62);
    this.scene.add(hemi);
  }

  private buildTerrain(): void {
    const SEG = 300;
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);
    const cBase = new THREE.Color();
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const h = terrainHeight(x, z);
      posAttr.setY(i, h);

      // base sand with subtle hue variation + crest lightening
      const v = fbm2(x * 0.02 + 31, z * 0.02 - 17, 3) * 0.5 + 0.5;
      cBase.setRGB(
        lerp(0.78, 0.88, v),
        lerp(0.55, 0.65, v),
        lerp(0.34, 0.42, v)
      );
      const crest = clamp((h - 6) / 8, 0, 1);
      cBase.lerp(new THREE.Color(0.95, 0.78, 0.55), crest * 0.35);

      // drum sand: paler, smoother, slightly grey — visibly taut
      const df = drumFactor(x, z);
      if (df > 0) cBase.lerp(new THREE.Color(0.93, 0.88, 0.72), df * 0.85);

      // spice: rust-cinnamon stain
      const sf = spiceFactor(x, z);
      if (sf > 0) cBase.lerp(new THREE.Color(0.62, 0.28, 0.1), sf * 0.7);

      // rock pads + cliff: dark basalt
      const rf = rockFactor(x, z);
      const cliffF = clamp((CLIFF_Z - z) / 60, 0, 1);
      const rocky = Math.max(rf, cliffF);
      if (rocky > 0) cBase.lerp(new THREE.Color(0.27, 0.23, 0.2), rocky * 0.92);

      colors[i * 3] = cBase.r;
      colors[i * 3 + 1] = cBase.g;
      colors[i * 3 + 2] = cBase.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  private buildRocks(): void {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x453a31, roughness: 0.95, flatShading: true });
    const addBoulders = (cx: number, cz: number, r: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const rr = r * (0.45 + Math.random() * 0.65);
        const x = cx + Math.cos(a) * rr;
        const z = cz + Math.sin(a) * rr;
        const s = 0.8 + Math.random() * 2.6;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
        rock.position.set(x, terrainHeight(x, z) + s * 0.25, z);
        rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        rock.scale.y = 0.6 + Math.random() * 0.5;
        this.scene.add(rock);
      }
    };
    addBoulders(START.x, START.z, START.r, 14);
    for (const rf of REFUGES) addBoulders(rf.x, rf.z, rf.r, 9);
    // jagged crags along the cliff top
    for (let i = 0; i < 40; i++) {
      const x = -640 + Math.random() * 1280;
      const z = CLIFF_Z - 70 - Math.random() * 90;
      const s = 8 + Math.random() * 26;
      const crag = new THREE.Mesh(new THREE.ConeGeometry(s * 0.7, s * 2.4, 5), rockMat);
      crag.position.set(x, terrainHeight(x, z) + s * 0.6, z);
      crag.rotation.y = Math.random() * 3;
      this.scene.add(crag);
    }
  }

  private buildSietchGlow(): void {
    // warm cave-mouth lights in the cliff face — the way home
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffb45e, fog: false });
    const positions = [
      { x: -16, y: 16 },
      { x: 2, y: 11 },
      { x: 20, y: 19 },
    ];
    for (const p of positions) {
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 6.5), glowMat);
      const z = CLIFF_Z - 26;
      glow.position.set(p.x, terrainHeight(p.x, z) + p.y, z);
      this.scene.add(glow);
    }
  }

  private buildWind(): void {
    const N = 800;
    this.windData = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      this.windData[i * 3] = (Math.random() - 0.5) * 140;
      this.windData[i * 3 + 1] = Math.random() * 26;
      this.windData[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.windData, 3));
    this.windPoints = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xe2bb86, size: 0.45, transparent: true, opacity: 0.5, depthWrite: false })
    );
    this.scene.add(this.windPoints);
  }

  private buildSpiceGlitter(): void {
    const pts: number[] = [];
    for (const p of SPICE_PATCHES) {
      for (let i = 0; i < 110; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * p.r;
        const x = p.x + Math.cos(a) * r;
        const z = p.z + Math.sin(a) * r;
        pts.push(x, terrainHeight(x, z) + 0.18 + Math.random() * 0.5, z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    this.spicePoints = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xff9a3c, size: 0.35, transparent: true, opacity: 0.8, depthWrite: false })
    );
    this.scene.add(this.spicePoints);
  }

  // ---------------------------------------------------------------- input

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const k = e.code;
    this.keys.add(k);
    if (this.phase !== "playing") return;
    if (this.isMoveKey(k)) {
      e.preventDefault();
      this.takeStep("step");
      this.moveHeldTime = 0;
      this.autoStepTimer = 0;
    }
    if (k === "KeyT") this.plantThumper();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private isMoveKey(k: string): boolean {
    return ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k);
  }

  private moveDir(): THREE.Vector2 {
    const d = new THREE.Vector2();
    const has = (...ks: string[]) => ks.some((k) => this.keys.has(k));
    if (has("KeyW", "ArrowUp")) d.y -= 1;
    if (has("KeyS", "ArrowDown")) d.y += 1;
    if (has("KeyA", "ArrowLeft")) d.x -= 1;
    if (has("KeyD", "ArrowRight")) d.x += 1;
    if (d.lengthSq() > 0) d.normalize();
    return d;
  }

  private onCanvasClick = (): void => {
    if (this.phase !== "playing") return;
    const canvas = this.renderer.domElement;
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.()?.catch?.(() => {});
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (document.pointerLockElement !== this.renderer.domElement) return;
    this.yaw -= e.movementX * 0.0022;
    this.pitch = clamp(this.pitch - e.movementY * 0.0022, -1.2, 1.2);
  };

  private onResize = (): void => {
    const c = this.renderer.domElement;
    const w = c.clientWidth;
    const h = Math.max(1, c.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  // ---------------------------------------------------------------- player

  private takeStep(kind: StepKind): void {
    if (this.phase !== "playing") return;
    const dir = this.moveDir();
    if (dir.lengthSq() === 0) return;

    const onRock = isOnRock(this.pos.x, this.pos.z);
    const judge = this.rhythm.onStep(this.elapsed, kind);
    this.steps++;
    if (judge.label === "sandwalk" && !onRock) this.sandwalkSteps++;
    this.stepLabelTtl = 1.4;
    this.hud.stepLabel = judge.label;

    // movement impulse in look direction
    const impulse = kind === "run" ? 9.2 : kind === "walk" ? 6.6 : 7.6;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const wx = dir.x * cos + dir.y * sin;
    const wz = -dir.x * sin + dir.y * cos;
    this.vel.x += wx * impulse;
    this.vel.z += wz * impulse;
    this.bobPhase += Math.PI;
    this.bob = Math.min(1, this.bob + 0.5);
    this.audio.footstep(kind === "step" && Math.random() < 0.4 ? "drag" : kind);

    if (onRock) return; // rock transmits nothing to the sand

    // drum sand!
    if (isOnDrumSand(this.pos.x, this.pos.z)) {
      this.vibration = 1;
      this.audio.drumBoom();
      this.shake = Math.max(this.shake, 0.8);
      this.showMessage("DRUM SAND! The booming rolls across the basin. RUN!", "danger", 4);
      this.summonOrAlertWorm(3.5);
      return;
    }

    this.vibration = clamp(this.vibration + judge.loudness, 0, 1);
    if (this.vibration >= VIBRATION_TRIGGER && this.worm.state === "idle") {
      this.summonOrAlertWorm(judge.loudness);
    } else if (this.worm.state !== "idle" && judge.loudness > 0.08) {
      this.worm.hear({ x: this.pos.x, z: this.pos.z, kind: "player" }, judge.loudness);
    }
  }

  private summonOrAlertWorm(loudness: number): void {
    if (this.worm.state === "idle" || this.worm.state === "leave") {
      this.worm.call({ x: this.pos.x, z: this.pos.z, kind: "player" });
      if (!this.wormsignAnnounced) {
        this.wormsignAnnounced = true;
        this.showMessage(
          "WORMSIGN — an elongated mound-in-motion, a cresting of sand, turns toward you.",
          "danger",
          5
        );
      }
    } else {
      this.worm.hear({ x: this.pos.x, z: this.pos.z, kind: "player" }, loudness);
    }
  }

  private plantThumper(): void {
    if (this.thumperInventory <= 0) {
      this.showMessage("No thumpers left in your Fremkit.", "info", 2.5);
      return;
    }
    const fx = -Math.sin(this.yaw) * 3;
    const fz = -Math.cos(this.yaw) * 3;
    const x = this.pos.x + fx;
    const z = this.pos.z + fz;
    if (isOnRock(x, z)) {
      this.showMessage("Plant it in open sand — rock gives no transmission.", "info", 3);
      return;
    }
    this.thumperInventory--;
    this.thumpersUsed++;
    const group = new THREE.Group();
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.05, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x803f2a, roughness: 0.7 })
    );
    rod.position.y = 0.55;
    group.add(rod);
    const clapper = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.14, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xd8cdb8, roughness: 0.5 })
    );
    clapper.position.y = 1.18;
    group.add(clapper);
    group.position.set(x, terrainHeight(x, z), z);
    this.scene.add(group);
    const t: Thumper = { id: this.nextThumperId++, x, z, mesh: group, clapper, ttl: 75, tick: 0 };
    this.thumpers.push(t);
    this.audio.plantThumper();
    this.showMessage("The clapper begins its summons: lump... lump... lump...", "info", 4);
  }

  private removeThumper(id: number): void {
    const i = this.thumpers.findIndex((t) => t.id === id);
    if (i >= 0) {
      this.scene.remove(this.thumpers[i].mesh);
      this.thumpers.splice(i, 1);
    }
  }

  // ---------------------------------------------------------------- flow

  start(): void {
    if (this.phase === "playing") return;
    this.audio.init();
    this.phase = "playing";
    this.startTime = this.elapsed;
    this.showMessage(
      "Cross the open sand. Tap to step — keep your timing broken, like wind-shifted sand.",
      "info",
      6
    );
  }

  restart(): void {
    this.pos.set(START.x, 0, START.z);
    this.vel.set(0, 0, 0);
    this.yaw = Math.PI;
    this.pitch = 0;
    this.vibration = 0;
    this.rhythm.reset();
    this.worm.reset();
    for (const t of this.thumpers) this.scene.remove(t.mesh);
    this.thumpers = [];
    this.thumperInventory = 2;
    this.steps = 0;
    this.sandwalkSteps = 0;
    this.thumpersUsed = 0;
    this.spiceNoticed = false;
    this.wormsignAnnounced = false;
    this.message = null;
    this.phase = "playing";
    this.startTime = this.elapsed;
    this.audio.init();
    this.showMessage("Again. Walk without rhythm.", "info", 4);
  }

  private die(): void {
    if (this.phase !== "playing") return;
    this.phase = "dead";
    this.audio.death();
    document.exitPointerLock?.();
  }

  private winGame(): void {
    if (this.phase !== "playing") return;
    this.phase = "won";
    this.audio.win();
    document.exitPointerLock?.();
  }

  private showMessage(text: string, tone: "info" | "danger" | "good", dur: number): void {
    this.message = text;
    this.messageTone = tone;
    this.messageTtl = dur;
  }

  // ---------------------------------------------------------------- loop

  private loop = (): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.elapsed += dt;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.onHud(this.makeHud());
  };

  private update(dt: number): void {
    const t = this.elapsed;

    if (this.phase === "intro") {
      // slow establishing drift over the dunes
      const a = t * 0.045;
      const cx = START.x + Math.sin(a) * 40;
      const cz = START.z - 60 + Math.cos(a * 0.7) * 30;
      this.camera.position.set(cx, terrainHeight(cx, cz) + 16, cz);
      this.camera.lookAt(0, 8, GOAL_Z);
      this.updateAmbient(dt, t);
      return;
    }

    if (this.phase === "playing") {
      this.updatePlayer(dt, t);
      this.updateThumpers(dt);
      this.worm.update(dt, t, this.pos.x, this.pos.z);

      // win check
      if (this.pos.z < GOAL_Z + 5) this.winGame();
    } else {
      // dead / won: keep the world alive behind the overlay
      this.worm.update(dt, t, this.pos.x, this.pos.z);
    }

    this.placeCamera(dt, t);
    this.updateAmbient(dt, t);
  }

  private updatePlayer(dt: number, t: number): void {
    const dir = this.moveDir();
    const moving = dir.lengthSq() > 0;
    const running = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");

    if (moving) {
      this.moveHeldTime += dt;
      if (this.moveHeldTime > 0.35) {
        this.autoStepTimer -= dt;
        if (this.autoStepTimer <= 0) {
          const kind: StepKind = running ? "run" : "walk";
          this.autoStepTimer = running ? 0.26 : 0.44;
          this.takeStep(kind);
        }
      }
    } else {
      this.moveHeldTime = 0;
      this.autoStepTimer = 0;
    }

    // physics
    const f = Math.exp(-FRICTION * dt);
    this.vel.x *= f;
    this.vel.z *= f;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    // soft world bounds
    if (this.pos.x < -BOUND.x || this.pos.x > BOUND.x || this.pos.z > BOUND.zMax || this.pos.z < BOUND.zMin) {
      this.pos.x = clamp(this.pos.x, -BOUND.x, BOUND.x);
      this.pos.z = clamp(this.pos.z, BOUND.zMin, BOUND.zMax);
      this.showMessage("The open erg stretches to the horizon. The sietch cliffs are the only shelter.", "info", 3);
    }

    // vibration decay (faster on rock)
    const onRock = isOnRock(this.pos.x, this.pos.z);
    this.vibration = clamp(this.vibration - dt * (onRock ? 0.16 : 0.065), 0, 1);

    if (this.stepLabelTtl > 0) {
      this.stepLabelTtl -= dt;
      if (this.stepLabelTtl <= 0) this.hud.stepLabel = null;
    }
    if (this.messageTtl > 0) {
      this.messageTtl -= dt;
      if (this.messageTtl <= 0) this.message = null;
    }

    // spice flavor
    if (isOnSpice(this.pos.x, this.pos.z)) {
      if (!this.spiceNoticed) {
        this.spiceNoticed = true;
        this.showMessage("Spice — the air is thick with cinnamon. Melange glitters on the sand.", "good", 4);
      }
    } else {
      this.spiceNoticed = false;
    }
  }

  private updateThumpers(dt: number): void {
    for (const th of [...this.thumpers]) {
      th.ttl -= dt;
      th.tick -= dt;
      th.clapper.position.y = 1.18 + Math.abs(Math.sin(this.elapsed * 8.7)) * 0.1;
      if (th.tick <= 0) {
        th.tick = 0.72;
        // an irresistible, perfectly rhythmic summons
        if (this.worm.state === "idle") {
          this.worm.call({ x: th.x, z: th.z, kind: "thumper", thumperId: th.id });
        } else {
          this.worm.hear({ x: th.x, z: th.z, kind: "thumper", thumperId: th.id }, 1.6);
        }
      }
      if (th.ttl <= 0) {
        this.removeThumper(th.id);
        this.showMessage("A thumper winds down, its spring spent.", "info", 3);
      }
    }
  }

  private placeCamera(dt: number, t: number): void {
    const groundY = terrainHeight(this.pos.x, this.pos.z);
    this.bob = Math.max(0, this.bob - dt * 2.2);
    const bobY = Math.sin(this.bobPhase + t * 10) * 0.05 * this.bob;
    this.shake = Math.max(0, this.shake - dt * 1.1);
    // worm proximity shakes the ground
    const wd = this.worm.state !== "idle" ? this.worm.distanceTo(this.pos.x, this.pos.z) : Infinity;
    const proxShake = wd < 120 ? (1 - wd / 120) * 0.35 : 0;
    const sh = this.shake + proxShake;
    const sx = (fbm2(t * 9.1, 3.7, 2)) * sh * 0.35;
    const sy = (fbm2(7.3, t * 8.6, 2)) * sh * 0.35;

    this.camera.position.set(this.pos.x + sx, groundY + PLAYER_EYE + bobY + sy, this.pos.z);
    const lookX = this.pos.x - Math.sin(this.yaw) * Math.cos(this.pitch);
    const lookY = this.camera.position.y + Math.sin(this.pitch);
    const lookZ = this.pos.z - Math.cos(this.yaw) * Math.cos(this.pitch);
    this.camera.lookAt(lookX, lookY, lookZ);

    // keyboard turning (Q/E) for mouse-free play
    if (this.phase === "playing") {
      if (this.keys.has("KeyQ")) this.yaw += 1.7 * dt;
      if (this.keys.has("KeyE")) this.yaw -= 1.7 * dt;
    }
  }

  private updateAmbient(dt: number, t: number): void {
    // wind-blown sand drifts past the camera
    const N = this.windData.length / 3;
    const wx = 9 + Math.sin(t * 0.3) * 4;
    const wz = 3 + Math.cos(t * 0.21) * 2;
    const cx = this.camera.position.x;
    const cy = this.camera.position.y;
    const cz = this.camera.position.z;
    for (let i = 0; i < N; i++) {
      let x = this.windData[i * 3] + wx * dt * (0.6 + (i % 5) * 0.2);
      let y = this.windData[i * 3 + 1] + Math.sin(t * 2 + i) * dt * 1.5;
      let z = this.windData[i * 3 + 2] + wz * dt;
      if (x - cx > 70) x -= 140;
      if (x - cx < -70) x += 140;
      if (z - cz > 70) z -= 140;
      if (z - cz < -70) z += 140;
      if (y > cy + 22) y = cy - 4;
      if (y < cy - 8) y = cy + 18;
      this.windData[i * 3] = x;
      this.windData[i * 3 + 1] = y;
      this.windData[i * 3 + 2] = z;
    }
    (this.windPoints.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // spice twinkle
    const sm = this.spicePoints.material as THREE.PointsMaterial;
    sm.opacity = 0.45 + Math.abs(Math.sin(t * 2.3)) * 0.45;
    sm.size = 0.3 + Math.abs(Math.sin(t * 1.7)) * 0.18;

    // audio ambience
    const wormDist = this.worm.state !== "idle" ? this.worm.distanceTo(this.pos.x, this.pos.z) : Infinity;
    let nearestThumper: number | null = null;
    for (const th of this.thumpers) {
      const d = Math.hypot(th.x - this.pos.x, th.z - this.pos.z);
      nearestThumper = nearestThumper === null ? d : Math.min(nearestThumper, d);
    }
    this.audio.update(dt, t, wormDist, this.worm.state !== "idle", nearestThumper);
  }

  // ---------------------------------------------------------------- hud

  private makeHud(): HudState {
    const wormActive = this.worm.state !== "idle";
    return {
      phase: this.phase,
      vibration: this.vibration,
      stepLabel: this.stepLabelTtl > 0 ? this.hud?.stepLabel ?? null : null,
      wormState: this.worm.state,
      wormDistance: wormActive ? this.worm.distanceTo(this.pos.x, this.pos.z) : null,
      distanceToGoal: Math.max(0, this.pos.z - (GOAL_Z + 5)),
      thumpers: this.thumperInventory,
      onRock: isOnRock(this.pos.x, this.pos.z),
      onSpice: isOnSpice(this.pos.x, this.pos.z),
      message: this.message,
      messageTone: this.messageTone,
      stats: {
        time: this.phase === "intro" ? 0 : this.elapsed - this.startTime,
        steps: this.steps,
        sandwalkSteps: this.sandwalkSteps,
        wormsCalled: this.worm.timesCalled,
        thumpersUsed: this.thumpersUsed,
      },
    };
  }

  // ---------------------------------------------------------------- tests

  private installTestHooks(): void {
    const api = {
      getState: () => ({
        phase: this.phase,
        x: this.pos.x,
        z: this.pos.z,
        vibration: this.vibration,
        worm: {
          state: this.worm.state,
          x: this.worm.pos.x,
          z: this.worm.pos.y,
          dist: this.worm.state !== "idle" ? this.worm.distanceTo(this.pos.x, this.pos.z) : null,
          timesCalled: this.worm.timesCalled,
        },
        thumpers: this.thumperInventory,
        activeThumpers: this.thumpers.length,
        onRock: isOnRock(this.pos.x, this.pos.z),
        steps: this.steps,
        sandwalkSteps: this.sandwalkSteps,
        message: this.message,
      }),
      start: () => this.start(),
      restart: () => this.restart(),
      teleport: (x: number, z: number) => {
        this.pos.set(x, 0, z);
        this.vel.set(0, 0, 0);
      },
      setYaw: (y: number) => {
        this.yaw = y;
      },
      setVibration: (v: number) => {
        this.vibration = clamp(v, 0, 1);
      },
      plantThumper: () => this.plantThumper(),
    };
    (window as unknown as Record<string, unknown>).__DUNE__ = api;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.onResize);
    this.renderer.domElement.removeEventListener("click", this.onCanvasClick);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.audio.dispose();
    this.renderer.dispose();
    delete (window as unknown as Record<string, unknown>).__DUNE__;
  }
}
