import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import { assert, BASE, readBoard, SHOTS, swipe, wordsOn } from "./helpers.mjs";

mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("pageerror:", e.message));

console.log("Solo round on iPhone 13");
await page.goto(`${BASE}/boggled`);
await page.getByTestId("menu").waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/01-home.png` });
await page.getByTestId("solo").click();
await page.getByTestId("lobby").waitFor();
await page.getByText("Start round").waitFor({ timeout: 20000 });
await page.evaluate(() => window.__boggled.updateSettings({ duration: 20, danger: false }));
await page.screenshot({ path: `${SHOTS}/02-solo-lobby.png` });
await page.getByTestId("start").click();

await page.locator(".bg-count").waitFor();
await page.screenshot({ path: `${SHOTS}/03-countdown.png` });
await page.locator(".bg-overlay").waitFor({ state: "detached", timeout: 6000 });

const board = await readBoard(page);
const words = wordsOn(board);
console.log(`  board ${board.tiles.join("")} has ${words.length} words`);
assert(words.length >= 45, "board has at least 45 words");

const picks = words.slice(0, 5);
for (const [, p] of picks) await swipe(page, p);
// duplicate + nonsense
await swipe(page, picks[0][1]);
assert((await page.getByTestId("word").textContent()) === "Already found", "duplicate word is flagged");
await swipe(page, [0, 1, 2]);

const found = await page.locator("[data-testid=found] span").allTextContents();
assert(
  picks.every(([w]) => found.includes(w)),
  `all swiped words were accepted (${picks.map(([w]) => w).join(", ")})`,
);

// real touch events (what a phone sends), not mouse
const cdp = await ctx.newCDPSession(page);
const [touchWord, touchPath] = words.find(([w]) => !picks.some(([p]) => p === w) && w.length >= 4)!;
const pts = [];
for (const i of touchPath) {
  const bx = (await page.locator(`[data-tile="${i}"]`).boundingBox())!;
  pts.push({ x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 });
}
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [pts[0]] });
for (let k = 1; k < pts.length; k++) {
  for (let s = 1; s <= 6; s++) {
    const x = pts[k - 1].x + ((pts[k].x - pts[k - 1].x) * s) / 6;
    const y = pts[k - 1].y + ((pts[k].y - pts[k - 1].y) * s) / 6;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
  }
}
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
assert((await page.locator("[data-testid=found] span").allTextContents()).includes(touchWord), `touch swipe accepted "${touchWord}"`);
assert((await page.evaluate(() => window.scrollY)) === 0, "page did not scroll during the swipe");

// tap mode: tap each tile, then tap the last one again to submit
const [tapWord, tapPath] = words.find(([w]) => !picks.some(([p]) => p === w) && w !== touchWord && w.length >= 4)!;
for (const i of tapPath) await page.locator(`[data-tile="${i}"]`).click();
await page.locator(`[data-tile="${tapPath[tapPath.length - 1]}"]`).click();
const found2 = await page.locator("[data-testid=found] span").allTextContents();
assert(found2.includes(tapWord), `tap mode accepted "${tapWord}"`);

// mid-swipe screenshot showing the trail
const [, longPath] = words[0];
const box0 = (await page.locator(`[data-tile="${longPath[0]}"]`).boundingBox())!;
await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
await page.mouse.down();
for (const i of longPath.slice(1)) {
  const b = (await page.locator(`[data-tile="${i}"]`).boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
}
await page.screenshot({ path: `${SHOTS}/04-swiping.png` });
await page.mouse.move(0, 0);
await page.mouse.up();
await page.screenshot({ path: `${SHOTS}/05-playing.png` });

await page.getByTestId("results").waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SHOTS}/06-solo-reveal.png` });
await page.getByTestId("podium").waitFor({ timeout: 30000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/07-solo-results.png`, fullPage: true });
const missedList = page.getByTestId("missed-list");
const collapsedH = (await missedList.boundingBox())!.height;
const chipH = (await missedList.locator("span").first().boundingBox())!.height;
assert(collapsedH < chipH * 2.6, `missed words start collapsed to 2 rows (${Math.round(collapsedH)}px, chip ${Math.round(chipH)}px)`);
await page.getByTestId("missed-toggle").click();
assert((await missedList.boundingBox())!.height > collapsedH * 1.5, "Show all expands the missed words");
await page.screenshot({ path: `${SHOTS}/07b-missed-expanded.png`, fullPage: true });
await page.getByTestId("missed-toggle").click();
const buttons = await page.locator("[data-testid=home-button], [data-testid=settings-button], [data-testid=play-again]").evaluateAll((els) =>
  els.map((e) => [e.getAttribute("data-testid"), e.getBoundingClientRect().left] as const),
);
assert(buttons.sort((x, y) => x[1] - y[1]).at(-1)![0] === "play-again", "Play again is the right-most button");
const score = Number(await page.getByTestId("score").first().textContent());
const expected = [...found2].reduce((s, w) => s + w.length - 2, 0);
assert(score === expected, `final score ${score} equals sum of word points ${expected}`);

// Ending a practice round early.
await page.evaluate(() => window.__boggled.updateSettings({ duration: 180 }));
await page.getByTestId("play-again").click();
await page.locator(".bg-overlay").waitFor({ state: "detached", timeout: 6000 });
const quick = wordsOn(await readBoard(page)).filter(([w]) => w.length <= 4).slice(0, 4);
const endsBefore = await page.evaluate(() => window.__boggled.getState().round!.endsAt);
for (const [, p] of quick) await swipe(page, p);
await page.getByTestId("toasts").getByText("Combo!").waitFor({ timeout: 2000 });
const endsAfter = await page.evaluate(() => window.__boggled.getState().round!.endsAt);
assert(endsAfter - endsBefore === 5000, "solo: 4 words in 4 s fills the ⚡ ring and adds 5 seconds");
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/08a-solo-combo.png` });
const early = [quick.map(([w]) => w).join(","), quick.reduce((n, [w]) => n + w.length - 2, 0)] as const;
await page.getByTestId("end-early").click();
await page.getByTestId("end-confirm").waitFor();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/08-end-early-confirm.png` });
await page.getByTestId("end-cancel").click();
assert(!(await page.getByTestId("end-confirm").isVisible()) && (await page.getByTestId("game").isVisible()), "Keep playing closes the prompt");
await page.getByTestId("end-early").click();
await page.getByTestId("end-score").click();
await page.getByTestId("podium").waitFor({ timeout: 30000 });
assert(Number(await page.getByTestId("score").first().textContent()) === early[1], `"End & see my score" jumps to results with the words so far`);
await page.getByTestId("home-button").evaluate((el: HTMLElement) => el.click());
await page.getByTestId("menu").waitFor();
assert(true, "Home button on solo results returns to the menu");

await page.getByTestId("solo").click();
await page.getByTestId("start").click();
await page.getByTestId("end-early").click();
await page.getByTestId("end-home").click();
await page.getByTestId("menu").waitFor();
assert(page.url().endsWith("/boggled"), "Quit to home mid-round returns to the menu");

await browser.close();
console.log("Solo test passed");
