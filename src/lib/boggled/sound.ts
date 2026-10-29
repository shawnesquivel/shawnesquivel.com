// All sounds are synthesized with Web Audio so there are no assets to load.
// iOS: the context only starts inside a user gesture, so call unlock() from tap handlers.

type Wave = OscillatorType;

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];
const MUTE_KEY = "boggled:muted";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  constructor() {
    if (typeof window !== "undefined") this.muted = localStorage.getItem(MUTE_KEY) === "1";
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  }

  unlock() {
    if (typeof window === "undefined") return;
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    // Lets Web Audio play while the iPhone ringer switch is on silent (Safari 16.4+).
    if (nav.audioSession) nav.audioSession.type = "playback";
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      const comp = this.ctx.createDynamicsCompressor();
      comp.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(comp);
    }
    if (this.ctx.state !== "running") void this.ctx.resume();
  }

  private tone(freq: number, start: number, dur: number, opts: { wave?: Wave; vol?: number; slideTo?: number } = {}) {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = opts.wave ?? "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    const vol = opts.vol ?? 0.3;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private note(semitones: number, base = 523.25) {
    return base * Math.pow(2, semitones / 12);
  }

  tile(index: number) {
    const step = PENTATONIC[Math.min(index, PENTATONIC.length - 1)];
    this.tone(this.note(step), 0, 0.12, { wave: "triangle", vol: 0.22 });
  }

  valid(length: number) {
    const notes = Math.min(2 + Math.max(0, length - 3), 6);
    for (let i = 0; i < notes; i++) {
      this.tone(this.note(PENTATONIC[i + 2], 659.25), i * 0.055, 0.22, { wave: "sine", vol: 0.25 });
      this.tone(this.note(PENTATONIC[i + 2] + 12, 659.25), i * 0.055, 0.12, { wave: "triangle", vol: 0.06 });
    }
  }

  duplicate() {
    this.tone(330, 0, 0.09, { wave: "square", vol: 0.08 });
    this.tone(330, 0.11, 0.09, { wave: "square", vol: 0.08 });
  }

  invalid() {
    this.tone(220, 0, 0.18, { wave: "sawtooth", vol: 0.1, slideTo: 140 });
  }

  tick(urgent: boolean) {
    this.tone(urgent ? 1320 : 880, 0, 0.05, { wave: "square", vol: urgent ? 0.1 : 0.06 });
  }

  countdown(final: boolean) {
    this.tone(final ? 1046.5 : 523.25, 0, final ? 0.4 : 0.15, { wave: "triangle", vol: 0.3 });
  }

  roundEnd() {
    this.tone(784, 0, 0.18, { wave: "square", vol: 0.12 });
    this.tone(523.25, 0.18, 0.18, { wave: "square", vol: 0.12 });
    this.tone(392, 0.36, 0.5, { wave: "square", vol: 0.12 });
  }

  reveal(step: number, unique: boolean) {
    const f = this.note(PENTATONIC[step % PENTATONIC.length], 392);
    this.tone(f, 0, 0.1, { wave: "triangle", vol: 0.2 });
    if (unique) this.tone(f * 2, 0.05, 0.16, { wave: "sine", vol: 0.15 });
  }

  bonus() {
    [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.note(s, 784), i * 0.06, 0.25, { wave: "sine", vol: 0.2 }));
  }

  fanfare() {
    const seq: [number, number, number][] = [
      [0, 0, 0.14], [4, 0.14, 0.14], [7, 0.28, 0.14], [12, 0.42, 0.5],
      [7, 0.62, 0.12], [12, 0.74, 0.7],
    ];
    for (const [s, at, dur] of seq) {
      this.tone(this.note(s, 392), at, dur, { wave: "square", vol: 0.1 });
      this.tone(this.note(s + 12, 392), at, dur, { wave: "triangle", vol: 0.12 });
    }
  }

  private noise(start: number, dur: number, vol: number, from: number, to: number) {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + start;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
  }

  bombEarned() {
    [0, 7, 12].forEach((s, i) => this.tone(this.note(s, 440), i * 0.07, 0.16, { wave: "square", vol: 0.09 }));
  }

  bombLaunch() {
    this.tone(300, 0, 0.35, { wave: "sawtooth", vol: 0.1, slideTo: 1400 });
  }

  bombHit() {
    this.tone(120, 0, 0.5, { wave: "sine", vol: 0.5, slideTo: 40 });
    this.noise(0, 0.7, 0.6, 3000, 120);
  }

  brag() {
    this.tone(this.note(0, 392), 0, 0.1, { wave: "triangle", vol: 0.15 });
    this.tone(this.note(5, 392), 0.09, 0.2, { wave: "triangle", vol: 0.15 });
  }

  pop() {
    this.tone(500, 0, 0.08, { wave: "sine", vol: 0.2, slideTo: 1100 });
  }

  join() {
    this.tone(660, 0, 0.1, { wave: "sine", vol: 0.2 });
    this.tone(990, 0.08, 0.14, { wave: "sine", vol: 0.2 });
  }
}

export const sound = new SoundEngine();
