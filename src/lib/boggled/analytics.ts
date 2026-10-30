// Anonymous, fire-and-forget gameplay analytics. See docs/boggled/analytics.md.
// Nothing here may throw or block the game.

type Props = Record<string, string | number | boolean | null | undefined>;
type Row = { player: string; session: string; event: string; screen: string | null; props: Props };

export type Screen =
  | "home"
  | "join_code"
  | "join_name"
  | "intro_quick"
  | "intro_daily"
  | "intro_survival"
  | "lobby"
  | "game"
  | "results";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const FLUSH_MS = 15_000;
const MAX_QUEUE = 20;

let queue: Row[] = [];
let player = "";
let session = "";
let screen: Screen | null = null;
let enabled = false;
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

function randomId(prefix: string) {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return prefix + Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 14);
}

function stored(storage: Storage, key: string, prefix: string) {
  let v = storage.getItem(key);
  if (!v) {
    v = randomId(prefix);
    storage.setItem(key, v);
  }
  return v;
}

function optedOut() {
  const q = new URLSearchParams(location.search).get("notrack");
  if (q === "1") localStorage.setItem("boggled:notrack", "1");
  if (q === "0") localStorage.removeItem("boggled:notrack");
  if (localStorage.getItem("boggled:notrack") === "1") return true;
  return navigator.webdriver && localStorage.getItem("boggled:track") !== "1";
}

export function initAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    if (!URL_ || !KEY || optedOut()) return;
    player = stored(localStorage, "boggled:player", "p_");
    const fresh = !sessionStorage.getItem("boggled:session");
    session = stored(sessionStorage, "boggled:session", "s_");
    enabled = true;
    timer = setInterval(flush, FLUSH_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        track("hide", { in_round: screen === "game" });
        flush();
      }
    });
    window.addEventListener("pagehide", flush);
    if (fresh) {
      const visit = Number(localStorage.getItem("boggled:visits") ?? 0) + 1;
      localStorage.setItem("boggled:visits", String(visit));
      const params = new URLSearchParams(location.search);
      let ref = "";
      try {
        ref = document.referrer ? new URL(document.referrer).hostname : "";
      } catch {}
      track("session_start", {
        ref: ref === location.hostname ? "" : ref,
        host: location.hostname,
        visit,
        mobile: matchMedia("(pointer: coarse)").matches,
        standalone: matchMedia("(display-mode: standalone)").matches,
        utm: params.get("utm_source") ?? params.get("ref") ?? undefined,
      });
    }
  } catch {
    enabled = false;
  }
}

export function track(event: string, props: Props = {}) {
  if (!enabled) return;
  queue.push({ player, session, event, screen, props });
  if (queue.length >= MAX_QUEUE) flush();
}

export function setScreen(next: Screen) {
  if (next === screen) return;
  screen = next;
  track("screen");
}

export const click = (target: string) => track("click", { target });

export function flush() {
  if (!enabled || queue.length === 0) return;
  const rows = queue;
  queue = [];
  try {
    fetch(`${URL_}/rest/v1/boggled_events`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: KEY!,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    })
      .then((res) => {
        if (res.status === 404 || res.status === 401 || res.status === 403) stop();
      })
      .catch(() => {});
  } catch {}
}

function stop() {
  enabled = false;
  queue = [];
  if (timer) clearInterval(timer);
}

export async function dailyRank(day: string, score: number): Promise<{ players: number; beaten: number; top: number | null } | null> {
  if (!URL_ || !KEY) return null;
  try {
    const res = await fetch(`${URL_}/rest/v1/rpc/boggled_daily_rank`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ day, score }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
