// Packet loss at the buzzer + host leaving. Needs local Supabase like two-player.mts.
import { chromium, devices } from "playwright";
import { assert, BASE, createRoom, roomState, readBoard, setName, swipe, wordsOn } from "./helpers.mjs";

const browser = await chromium.launch();
const a = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
const b = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
const state = roomState;

console.log("Resilience");
await a.goto(`${BASE}/boggled`);
await createRoom(a, "Host");
const code = (await a.getByTestId("room-code").textContent())!.trim();
await b.goto(`${BASE}/boggled?room=${code}`);
await setName(b, "Guest");
await b.getByTestId("join").click();
await a.waitForFunction(() => window.__boggled.getState().roster.length === 2, null, { timeout: 15000 });
await a.getByText("Start round").waitFor({ timeout: 20000 });
await a.evaluate(() => window.__boggled.updateSettings({ duration: 12 }));
await b.waitForFunction(() => window.__boggled.getState().settings.duration === 12);
await a.getByTestId("start").click();
await b.locator(".bg-overlay").waitFor({ state: "detached", timeout: 10000 });

const words = wordsOn(await readBoard(b));
await swipe(b, words[0][1]);
await swipe(a, words[1][1]);

// Guest goes dark just before the buzzer.
type Hack = { transport: { send: (m: unknown) => void }; __send?: (m: unknown) => void };
await b.evaluate(() => {
  const c = window.__boggled as unknown as Hack;
  c.__send = c.transport.send.bind(c.transport);
  c.transport.send = () => {};
});
await a.getByTestId("results").waitFor({ timeout: 30000 });
const before = await state(a);
const guestId = (await state(b)).me.id;
assert(!before.finals[guestId], "host timed out without the guest's words");

await b.evaluate(() => {
  const c = window.__boggled as unknown as Hack;
  c.transport.send = c.__send!;
});
await a.waitForFunction(
  (id) => window.__boggled.getState().outcome?.result.players.some((p) => p.id === id),
  guestId,
  { timeout: 10000 },
);
const after = (await state(a)).outcome!.result;
const ra = (await state(b)).outcome!.result;
assert(JSON.stringify(after) === JSON.stringify(ra), "host recovers the guest's words and both phones agree");

// Host leaves: the guest is promoted.
await a.close();
await b.waitForFunction((id) => window.__boggled.getState().hostId === id, guestId, { timeout: 20000 });
await b.getByTestId("play-again").waitFor({ timeout: 5000 });
assert(true, "guest becomes host when the host leaves");

await browser.close();
console.log("Resilience test passed");
