import { findPath, generateBoard, solve, type Board } from "./board";
import { serverNow } from "./clock";
import type { BoardSize } from "./dice";
import type { Dictionary } from "./dictionary";
import { randomId } from "./rng";
import { scoreRound, type RoundResult } from "./scoring";
import { createTransport, type ConnectionStatus, type Envelope, type Member, type Transport } from "./transport";

export type Settings = {
  size: BoardSize;
  duration: number;
  minLength: 3 | 4;
  longestBonus: boolean;
  powerUps: boolean;
};

export const DEFAULT_SETTINGS: Settings = { size: 4, duration: 120, minLength: 3, longestBonus: true, powerUps: true };

export type Round = {
  id: string;
  board: Board;
  startsAt: number;
  endsAt: number;
  settings: Settings;
  players: Member[];
};

export type Phase = "lobby" | "countdown" | "playing" | "collecting" | "results";

export type RoundOutcome = {
  roundId: string;
  result: RoundResult;
  missed: string[];
  allWords: number;
};

export type TallyEntry = { points: number; wins: number; name: string; emoji: string };
export type Tally = Record<string, TallyEntry>;

export type Toast = { id: string; text: string; kind: "bomb" | "brag" | "info"; at: number };
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
  bombs: number;
  // tile index -> Date.now() when the block lifts
  blocked: Record<number, number>;
  toasts: Toast[];
  reactions: Reaction[];
};

const COUNTDOWN_MS = 3500;
const COLLECT_TIMEOUT_MS = 6000;
const LATE_FINAL_WINDOW_MS = 120_000;
const TIMES_UP_MIN_MS = 1500;
export const BOMB_WORD_LENGTH = 6;
export const BOMB_MS = 5000;
export const MAX_BOMBS = 3;
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
  private roundContributions = new Map<string, Record<string, { points: number; wins: number }>>();
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
      bombs: 0,
      blocked: {},
      toasts: [],
      reactions: [],
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
    };
    this.beginRound(round);
    // Broadcast is at-most-once; resending an idempotent start covers a dropped packet.
    this.send({ type: "start", round });
    for (const t of this.startResends) clearTimeout(t);
    this.startResends = [800, 2000].map((ms) => setTimeout(() => this.send({ type: "start", round }), ms));
  }

  backToLobby() {
    if (!this.isHost) return;
    this.set({ phase: "lobby" });
    this.send({ type: "lobby" });
  }

  // ---- player actions ----

  addWord(word: string) {
    const { round, myWords } = this.state;
    if (!round || this.state.phase !== "playing" || myWords.includes(word)) return;
    const next = [word, ...myWords];
    this.set({ myWords: next, progress: { ...this.state.progress, [this.state.me.id]: next.length } });
    this.persistWords(round.id, next);
    this.send({ type: "progress", roundId: round.id, count: next.length });

    const multiplayer = round.players.length > 1;
    if (multiplayer && round.settings.powerUps && word.length >= BOMB_WORD_LENGTH) {
      if (this.state.bombs < MAX_BOMBS) {
        this.set({ bombs: this.state.bombs + 1 });
        this.toast("💣 Bomb earned! Tap it to block a letter on a rival's board", "bomb");
      }
    }
    if (multiplayer && word.length >= BRAG_LENGTH) this.send({ type: "brag", roundId: round.id, length: word.length });
  }

  bombTargets(): Member[] {
    const { round, roster, me } = this.state;
    if (!round) return [];
    const present = new Set(roster.map((m) => m.id));
    return round.players.filter((p) => p.id !== me.id && present.has(p.id));
  }

  useBomb(): Member | null {
    const { round, bombs, phase } = this.state;
    if (!round || phase !== "playing" || bombs <= 0) return null;
    const targets = this.bombTargets();
    if (!targets.length) return null;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const tile = Math.floor(Math.random() * round.board.tiles.length);
    this.send({ type: "bomb", roundId: round.id, target: target.id, tile });
    this.set({ bombs: bombs - 1 });
    this.toast(`💥 Bombed ${target.name}!`, "bomb");
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

  private memberName(id: string) {
    return this.state.roster.find((m) => m.id === id)?.name ?? this.state.round?.players.find((m) => m.id === id)?.name ?? "Someone";
  }

  // ---- internals ----

  private persistWords(roundId: string, words: string[]) {
    try {
      sessionStorage.setItem(`boggled:words:${roundId}`, JSON.stringify(words));
    } catch {}
  }

  private restoreWords(roundId: string): string[] {
    try {
      return JSON.parse(sessionStorage.getItem(`boggled:words:${roundId}`) ?? "[]");
    } catch {
      return [];
    }
  }

  private beginRound(round: Round) {
    const myWords = this.restoreWords(round.id);
    this.set({
      round,
      settings: round.settings,
      myWords,
      progress: { [this.state.me.id]: myWords.length },
      finals: {},
      outcome: null,
      bombs: 0,
      blocked: {},
      toasts: [],
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
            tally: s.tally,
            roundsPlayed: s.roundsPlayed,
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
        }
        this.set(patch);
        if (round && round.id !== s.round?.id) {
          this.beginRound(round);
          this.set({ finals: { ...(msg.finals as Record<string, string[]>) } });
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
        if (msg.roundId === s.round?.id) this.set({ progress: { ...s.progress, [msg.from]: msg.count as number } });
        break;
      case "bomb": {
        if (msg.roundId !== s.round?.id || msg.target !== s.me.id || s.phase !== "playing") break;
        const tile = msg.tile as number;
        this.set({ blocked: { ...s.blocked, [tile]: Date.now() + BOMB_MS } });
        this.toast(`💣 ${this.memberName(msg.from)} bombed your board!`, "bomb");
        break;
      }
      case "brag":
        if (msg.roundId === s.round?.id && s.phase === "playing") {
          this.toast(`🔥 ${this.memberName(msg.from)} found a ${msg.length as number}-letter word!`, "brag");
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
    const { round, myWords, finals, me } = this.state;
    if (!round || !this.isParticipant(round)) return;
    const now = Date.now();
    if (!force && now - this.lastFinalSent < 400) return;
    this.lastFinalSent = now;
    this.send({ type: "final", roundId: round.id, words: myWords, have: Object.keys(finals).concat(me.id) });
  }

  private prune() {
    const now = Date.now();
    const s = this.state;
    const toasts = s.toasts.filter((t) => now - t.at < TOAST_MS);
    const reactions = s.reactions.filter((r) => now - r.at < REACTION_MS);
    const blockedEntries = Object.entries(s.blocked).filter(([, until]) => until > now);
    const patch: Partial<RoomState> = {};
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

    if ((s.phase === "countdown" || s.phase === "playing") && now >= round.endsAt) {
      const finals = this.isParticipant(round) ? { ...s.finals, [s.me.id]: s.myWords } : s.finals;
      this.set({ phase: "collecting", finals });
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

  private computeOutcome() {
    const { round, finals } = this.state;
    if (!round) return;
    const dict = this.dict;
    const minLength = round.settings.minLength;
    const isValid = (w: string) =>
      w.length >= minLength && (!dict || dict.has(w)) && findPath(round.board, w) !== null;
    const players = round.players.filter((p) => finals[p.id]).map((p) => ({ id: p.id, words: finals[p.id] }));
    const result = scoreRound(players, { longestWordBonus: round.settings.longestBonus, isValid });

    let missed: string[] = [];
    let allWords = 0;
    if (dict) {
      const found = new Set(players.flatMap((p) => p.words));
      const all = [...solve(round.board, dict, minLength).keys()];
      allWords = all.length;
      missed = all.filter((w) => !found.has(w)).sort((a, b) => b.length - a.length || a.localeCompare(b)).slice(0, 15);
    }

    const multiplayer = result.players.length > 1;
    const contribution: Record<string, { points: number; wins: number }> = {};
    if (multiplayer) {
      for (const p of result.players) contribution[p.id] = { points: p.total, wins: p.rank === 1 ? 1 : 0 };
    }
    const tally: Tally = structuredClone(this.state.tally);
    const firstTime = !this.roundContributions.has(round.id);
    const prev = this.roundContributions.get(round.id) ?? {};
    for (const [id, c] of Object.entries(prev)) {
      if (tally[id]) tally[id] = { ...tally[id], points: tally[id].points - c.points, wins: tally[id].wins - c.wins };
    }
    for (const [id, c] of Object.entries(contribution)) {
      const member = round.players.find((p) => p.id === id)!;
      const base = tally[id] ?? { points: 0, wins: 0, name: member.name, emoji: member.emoji };
      tally[id] = { points: base.points + c.points, wins: base.wins + c.wins, name: member.name, emoji: member.emoji };
    }
    this.roundContributions.set(round.id, contribution);
    const roundsPlayed = this.state.roundsPlayed + (firstTime && multiplayer ? 1 : 0);

    this.set({ outcome: { roundId: round.id, result, missed, allWords }, tally, roundsPlayed });
  }
}
