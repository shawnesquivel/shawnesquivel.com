import { findPath, generateBoard, solve, type Board } from "./board";
import { serverNow } from "./clock";
import type { BoardSize } from "./dice";
import type { Dictionary } from "./dictionary";
import { randomId } from "./rng";
import { DANGER_BOOST, scoreRound, wordPoints, type RoundResult } from "./scoring";
import { seriesStatus, type SeriesRecords, type SeriesRef } from "./series";
import { createTransport, type ConnectionStatus, type Envelope, type Member, type Transport } from "./transport";

export type Settings = {
  size: BoardSize;
  duration: number;
  minLength: 3 | 4;
  longestBonus: boolean;
  // Danger mode: attacks, shields, the danger-zone boost and the battle log.
  danger: boolean;
  // 0 = single rounds, otherwise best-of-N
  series: 0 | 3 | 5;
};

export const DEFAULT_SETTINGS: Settings = { size: 4, duration: 120, minLength: 3, longestBonus: true, danger: true, series: 0 };

export type Round = {
  id: string;
  board: Board;
  startsAt: number;
  endsAt: number;
  settings: Settings;
  players: Member[];
  series?: SeriesRef;
};

export type Phase = "lobby" | "countdown" | "playing" | "collecting" | "results";

export type RoundOutcome = {
  roundId: string;
  result: RoundResult;
  missed: string[];
  allWords: number;
};

export type TallyEntry = { points: number; wins: number; series: number; name: string; emoji: string };
export type Tally = Record<string, TallyEntry>;

export type Weapon = "bomb" | "flip";
export type Powers = { bomb: number; flip: number; shield: number };
export type FeedEntry = { id: string; at: number; from: string; to: string; weapon: Weapon; blocked: boolean };
export type Toast = {
  id: string;
  text: string;
  kind: "earned" | "launch" | "hit" | "flip-hit" | "shield" | "blocked" | "brag" | "halftime" | "danger" | "info";
  at: number;
};
export type Reaction = { id: string; emoji: string; from: string; at: number };

export type RoomState = {
  room: string | null;
  me: Member;
  status: ConnectionStatus;
  roster: Member[];
  hostId: string;
  settings: Settings;
  phase: Phase;
  round: Round | null;
  myWords: string[];
  progress: Record<string, number>;
  finals: Record<string, string[]>;
  outcome: RoundOutcome | null;
  tally: Tally;
  roundsPlayed: number;
  powers: Powers;
  // tile index -> Date.now() when the effect lifts
  blocked: Record<number, number>;
  flipped: Record<number, number>;
  toasts: Toast[];
  reactions: Reaction[];
  feed: FeedEntry[];
  // words each player found in the danger zone
  lates: Record<string, string[]>;
  myLate: string[];
  livePoints: Record<string, number>;
  halftime: boolean;
  dangerZone: boolean;
  seriesRecords: SeriesRecords;
};

const COUNTDOWN_MS = 3500;
const COLLECT_TIMEOUT_MS = 6000;
const LATE_FINAL_WINDOW_MS = 120_000;
const TIMES_UP_MIN_MS = 1500;
export const BOMB_WORD_LENGTH = 6;
export const BOMB_MS = 5000;
export const FLIP_MS = 6000;
export const MAX_ATTACKS = 3;
export const SHIELD_COMBO = 3;
export const SHIELD_WINDOW_MS = 10_000;
export const DANGER_ZONE_MS = 15_000;
const NO_POWERS: Powers = { bomb: 0, flip: 0, shield: 0 };
const BRAG_LENGTH = 7;
const TOAST_MS = 2600;
const REACTION_MS = 3200;

export function computeHost(roster: Member[], fallback: string): string {
  const sorted = [...roster].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  return sorted[0]?.id ?? fallback;
}

export class RoomController {
  private state: RoomState;
  private listeners = new Set<() => void>();
  private transport: Transport;
  private dict: Dictionary | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private lastFinalSent = 0;
  private roundContributions = new Map<string, Record<string, { points: number; wins: number; series: number }>>();
  private earned = 0;
  private recentWords: number[] = [];
  private startResends: ReturnType<typeof setTimeout>[] = [];

  constructor(room: string | null, me: Member) {
    this.transport = createTransport(room);
    this.state = {
      room,
      me,
      status: "connecting",
      roster: [me],
      hostId: me.id,
      settings: DEFAULT_SETTINGS,
      phase: "lobby",
      round: null,
      myWords: [],
      progress: {},
      finals: {},
      outcome: null,
      tally: {},
      roundsPlayed: 0,
      powers: NO_POWERS,
      blocked: {},
      flipped: {},
      toasts: [],
      reactions: [],
      feed: [],
      lates: {},
      myLate: [],
      livePoints: {},
      halftime: false,
      dangerZone: false,
      seriesRecords: {},
    };
  }

  get transportKind() {
    return this.transport.kind;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = () => this.state;

  private set(patch: Partial<RoomState>) {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn();
  }

  get isHost() {
    return this.state.hostId === this.state.me.id;
  }

  setDictionary(dict: Dictionary) {
    this.dict = dict;
  }

  start() {
    const t = this.transport;
    t.onStatus = (status) => {
      this.set({ status });
      if (status === "connected") this.send({ type: "hello" });
    };
    t.onRoster = (roster) => {
      const withMe = roster.some((m) => m.id === this.state.me.id) ? roster : [...roster, this.state.me];
      const hostId = computeHost(withMe, this.state.me.id);
      this.set({ roster: withMe, hostId });
    };
    t.onMessage = (msg) => this.handle(msg);
    t.connect(this.state.me);
    this.ticker = setInterval(() => this.tick(), 200);
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", this.onVisibility);
  }

  stop() {
    if (this.ticker) clearInterval(this.ticker);
    for (const t of this.startResends) clearTimeout(t);
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", this.onVisibility);
    this.transport.close();
  }

  private onVisibility = () => {
    if (document.visibilityState !== "visible") return;
    this.transport.reconnect();
    this.send({ type: "hello" });
  };

  private send(msg: Omit<Envelope, "from">) {
    this.transport.send({ ...msg, from: this.state.me.id } as Envelope);
  }

  // ---- host actions ----

  updateSettings(patch: Partial<Settings>) {
    if (!this.isHost) return;
    const settings = { ...this.state.settings, ...patch };
    this.set({ settings });
    this.send({ type: "settings", settings });
  }

  startRound() {
    if (!this.isHost) return;
    const settings = this.state.settings;
    const id = randomId(10);
    const board = generateBoard(settings.size, id, this.dict ?? undefined);
    const startsAt = serverNow() + COUNTDOWN_MS;
    const round: Round = {
      id,
      board,
      startsAt,
      endsAt: startsAt + settings.duration * 1000,
      settings,
      players: this.state.roster,
      series: this.nextSeries(settings),
    };
    this.beginRound(round);
    // Broadcast is at-most-once; resending an idempotent start covers a dropped packet.
    this.send({ type: "start", round });
    for (const t of this.startResends) clearTimeout(t);
    this.startResends = [800, 2000].map((ms) => setTimeout(() => this.send({ type: "start", round }), ms));
  }

  // Solo only: there's nobody to wait for, so the round can just end now.
  endEarly() {
    const { round, phase } = this.state;
    if (!round || round.players.length !== 1 || (phase !== "playing" && phase !== "countdown")) return;
    const now = serverNow();
    this.set({ round: { ...round, startsAt: Math.min(round.startsAt, now), endsAt: now } });
    this.tick();
  }

  private nextSeries(settings: Settings): SeriesRef | undefined {
    if (!settings.series) return undefined;
    const prev = this.state.round?.series;
    if (prev && prev.length === settings.series && !seriesStatus(this.state.seriesRecords, prev).champion) {
      return { ...prev, game: prev.game + 1 };
    }
    return { id: randomId(8), game: 1, length: settings.series };
  }

  backToLobby() {
    if (!this.isHost) return;
    this.set({ phase: "lobby" });
    this.send({ type: "lobby" });
  }

  // ---- player actions ----

  addWord(word: string) {
    const { round, myWords, me } = this.state;
    if (!round || this.state.phase !== "playing" || myWords.includes(word)) return;
    const next = [word, ...myWords];
    const points = next.reduce((sum, w) => sum + wordPoints(w), 0);
    const late = round.settings.danger && serverNow() >= round.endsAt - DANGER_ZONE_MS;
    const myLate = late ? [word, ...this.state.myLate] : this.state.myLate;
    this.set({
      myWords: next,
      myLate,
      progress: { ...this.state.progress, [me.id]: next.length },
      livePoints: { ...this.state.livePoints, [me.id]: points },
    });
    this.persistWords(round.id, next, myLate);
    this.send({ type: "progress", roundId: round.id, count: next.length, points });

    const multiplayer = round.players.length > 1;
    if (multiplayer && round.settings.danger) {
      const powers = { ...this.state.powers };
      if (word.length >= BOMB_WORD_LENGTH) {
        // Alternate so both weapons show up: bomb, flip, bomb, ...
        const weapon: Weapon = this.earned % 2 === 0 ? "bomb" : "flip";
        this.earned++;
        if (powers[weapon] < MAX_ATTACKS) {
          powers[weapon]++;
          this.toast(weapon === "bomb" ? "💣 Bomb earned! Tap it to block a rival's letter" : "🙃 Flip earned! Tap it to flip 2 of a rival's letters", "earned");
        }
      }
      const now = Date.now();
      this.recentWords = [...this.recentWords, now].filter((t) => now - t <= SHIELD_WINDOW_MS);
      if (!powers.shield && this.recentWords.length >= SHIELD_COMBO) {
        powers.shield = 1;
        this.recentWords = [];
      }
      this.set({ powers });
    }
    if (multiplayer && word.length >= BRAG_LENGTH) this.send({ type: "brag", roundId: round.id, length: word.length });
  }

  attackTargets(): Member[] {
    const { round, roster, me } = this.state;
    if (!round) return [];
    const present = new Set(roster.map((m) => m.id));
    return round.players.filter((p) => p.id !== me.id && present.has(p.id));
  }

  attack(weapon: Weapon): Member | null {
    const { round, powers, phase } = this.state;
    if (!round || phase !== "playing" || powers[weapon] <= 0) return null;
    const targets = this.attackTargets();
    if (!targets.length) return null;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const n = round.board.tiles.length;
    const tiles = [Math.floor(Math.random() * n)];
    if (weapon === "flip") {
      let second = Math.floor(Math.random() * (n - 1));
      if (second >= tiles[0]) second++;
      tiles.push(second);
    }
    const id = randomId(8);
    this.send({ type: "attack", roundId: round.id, id, weapon, target: target.id, tiles });
    this.logAttack(id, this.state.me.id, target.id, weapon);
    this.set({ powers: { ...powers, [weapon]: powers[weapon] - 1 } });
    this.toast(weapon === "bomb" ? `💥 Bombed ${target.name}!` : `🙃 Flipped ${target.name}'s letters!`, "launch");
    return target;
  }

  react(emoji: string) {
    this.addReaction(emoji, this.state.me.id);
    this.send({ type: "react", emoji });
  }

  dismissToast(id: string) {
    this.set({ toasts: this.state.toasts.filter((t) => t.id !== id) });
  }

  private toast(text: string, kind: Toast["kind"]) {
    this.set({ toasts: [...this.state.toasts.slice(-2), { id: randomId(6), text, kind, at: Date.now() }] });
  }

  private addReaction(emoji: string, from: string) {
    this.set({ reactions: [...this.state.reactions.slice(-11), { id: randomId(6), emoji, from, at: Date.now() }] });
  }

  private logAttack(id: string, from: string, to: string, weapon: Weapon) {
    const round = this.state.round;
    if (!round || this.state.feed.some((f) => f.id === id)) return;
    const at = Math.max(0, Math.round((serverNow() - round.startsAt) / 1000));
    this.set({ feed: [...this.state.feed, { id, at, from, to, weapon, blocked: false }] });
  }

  private memberName(id: string) {
    return this.state.roster.find((m) => m.id === id)?.name ?? this.state.round?.players.find((m) => m.id === id)?.name ?? "Someone";
  }

  // ---- internals ----

  private persistWords(roundId: string, words: string[], late: string[]) {
    try {
      sessionStorage.setItem(`boggled:words:${roundId}`, JSON.stringify(words));
      sessionStorage.setItem(`boggled:late:${roundId}`, JSON.stringify(late));
    } catch {}
  }

  private restore(key: string, roundId: string): string[] {
    try {
      return JSON.parse(sessionStorage.getItem(`boggled:${key}:${roundId}`) ?? "[]");
    } catch {
      return [];
    }
  }

  private beginRound(round: Round) {
    const myWords = this.restore("words", round.id);
    this.earned = 0;
    this.recentWords = [];
    this.set({
      round,
      settings: round.settings,
      myWords,
      myLate: this.restore("late", round.id),
      progress: { [this.state.me.id]: myWords.length },
      livePoints: { [this.state.me.id]: myWords.reduce((sum, w) => sum + wordPoints(w), 0) },
      finals: {},
      lates: {},
      outcome: null,
      powers: NO_POWERS,
      blocked: {},
      flipped: {},
      toasts: [],
      feed: [],
      halftime: false,
      dangerZone: false,
      phase: serverNow() < round.startsAt ? "countdown" : "playing",
    });
    this.tick();
  }

  private isParticipant(round: Round) {
    return round.players.some((p) => p.id === this.state.me.id);
  }

  private handle(msg: Envelope) {
    const s = this.state;
    switch (msg.type) {
      case "hello":
        if (this.isHost) {
          this.send({
            type: "state",
            settings: s.settings,
            round: s.round,
            phase: s.phase,
            finals: s.finals,
            lates: s.lates,
            tally: s.tally,
            roundsPlayed: s.roundsPlayed,
            seriesRecords: s.seriesRecords,
          });
        }
        if (s.round && (s.phase === "collecting" || s.phase === "results") && this.isParticipant(s.round)) {
          this.sendFinal(true);
        }
        break;
      case "state": {
        if (msg.from !== s.hostId) break;
        const round = msg.round as Round | null;
        const patch: Partial<RoomState> = { settings: msg.settings as Settings };
        if (Object.keys(s.tally).length === 0) {
          patch.tally = (msg.tally as Tally) ?? {};
          patch.roundsPlayed = (msg.roundsPlayed as number) ?? 0;
          patch.seriesRecords = (msg.seriesRecords as SeriesRecords) ?? {};
        }
        this.set(patch);
        if (round && round.id !== s.round?.id) {
          this.beginRound(round);
          this.set({ finals: { ...(msg.finals as Record<string, string[]>) }, lates: { ...(msg.lates as Record<string, string[]>) } });
        } else if (!round || msg.phase === "lobby") {
          if (s.phase === "results" || s.phase === "lobby") this.set({ phase: msg.phase === "lobby" ? "lobby" : s.phase });
        }
        break;
      }
      case "settings":
        if (msg.from === s.hostId) this.set({ settings: msg.settings as Settings });
        break;
      case "start": {
        const round = msg.round as Round;
        if (round.id !== s.round?.id) this.beginRound(round);
        break;
      }
      case "lobby":
        if (msg.from === s.hostId) this.set({ phase: "lobby" });
        break;
      case "progress":
        if (msg.roundId === s.round?.id) {
          this.set({
            progress: { ...s.progress, [msg.from]: msg.count as number },
            livePoints: { ...s.livePoints, [msg.from]: (msg.points as number) ?? 0 },
          });
        }
        break;
      case "attack": {
        if (msg.roundId !== s.round?.id) break;
        const weapon = msg.weapon as Weapon;
        const target = msg.target as string;
        const attacker = this.memberName(msg.from);
        this.logAttack(msg.id as string, msg.from, target, weapon);
        if (target !== s.me.id) {
          const verb = weapon === "bomb" ? "💣 bombed" : "🙃 flipped";
          this.toast(`${attacker} ${verb} ${this.memberName(target)}`, "info");
          break;
        }
        if (s.phase !== "playing") break;
        if (s.powers.shield > 0) {
          this.set({ powers: { ...s.powers, shield: 0 } });
          this.markBlocked(msg.id as string);
          this.send({ type: "shielded", roundId: s.round!.id, attackId: msg.id, attacker: msg.from, weapon });
          this.toast(`🛡️ Your shield blocked ${attacker}'s ${weapon}!`, "shield");
          break;
        }
        const tiles = msg.tiles as number[];
        if (weapon === "bomb") {
          this.set({ blocked: { ...s.blocked, [tiles[0]]: Date.now() + BOMB_MS } });
          this.toast(`💣 ${attacker} bombed your board!`, "hit");
        } else {
          const until = Date.now() + FLIP_MS;
          this.set({ flipped: { ...s.flipped, ...Object.fromEntries(tiles.map((t) => [t, until])) } });
          this.toast(`🙃 ${attacker} flipped your letters!`, "flip-hit");
        }
        break;
      }
      case "shielded":
        if (msg.roundId !== s.round?.id) break;
        this.markBlocked(msg.attackId as string);
        if (msg.attacker === s.me.id) this.toast(`🛡️ ${this.memberName(msg.from)}'s shield blocked your ${msg.weapon as string}!`, "blocked");
        break;
      case "brag":
        if (msg.roundId === s.round?.id && s.phase === "playing") {
          const n = msg.length as number;
          this.toast(`🔥 ${this.memberName(msg.from)} found ${n === 8 || n === 11 || n === 18 ? "an" : "a"} ${n}-letter word!`, "brag");
        }
        break;
      case "react":
        this.addReaction(String(msg.emoji).slice(0, 16), msg.from);
        break;
      case "final": {
        if (msg.roundId !== s.round?.id) break;
        const words = msg.words as string[];
        const known = s.finals[msg.from];
        if (!known || known.length !== words.length) {
          this.set({
            finals: { ...s.finals, [msg.from]: words },
            lates: { ...s.lates, [msg.from]: (msg.late as string[]) ?? [] },
            progress: { ...s.progress, [msg.from]: words.length },
          });
          if (s.phase === "results") this.computeOutcome();
        }
        const have = (msg.have as string[]) ?? [];
        if (!have.includes(s.me.id) && (s.phase === "collecting" || s.phase === "results")) this.sendFinal();
        break;
      }
    }
  }

  private sendFinal(force = false) {
    const { round, myWords, myLate, finals, me } = this.state;
    if (!round || !this.isParticipant(round)) return;
    const now = Date.now();
    if (!force && now - this.lastFinalSent < 400) return;
    this.lastFinalSent = now;
    this.send({ type: "final", roundId: round.id, words: myWords, late: myLate, have: Object.keys(finals).concat(me.id) });
  }

  private prune() {
    const now = Date.now();
    const s = this.state;
    const toasts = s.toasts.filter((t) => now - t.at < TOAST_MS);
    const reactions = s.reactions.filter((r) => now - r.at < REACTION_MS);
    const blockedEntries = Object.entries(s.blocked).filter(([, until]) => until > now);
    const flippedEntries = Object.entries(s.flipped).filter(([, until]) => until > now);
    const patch: Partial<RoomState> = {};
    if (flippedEntries.length !== Object.keys(s.flipped).length) patch.flipped = Object.fromEntries(flippedEntries);
    if (toasts.length !== s.toasts.length) patch.toasts = toasts;
    if (reactions.length !== s.reactions.length) patch.reactions = reactions;
    if (blockedEntries.length !== Object.keys(s.blocked).length) patch.blocked = Object.fromEntries(blockedEntries);
    if (Object.keys(patch).length) this.set(patch);
  }

  private tick() {
    this.prune();
    const s = this.state;
    const round = s.round;
    if (!round || s.phase === "lobby") return;
    const now = serverNow();

    if (s.phase === "results") {
      // Someone's list missed the cutoff (phone asleep, dropped packet): keep asking, results update when it lands.
      const present = new Set(s.roster.map((m) => m.id));
      const missing = round.players.some((p) => present.has(p.id) && !s.finals[p.id]);
      if (missing && now < round.endsAt + LATE_FINAL_WINDOW_MS && Date.now() - this.lastFinalSent >= 2000) {
        this.sendFinal(true);
      }
      return;
    }

    if (s.phase === "countdown" && now >= round.startsAt) this.set({ phase: "playing" });
    if (this.state.phase === "playing" && now < round.endsAt) this.milestones(round, now);

    if ((s.phase === "countdown" || s.phase === "playing") && now >= round.endsAt) {
      const mine = this.isParticipant(round);
      const finals = mine ? { ...s.finals, [s.me.id]: s.myWords } : s.finals;
      const lates = mine ? { ...s.lates, [s.me.id]: s.myLate } : s.lates;
      this.set({ phase: "collecting", finals, lates });
      this.sendFinal(true);
    }

    if (this.state.phase === "collecting") {
      if (Date.now() - this.lastFinalSent >= 1000) this.sendFinal(true);
      const present = new Set(this.state.roster.map((m) => m.id));
      const waiting = round.players.filter((p) => present.has(p.id) && !this.state.finals[p.id]);
      const allIn = waiting.length === 0 && now >= round.endsAt + TIMES_UP_MIN_MS;
      if (allIn || now >= round.endsAt + COLLECT_TIMEOUT_MS) {
        this.set({ phase: "results" });
        this.computeOutcome();
      }
    }
  }

  private milestones(round: Round, now: number) {
    const s = this.state;
    const multiplayer = round.players.length > 1;
    if (!s.halftime && now >= round.startsAt + (round.endsAt - round.startsAt) / 2) {
      this.set({ halftime: true });
      if (multiplayer) {
        const line = round.players
          .map((p) => `${p.emoji} ${p.id === s.me.id ? "You" : p.name} ${s.livePoints[p.id] ?? 0}`)
          .join("  ·  ");
        this.toast(`⏱ HALFTIME  ${line}`, "halftime");
        const mine = s.livePoints[s.me.id] ?? 0;
        const top = Math.max(...round.players.map((p) => s.livePoints[p.id] ?? 0));
        if (round.settings.danger && this.isParticipant(round) && mine < top && s.powers.bomb < MAX_ATTACKS) {
          this.set({ powers: { ...this.state.powers, bomb: this.state.powers.bomb + 1 } });
          this.toast("😤 Behind at halftime: free 💣", "earned");
        }
      }
    }
    if (round.settings.danger && !this.state.dangerZone && now >= round.endsAt - DANGER_ZONE_MS) {
      this.set({ dangerZone: true });
      this.toast(`☠️ DANGER ZONE: +${Math.round(DANGER_BOOST * 100)}% on every word`, "danger");
    }
  }

  private markBlocked(attackId: string) {
    this.set({ feed: this.state.feed.map((f) => (f.id === attackId ? { ...f, blocked: true } : f)) });
  }

  private computeOutcome() {
    const { round, finals } = this.state;
    if (!round) return;
    const dict = this.dict;
    const minLength = round.settings.minLength;
    const isValid = (w: string) =>
      w.length >= minLength && (!dict || dict.has(w)) && findPath(round.board, w) !== null;
    const lates = this.state.lates;
    const players = round.players.filter((p) => finals[p.id]).map((p) => ({ id: p.id, words: finals[p.id], late: lates[p.id] }));
    const result = scoreRound(players, {
      longestWordBonus: round.settings.longestBonus,
      isValid,
      dangerBoost: round.settings.danger ? DANGER_BOOST : 0,
    });

    let missed: string[] = [];
    let allWords = 0;
    if (dict) {
      const found = new Set(players.flatMap((p) => p.words));
      const all = [...solve(round.board, dict, minLength).keys()];
      allWords = all.length;
      missed = all.filter((w) => !found.has(w)).sort((a, b) => b.length - a.length || a.localeCompare(b)).slice(0, 15);
    }

    const multiplayer = result.players.length > 1;
    let seriesRecords = this.state.seriesRecords;
    let champion: string | null = null;
    if (multiplayer && round.series) {
      const winners = result.players.filter((p) => p.rank === 1).map((p) => p.id);
      seriesRecords = { ...seriesRecords, [round.id]: { seriesId: round.series.id, winners } };
      champion = seriesStatus(seriesRecords, round.series).champion;
    }
    const contribution: Record<string, { points: number; wins: number; series: number }> = {};
    if (multiplayer) {
      for (const p of result.players) {
        contribution[p.id] = { points: p.total, wins: p.rank === 1 ? 1 : 0, series: champion === p.id ? 1 : 0 };
      }
    }
    const tally: Tally = structuredClone(this.state.tally);
    const firstTime = !this.roundContributions.has(round.id);
    const prev = this.roundContributions.get(round.id) ?? {};
    for (const [id, c] of Object.entries(prev)) {
      if (tally[id]) {
        tally[id] = { ...tally[id], points: tally[id].points - c.points, wins: tally[id].wins - c.wins, series: tally[id].series - c.series };
      }
    }
    for (const [id, c] of Object.entries(contribution)) {
      const member = round.players.find((p) => p.id === id)!;
      const base = tally[id] ?? { points: 0, wins: 0, series: 0, name: member.name, emoji: member.emoji };
      tally[id] = {
        points: base.points + c.points,
        wins: base.wins + c.wins,
        series: (base.series ?? 0) + c.series,
        name: member.name,
        emoji: member.emoji,
      };
    }
    this.roundContributions.set(round.id, contribution);
    const roundsPlayed = this.state.roundsPlayed + (firstTime && multiplayer ? 1 : 0);

    this.set({ outcome: { roundId: round.id, result, missed, allWords }, tally, roundsPlayed, seriesRecords });
  }
}
