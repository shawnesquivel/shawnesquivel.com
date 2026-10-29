// Two phones in one room over Supabase Realtime (local: `npx supabase start` + .env.local).
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import { assert, BASE, roomState, readBoard, setName, SHOTS, swipe, wordsOn } from "./helpers.mjs";

mkdirSync(SHOTS, { recursive: true });
const VIDEOS = process.env.BOGGLED_VIDEOS ?? "/opt/cursor/artifacts/videos";
const browser = await chromium.launch();
const ctxA = await browser.newContext({ ...devices["iPhone 13"], recordVideo: { dir: VIDEOS, size: { width: 390, height: 664 } } });
const ctxB = await browser.newContext({ ...devices["Pixel 7"] });
const a = await ctxA.newPage();
const b = await ctxB.newPage();
for (const [n, p] of [["A", a], ["B", b]] as const) p.on("pageerror", (e) => console.error(`pageerror ${n}:`, e.message));

const state = roomState;

console.log("Two-player room");
await a.goto(`${BASE}/boggled`);
await a.getByTestId("menu-create").click();
await setName(a, "Shawn");
await a.getByTestId("create").click();
const code = (await a.getByTestId("room-code").textContent())!.trim();
assert(/^[A-Z]{4}$/.test(code), `room created with code ${code}`);
assert(a.url().includes(`room=${code}`), "invite link is in the URL");
assert((await state(a)).status === "connected" || (await a.waitForFunction(() => window.__boggled.getState().status === "connected")), "host connected to Supabase Realtime");

await b.goto(`${BASE}/boggled`);
await b.getByTestId("menu-join").click();
await b.getByTestId("code").fill(code.toLowerCase());
await b.getByTestId("code-next").click();
await setName(b, "Gf");
await b.getByTestId("emoji-input").fill("🧋");
assert((await b.getByLabel("Selected avatar").textContent()) === "🧋", "any typed emoji can be the avatar");
await b.screenshot({ path: `${SHOTS}/09-join-name-step.png` });
await b.getByTestId("join").click();
await a.locator("[data-testid=roster] li").nth(1).waitFor({ timeout: 15000 });
await b.locator("[data-testid=roster] li").nth(1).waitFor({ timeout: 15000 });
assert(true, "both players see each other in the roster");
assert((await state(b)).hostId === (await state(a)).me.id, "first player is host on both phones");

await a.getByText("Start round").waitFor({ timeout: 20000 });
await a.getByText("5×5").click();
await b.waitForFunction(() => window.__boggled.getState().settings.size === 5, null, { timeout: 5000 });
assert(true, "host settings sync to the other phone");
await a.getByText("4×4").click();
await a.evaluate(() => window.__boggled.updateSettings({ duration: 25 }));
await b.waitForFunction(() => window.__boggled.getState().settings.duration === 25);
await a.screenshot({ path: `${SHOTS}/10-lobby-host.png` });
await b.screenshot({ path: `${SHOTS}/11-lobby-guest.png` });

await a.getByTestId("start").click();
await Promise.all([a.getByTestId("game").waitFor(), b.getByTestId("game").waitFor()]);
assert(true, "round starts on both phones");
await Promise.all([
  a.locator(".bg-overlay").waitFor({ state: "detached", timeout: 8000 }),
  b.locator(".bg-overlay").waitFor({ state: "detached", timeout: 8000 }),
]);

const boardA = await readBoard(a);
const boardB = await readBoard(b);
assert(boardA.tiles.join() === boardB.tiles.join(), `identical board on both phones (${boardA.tiles.join("")})`);
const sa = await state(a);
const sb = await state(b);
assert(Math.abs(sa.round!.endsAt - sb.round!.endsAt) === 0, "same end time on both phones");

const words = wordsOn(boardA);
const shared = words[3];
const aOnly = [words[0], words[2]];
const bOnly = [words[1]];
for (const [, p] of [...aOnly, shared]) await swipe(a, p);
for (const [, p] of [...bOnly, shared]) await swipe(b, p);
await b.waitForTimeout(300);
await a.waitForFunction(() => {
  const s = window.__boggled.getState();
  return Object.values(s.progress).length === 2;
});
await a.screenshot({ path: `${SHOTS}/12-playing-host.png` });
await b.screenshot({ path: `${SHOTS}/13-playing-guest.png` });
const progressA = (await state(a)).progress;
assert(progressA[sb.me.id] === 2, "host sees guest's live word count");

await Promise.all([a.getByTestId("results").waitFor({ timeout: 45000 }), b.getByTestId("results").waitFor({ timeout: 45000 })]);
assert(true, "both phones reach results");
await a.waitForTimeout(2200);
await a.screenshot({ path: `${SHOTS}/14-reveal-host.png` });
await Promise.all([a.getByTestId("podium").waitFor({ timeout: 40000 }), b.getByTestId("podium").waitFor({ timeout: 40000 })]);
await a.waitForTimeout(1000);
await a.screenshot({ path: `${SHOTS}/15-podium-host.png`, fullPage: true });
await b.screenshot({ path: `${SHOTS}/16-podium-guest.png`, fullPage: true });

const ra = (await state(a)).outcome!.result;
const rb = (await state(b)).outcome!.result;
assert(JSON.stringify(ra) === JSON.stringify(rb), "both phones computed identical results");
const pts = (w: string) => w.length - 2;
const allA = [...aOnly, shared].map(([w]) => w);
const allB = [...bOnly, shared].map(([w]) => w);
const longest = Math.max(...[...allA, ...allB].map((w) => w.length));
const bonus = (ws: string[]) => (ws.some((w) => w.length === longest) ? 3 : 0);
const expectA = aOnly.reduce((s, [w]) => s + 2 * pts(w), 0) + pts(shared[0]) + bonus(allA);
const expectB = bOnly.reduce((s, [w]) => s + 2 * pts(w), 0) + pts(shared[0]) + bonus(allB);
const totalA = ra.players.find((p) => p.id === sa.me.id)!.total;
const totalB = ra.players.find((p) => p.id === sb.me.id)!.total;
assert(totalA === expectA, `host score ${totalA} = unique ×2 + shared + longest bonus (${expectA})`);
assert(totalB === expectB, `guest score ${totalB} = ${expectB}`);
const shownA = await a.locator(`[data-testid=col-${sa.me.id}] [data-testid=score]`).textContent();
assert(Number(shownA) === totalA, "animated score lands on the final total");

await a.getByTestId("scoreboard").waitFor();
const [ta, tb] = [(await state(a)).tally, (await state(b)).tally];
assert(JSON.stringify(ta) === JSON.stringify(tb) && Object.keys(ta).length === 2, "session scoreboard matches on both phones");
assert((await a.getByTestId("banter").textContent())!.length > 5, `leader banter shows: "${await a.getByTestId("banter").textContent()}"`);
await a.getByTestId("scoreboard").scrollIntoViewIfNeeded();
await a.screenshot({ path: `${SHOTS}/17-scoreboard.png` });

// Next round: the guest reloads (phone woke up / refreshed) and must rejoin the same room.
await b.reload();
await setName(b, "Gf");
await b.getByTestId("join").click();
await a.locator("[data-testid=col-" + sa.me.id + "]").waitFor();
await a.waitForFunction(() => window.__boggled.getState().roster.length === 2, null, { timeout: 15000 });
await a.getByTestId("play-again").click();
await b.getByTestId("game").waitFor({ timeout: 15000 });
const round2 = (await state(b)).round;
assert(round2!.players.some((p) => p.id === sb.me.id), "a reloaded guest rejoins with the same identity and plays the next round");

await ctxA.close();
await ctxB.close();
await browser.close();
console.log("Two-player test passed");
