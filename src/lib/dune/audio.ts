// Fully procedural WebAudio soundscape: desert wind, footfalls on sand,
// drum-sand booms, the thumper's "lump... lump", and the rising rumble and
// sand-hiss of an approaching Shai-Hulud.

import { clamp } from "./noise";

export class DuneAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  // continuous layers
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private hissGain: GainNode | null = null;
  private heartTimer = 0;
  private thumperTimer = 0;
  private flapNodes: { src: AudioBufferSourceNode; lfo: OscillatorNode; out: GainNode } | null = null;

  get ready(): boolean {
    return this.ctx !== null;
  }

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(ctx.destination);

    // shared noise source buffer (2s of white noise)
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    // --- wind: looped noise through a wandering bandpass
    const wind = ctx.createBufferSource();
    wind.buffer = buf;
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.frequency.value = 480;
    wf.Q.value = 0.6;
    const wg = ctx.createGain();
    wg.gain.value = 0.05;
    wind.connect(wf).connect(wg).connect(this.master);
    wind.start();
    this.windGain = wg;
    this.windFilter = wf;

    // --- worm rumble: looped noise through a deep lowpass
    const rum = ctx.createBufferSource();
    rum.buffer = buf;
    rum.loop = true;
    rum.playbackRate.value = 0.3;
    const rf = ctx.createBiquadFilter();
    rf.type = "lowpass";
    rf.frequency.value = 70;
    const rg = ctx.createGain();
    rg.gain.value = 0;
    rum.connect(rf).connect(rg).connect(this.master);
    rum.start();
    this.rumbleGain = rg;

    // --- sand hiss of the moving mound
    const hiss = ctx.createBufferSource();
    hiss.buffer = buf;
    hiss.loop = true;
    const hf = ctx.createBiquadFilter();
    hf.type = "highpass";
    hf.frequency.value = 3200;
    const hg = ctx.createGain();
    hg.gain.value = 0;
    hiss.connect(hf).connect(hg).connect(this.master);
    hiss.start();
    this.hissGain = hg;
  }

  /** Per-frame ambience update. wormDist = Infinity when no worm. */
  update(dt: number, t: number, wormDist: number, wormActive: boolean, thumperDist: number | null): void {
    const ctx = this.ctx;
    if (!ctx || !this.windGain || !this.windFilter) return;
    // gusting wind
    const gust = 0.045 + 0.035 * (0.5 + 0.5 * Math.sin(t * 0.31) * Math.sin(t * 0.137 + 2));
    this.windGain.gain.setTargetAtTime(gust, ctx.currentTime, 0.4);
    this.windFilter.frequency.setTargetAtTime(380 + 240 * Math.sin(t * 0.21), ctx.currentTime, 0.5);

    // worm proximity layers
    const prox = wormActive ? clamp(1 - wormDist / 480, 0, 1) : 0;
    this.rumbleGain?.gain.setTargetAtTime(prox * prox * 0.65, ctx.currentTime, 0.25);
    this.hissGain?.gain.setTargetAtTime(prox > 0.12 ? prox * 0.09 : 0, ctx.currentTime, 0.3);

    // heartbeat under extreme danger
    if (wormActive && wormDist < 90) {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = clamp(wormDist / 90, 0.35, 1) * 0.9;
        this.thump(48, 0.16, 0.09);
        setTimeout(() => this.thump(44, 0.12, 0.07), 180);
      }
    }

    // thumper drumming, attenuated by distance
    if (thumperDist !== null) {
      this.thumperTimer -= dt;
      if (this.thumperTimer <= 0) {
        this.thumperTimer = 0.72;
        const vol = clamp(1 - thumperDist / 320, 0.05, 1) * 0.5;
        this.thump(72, 0.3, vol);
      }
    }
  }

  private thump(freq: number, dur: number, vol: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.45), ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(this.master);
    o.start();
    o.stop(ctx.currentTime + dur + 0.05);
  }

  private noiseBurst(dur: number, vol: number, filterFreq: number, type: BiquadFilterType = "lowpass"): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.7 + Math.random() * 0.5;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(ctx.currentTime, Math.random() * 1.2, dur + 0.05);
  }

  /** Ornithopter wing-beat: noise pulsed by a low-frequency oscillator. */
  setFlight(active: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noiseBuf) return;
    if (active && !this.flapNodes) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 180;
      bp.Q.value = 1.1;
      const mod = ctx.createGain();
      mod.gain.value = 0.12; // base whoosh
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 5.2; // wing beats per second
      const depth = ctx.createGain();
      depth.gain.value = 0.1;
      lfo.connect(depth).connect(mod.gain);
      const out = ctx.createGain();
      out.gain.value = 0.0001;
      src.connect(bp).connect(mod).connect(out).connect(this.master);
      src.start();
      lfo.start();
      out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
      this.flapNodes = { src, lfo, out };
    } else if (!active && this.flapNodes) {
      const { src, lfo, out } = this.flapNodes;
      this.flapNodes = null;
      out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      setTimeout(() => {
        try {
          src.stop();
          lfo.stop();
        } catch {
          // already stopped
        }
      }, 900);
    }
  }

  footstep(kind: "step" | "walk" | "run" | "drag"): void {
    if (!this.ctx) return;
    if (kind === "drag") this.noiseBurst(0.22, 0.07, 900);
    else if (kind === "run") this.noiseBurst(0.1, 0.16, 1400);
    else this.noiseBurst(0.12, 0.1, 1100);
  }

  drumBoom(): void {
    this.thump(55, 0.9, 0.9);
    this.noiseBurst(0.7, 0.3, 240);
    setTimeout(() => this.thump(42, 0.8, 0.5), 240);
  }

  wormBreach(): void {
    this.thump(38, 1.4, 1.0);
    this.noiseBurst(1.4, 0.5, 500);
    this.noiseBurst(1.0, 0.25, 4000, "highpass");
  }

  plantThumper(): void {
    this.noiseBurst(0.18, 0.2, 800);
  }

  win(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    [220, 277, 330, 440].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.18 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 1.6);
      o.connect(g).connect(this.master!);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 1.8);
    });
  }

  death(): void {
    this.wormBreach();
    setTimeout(() => this.thump(30, 2.0, 0.9), 300);
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
  }
}
