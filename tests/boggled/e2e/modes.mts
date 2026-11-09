import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import { assert, BASE, createRoom, readBoard, SHOTS, swipe, wordsOn } from "./helpers.mjs";

// Daily Puzzle, Survival, the lobby QR code, and that gameplay events reach the analytics table.
mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("boggled:track", "1");
  } catch {}
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("pageerror:", e.message));
const sent: { event: string; screen: string | null; props: Record<string, unknown> }[] = [];
page.on("request", (req) => {
  if (req.url().includes("/rest/v1/boggled_events") && req.method() === "POST") sent.push(...JSON.parse(req.postData() ?? "[]"));
});

console.log("Home and the Daily Puzzle reward");
await page.goto(`${BASE}/boggled`);
// A 2-day streak through yesterday: today's play is day 3 on the reward track.
await page.evaluate(() => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  localStorage.setItem("boggled:dailyStreak", JSON.stringify({ last: yesterday, n: 2 }));
});
await page.reload();
assert((await page.getByTestId("menu-daily").textContent())!.includes("Day 3 reward: +40 🪙"), "home previews today's streak reward");
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/19-home.png` });
await page.getByTestId("menu-friends").click();
assert((await page.getByTestId("friends").isVisible()) && (await page.getByTestId("menu-join").isVisible()), "Play with Friends offers create and join");
await page.getByTestId("back").click();

console.log("Daily Puzzle");
await page.getByTestId("menu-daily").click();
await page.getByTestId("daily-intro").waitFor();
assert((await page.getByTestId("daily-today").textContent()) === "?", "daily intro: no score yet today");
await page.getByText("Play today's board").waitFor({ timeout: 20000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/20-daily-intro.png` });
await page.getByTestId("start").click();
await page.locator(".bg-overlay").waitFor({ state: "detached", timeout: 6000 });
const board1 = await readBoard(page);
assert((await page.evaluate(() => window.__boggled.getState().round!.endsAt - window.__boggled.getState().round!.startsAt)) === 90_000, "daily round is 90 seconds");
const dailyWords = wordsOn(board1).slice(0, 3);
for (const [, p] of dailyWords) await swipe(page, p);
await page.getByTestId("end-early").click();
await page.getByTestId("end-score").click();
await page.getByTestId("daily-reward").waitFor({ timeout: 30000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/20b-daily-chest.png` });
await page.locator(".bg-chest.open").waitFor({ timeout: 5000 });
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/20c-daily-reward.png` });
await page.getByTestId("daily-claim").click({ timeout: 5000 });
assert(true, "the gift opens after a moment and can be collected");
const reward = await page.evaluate(() => JSON.parse(localStorage.getItem("boggled:quest") ?? "{}"));
assert(reward.coins === 40 && reward.items.time === 1, "day 3 pays 40 coins and a ⏱️ into the Story wallet");
await page.getByTestId("podium").waitFor({ timeout: 30000 });
await page.getByTestId("daily-panel").waitFor();
assert((await page.getByTestId("daily-panel").textContent())!.includes("locked in"), "first daily play locks in the score");
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/21-daily-results.png` });

await page.getByTestId("play-again").evaluate((el: HTMLElement) => el.click());
await page.locator(".bg-overlay").waitFor({ state: "detached", timeout: 8000 });
const board2 = await readBoard(page);
assert(board1.tiles.join("") === board2.tiles.join(""), "replaying the daily gives the same board");
assert((await page.getByTestId("found").textContent()) === "", "replay starts with no words found");
await page.getByTestId("end-early").click();
await page.getByTestId("end-score").click();
await page.getByTestId("daily-panel").waitFor({ timeout: 30000 });
assert((await page.getByTestId("daily-panel").textContent())!.includes("Practice run"), "second daily play is practice");
assert((await page.getByTestId("daily-reward").count()) === 0, "the reward is paid once per day");
await page.getByTestId("home-button").evaluate((el: HTMLElement) => el.click());
assert((await page.getByTestId("menu-daily").textContent())!.includes("Done today"), "home shows the daily is done");
assert((await page.getByTestId("menu-daily").textContent())!.includes("tomorrow +50"), "and previews tomorrow's reward");

console.log("Survival");
await page.getByTestId("menu-survival").click();
await page.getByTestId("survival-intro").waitFor();
await page.getByText("Survive ⏳").waitFor({ timeout: 20000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/22-survival-intro.png` });
await page.evaluate(() => window.__boggled.updateSettings({ duration: 6 }));
await page.getByTestId("start").click();
await page.locator(".bg-overlay").waitFor({ state: "detached", timeout: 6000 });
const sBoard = await readBoard(page);
const before = await page.evaluate(() => window.__boggled.getState().round!.endsAt);
const [sWord, sPath] = wordsOn(sBoard).find(([w]) => w.length === 4)!;
await swipe(page, sPath);
const after = await page.evaluate(() => window.__boggled.getState().round!.endsAt);
assert(after - before === 3000, `a 4-letter word (${sWord}) adds 3 seconds in Survival`);
await page.screenshot({ path: `${SHOTS}/23-survival-game.png` });
await page.getByTestId("podium").waitFor({ timeout: 30000 });
const headline = (await page.getByTestId("podium").textContent())!;
assert(/You survived 0:0\d/.test(headline), `results say how long you survived (${headline.slice(0, 30)})`);
await page.getByTestId("survival-panel").waitFor();
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/24-survival-results.png` });
await page.getByTestId("home-button").evaluate((el: HTMLElement) => el.click());

console.log("Lobby QR");
await createRoom(page, "QR Host");
await page.getByTestId("qr").click();
await page.locator("[data-testid=qr-code] svg").waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/25-lobby-qr.png` });
assert(true, "lobby shows a scannable QR code");

console.log("Analytics");
await page.goto("about:blank");
await page.waitForTimeout(800);
const kinds = new Set(sent.map((e) => e.event));
for (const k of ["session_start", "screen", "click", "round_start", "round_end"]) assert(kinds.has(k), `analytics sent ${k}`);
const ends = sent.filter((e) => e.event === "round_end");
assert(ends.some((e) => e.props.mode === "daily" && e.props.first === true), "daily round_end marks the first play");
assert(ends.some((e) => e.props.mode === "survival" && typeof e.props.survived === "number"), "survival round_end has time survived");
const clicks = sent.filter((e) => e.event === "click").map((e) => e.props.target);
assert(["daily", "survival", "create_room", "qr"].every((t) => clicks.includes(t)), "menu and lobby clicks tracked");
assert(!JSON.stringify(sent).includes("QR Host"), "no names in analytics");

await browser.close();
console.log("Modes test passed");
