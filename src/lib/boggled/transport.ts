import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

export type Member = {
  id: string;
  name: string;
  emoji: string;
  joinedAt: number;
};

export type ConnectionStatus = "connecting" | "connected" | "offline";

export type Envelope = { type: string; from: string; [key: string]: unknown };

export interface Transport {
  readonly kind: "supabase" | "local" | "solo";
  connect(me: Member): void;
  send(msg: Envelope): void;
  reconnect(): void;
  close(): void;
  onMessage: (msg: Envelope) => void;
  onRoster: (members: Member[]) => void;
  onStatus: (status: ConnectionStatus) => void;
}

const noop = () => {};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function multiplayerAvailable(): "supabase" | "local" {
  if (typeof window !== "undefined" && new URLSearchParams(location.search).get("transport") === "local") return "local";
  return SUPABASE_URL && SUPABASE_KEY ? "supabase" : "local";
}

export function createTransport(room: string | null): Transport {
  if (!room) return new SoloTransport();
  return multiplayerAvailable() === "supabase" ? new SupabaseTransport(room) : new LocalTransport(room);
}

class SoloTransport implements Transport {
  readonly kind = "solo" as const;
  onMessage: (msg: Envelope) => void = noop;
  onRoster: (members: Member[]) => void = noop;
  onStatus: (status: ConnectionStatus) => void = noop;
  connect(me: Member) {
    queueMicrotask(() => {
      this.onStatus("connected");
      this.onRoster([me]);
    });
  }
  send() {}
  reconnect() {}
  close() {}
}

let sharedClient: SupabaseClient | null = null;

class SupabaseTransport implements Transport {
  readonly kind = "supabase" as const;
  onMessage: (msg: Envelope) => void = noop;
  onRoster: (members: Member[]) => void = noop;
  onStatus: (status: ConnectionStatus) => void = noop;
  private channel: RealtimeChannel | null = null;
  private me: Member | null = null;
  private closed = false;

  constructor(private readonly room: string) {}

  private get client() {
    sharedClient ??= createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
    return sharedClient;
  }

  connect(me: Member) {
    this.me = me;
    this.closed = false;
    this.open();
  }

  private open() {
    const me = this.me!;
    this.onStatus("connecting");
    const channel = this.client.channel(`boggled:${this.room}`, {
      config: { broadcast: { self: false }, presence: { key: me.id } },
    });
    this.channel = channel;

    channel.on("broadcast", { event: "msg" }, ({ payload }) => {
      if (channel === this.channel) this.onMessage(payload as Envelope);
    });
    channel.on("presence", { event: "sync" }, () => {
      if (channel !== this.channel) return;
      const state = channel.presenceState<Member>();
      const members = Object.values(state)
        .map((metas) => metas[0])
        .filter(Boolean)
        .map(({ id, name, emoji, joinedAt }) => ({ id, name, emoji, joinedAt }));
      this.onRoster(members);
    });
    channel.subscribe((status) => {
      if (channel !== this.channel || this.closed) return;
      if (status === "SUBSCRIBED") {
        this.onStatus("connected");
        void channel.track(me);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        this.onStatus("offline");
      }
    });
  }

  send(msg: Envelope) {
    if (!this.channel) return;
    void this.channel.send({ type: "broadcast", event: "msg", payload: msg });
  }

  reconnect() {
    if (this.closed || !this.me) return;
    if (this.channel?.state === "joined") return;
    const old = this.channel;
    this.channel = null;
    if (old) void this.client.removeChannel(old);
    this.open();
  }

  close() {
    this.closed = true;
    const old = this.channel;
    this.channel = null;
    if (old) {
      void old.untrack();
      void this.client.removeChannel(old);
    }
  }
}

// Same-browser fallback (tabs/windows of one browser) for development without Supabase.
class LocalTransport implements Transport {
  readonly kind = "local" as const;
  onMessage: (msg: Envelope) => void = noop;
  onRoster: (members: Member[]) => void = noop;
  onStatus: (status: ConnectionStatus) => void = noop;
  private bc: BroadcastChannel | null = null;
  private me: Member | null = null;
  private seen = new Map<string, { member: Member; at: number }>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly room: string) {}

  connect(me: Member) {
    this.me = me;
    this.bc = new BroadcastChannel(`boggled:${this.room}`);
    this.bc.onmessage = (e) => {
      const msg = e.data as Envelope;
      if (msg.type === "_presence") {
        this.seen.set(msg.from, { member: msg.member as Member, at: Date.now() });
        this.emitRoster();
      } else if (msg.type === "_leave") {
        this.seen.delete(msg.from);
        this.emitRoster();
      } else {
        this.onMessage(msg);
      }
    };
    this.seen.set(me.id, { member: me, at: Date.now() });
    const ping = () => {
      this.seen.set(me.id, { member: me, at: Date.now() });
      this.bc?.postMessage({ type: "_presence", from: me.id, member: me });
      this.emitRoster();
    };
    ping();
    this.timer = setInterval(ping, 1500);
    this.onStatus("connected");
  }

  private emitRoster() {
    const cutoff = Date.now() - 5000;
    for (const [id, entry] of this.seen) if (entry.at < cutoff) this.seen.delete(id);
    this.onRoster([...this.seen.values()].map((e) => e.member));
  }

  send(msg: Envelope) {
    this.bc?.postMessage(msg);
  }

  reconnect() {}

  close() {
    if (this.timer) clearInterval(this.timer);
    if (this.me) this.bc?.postMessage({ type: "_leave", from: this.me.id });
    this.bc?.close();
    this.bc = null;
  }
}
