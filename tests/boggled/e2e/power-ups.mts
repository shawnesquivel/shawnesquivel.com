// Danger mode (bomb, flip, shield, halftime, danger zone, battle log), best-of-3 series, personal bests,
// reactions and the session scoreboard. Needs local Supabase like two-player.mts.
import { mkdirSync } from "node:fs";
import { chromium, devices, type Page } from "playwright";
import { assert, BASE, roomState, setName, SHOTS, swipe, wordsOn } from "./helpers.mjs";

mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
const a = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
const b = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
for (const [n, p] of [["A", a], ["B", b]] as const) p.on("pageerror", (e) => console.error(`pageerror ${n}:`, e.message));

console.log("Danger mode, series, bests, reactions, scoreboard");
await a.goto(`${BASE}/boggled`);
await a.getByTestId("menu-create").click();
await setName(a, "Shawn");
await a.getByTestId("create").click();
const code = (await a.getByTestId("room-code").textContent())!.trim();
await b.goto(`${BASE}/boggled?room=${code}`);
await b.getByTestId("join").waitFor({ timeout: 10000 });
assert(!(await b.getByTestId("menu").isVisible()), "invite link skips straight to the name step");
await setName(b, "Gf");
await b.getByTestId("join").click();
await a.waitForFunction(() => window.__boggled.getState().roster.length === 2, null, { timeout: 15000 });
await a.getByText("Start round").waitFor({ timeout: 20000 });

await a.getByTestId("reaction-bar").getByLabel("React 😂").click();
await b.locator(".bg-reaction").first().waitFor({ timeout: 5000 });
assert((await b.locator(".bg-reaction").first().textContent())!.includes("😂"), "reaction floats up on the other phone");

assert((await b.getByTestId("opt-danger").getAttribute("aria-checked")) === "true", "danger mode defaults on");
await a.getByTestId("opt-size").getByText("5×5").click();
await a.getByTestId("opt-series").getByText("Best of 3").click();
await a.evaluate(() => window.__boggled.updateSettings({ duration: 45 }));
await b.waitForFunction(() => {
  const s = window.__boggled.getState().settings;
  return s.duration === 45 && s.size === 5 && s.series === 3;
});
await a.screenshot({ path: `${SHOTS}/20-settings.png`, fullPage: true });

const board = async (p: Page) => (await roomState(p)).round!.board;
const unused = async (p: Page, pred: (w: string) => boolean) => {
  const mine = (await roomState(p)).myWords;
  return wordsOn(await board(p)).filter(([w]) => pred(w) && !mine.includes(w));
};

// ---- game 1 ----
await a.getByTestId("start").click();
await Promise.all([a.locator(".bg-overlay").waitFor({ state: "detached", timeout: 10000 }), b.locator(".bg-overlay").waitFor({ state: "detached", timeout: 10000 })]);
assert((await b.getByTestId("series-chip").textContent()) === "Game 1 · Bo3", "series chip shows Game 1 of a best of 3");

const shorts = (await unused(a, (w) => w.length <= 4)).slice(0, 4);
for (const [, path] of shorts.slice(0, 2)) await swipe(a, path);
assert((await a.getByTestId("combo").getAttribute("data-fill")) === "2", "combo ring fills a quarter per word");
await a.screenshot({ path: `${SHOTS}/25a-combo-half.png` });
for (const [, path] of shorts.slice(2)) await swipe(a, path);
assert((await b.locator(".bg-chip", { hasText: "Shawn" }).textContent())!.includes("🙈"), "rival's score is hidden before halftime");
await a.locator("[data-testid=combo].ready").waitFor({ timeout: 2000 });
assert(true, "4 quick words fill the ring and earn a 🛡️ shield");
await a.getByTestId("combo").click();
assert((await a.getByTestId("combo-info").textContent())!.includes("blocks the next"), "tapping the ring explains the shield");
await a.screenshot({ path: `${SHOTS}/25-shield-info.png` });
await a.getByTestId("combo-info").click();

const [w1, p1] = (await unused(a, (w) => w.length >= 6))[0];
await swipe(a, p1);
await a.getByTestId("bomb").waitFor({ timeout: 3000 });
assert(true, `"${w1}" earns a bomb`);
await a.getByTestId("bomb").click({ force: true });
await b.locator("[data-blocked]").waitFor({ timeout: 3000 });
const blockedAt = Date.now();
const tile = Number(await b.locator("[data-blocked]").getAttribute("data-tile"));
assert((await b.getByTestId("toasts").textContent())!.includes("bombed your board"), `rival's tile ${tile} is blocked and they're told who did it`);
await b.screenshot({ path: `${SHOTS}/22-bombed.png` });
const through = wordsOn(await board(b)).find(([, p]) => p.includes(tile));
if (through) {
  await swipe(b, through[1]);
  assert(!(await roomState(b)).myWords.includes(through[0]), `blocked tile can't be used ("${through[0]}" rejected)`);
}
await b.locator("[data-blocked]").waitFor({ state: "detached", timeout: 7000 });
const lasted = Date.now() - blockedAt;
assert(lasted > 3500 && lasted < 6500, `block lifts after ~5s (${lasted}ms)`);

const [w2, p2] = (await unused(a, (w) => w.length >= 6))[0];
await swipe(a, p2);
await a.getByTestId("flip").waitFor({ timeout: 3000 });
assert(true, `the next long word ("${w2}") earns a flip`);
await a.getByTestId("flip").click({ force: true });
await b.locator(".bg-tile.flipped").first().waitFor({ timeout: 3000 });
assert((await b.locator(".bg-tile.flipped").count()) === 2, "flip turns 2 of the rival's letters upside down");
await b.waitForTimeout(500);
await b.screenshot({ path: `${SHOTS}/26-flipped.png` });

const [wb, pb] = (await unused(b, (w) => w.length >= 6))[0];
await swipe(b, pb);
await b.getByTestId("bomb").waitFor({ timeout: 3000 });
await b.getByTestId("bomb").click({ force: true });
await a.getByTestId("toasts").getByText("shield blocked").waitFor({ timeout: 3000 });
assert((await a.locator("[data-blocked]").count()) === 0, `Gf's bomb (from "${wb}") bounces off Shawn's shield`);
assert((await a.locator("[data-testid=combo].ready").count()) === 0, "the shield is used up and the ring resets");
await b.getByTestId("toasts").getByText("blocked your bomb").waitFor({ timeout: 3000 });

await b.waitForFunction(() => window.__boggled.getState().halftime, null, { timeout: 30000 });
await b.waitForTimeout(300);
const chip = (await b.locator(".bg-chip", { hasText: "Shawn" }).textContent())!;
assert(!chip.includes("🙈") && /\d/.test(chip), `scores reveal at halftime (${chip.trim()})`);
await b.screenshot({ path: `${SHOTS}/27-halftime.png` });

await a.getByTestId("danger-zone").waitFor({ timeout: 30000 });
const [late, pl] = (await unused(a, () => true))[0];
await swipe(a, pl);
assert((await roomState(a)).myLate.includes(late), `"${late}" counts as a danger-zone word`);
await a.screenshot({ path: `${SHOTS}/28-danger-zone.png` });

await Promise.all([a.getByTestId("podium").waitFor({ timeout: 60000 }), b.getByTestId("podium").waitFor({ timeout: 60000 })]);
const shawnId = (await roomState(a)).me.id;
const r1 = (await roomState(b)).outcome!.result.players.find((p) => p.id === shawnId)!;
assert(r1.dangerBonus >= 1, `danger zone bonus +${r1.dangerBonus} is in the score both phones computed`);
const log = (await a.getByTestId("battle-log").textContent())!;
assert((await a.locator(".bg-feed-row").count()) === 3 && log.includes("blocked"), "battle log lists all 3 attacks incl. the shield block");
assert(await a.getByTestId("bests").isVisible(), "personal best panel shows");
assert((await b.getByTestId("series").textContent())!.includes("Game 1"), "series tracker shows after game 1");
await a.getByTestId("battle-log").scrollIntoViewIfNeeded();
await a.screenshot({ path: `${SHOTS}/29-battle-log.png`, fullPage: true });

// ---- game 2: Shawn wins again → series champion ----
await a.evaluate(() => window.__boggled.updateSettings({ duration: 15 }));
await a.getByTestId("play-again").click();
await a.locator(".bg-overlay").waitFor({ state: "detached", timeout: 10000 });
assert((await a.getByTestId("series-chip").textContent()) === "Game 2 · Bo3", "next game continues the series");
for (const [, path] of (await unused(a, (w) => w.length <= 5)).slice(0, 3)) await swipe(a, path);
await Promise.all([a.getByTestId("podium").waitFor({ timeout: 60000 }), b.getByTestId("podium").waitFor({ timeout: 60000 })]);
await b.getByTestId("champion").waitFor();
assert((await b.getByTestId("champion").textContent())!.includes("SHAWN"), "Shawn is crowned series champion on Gf's phone");
const tally = (await roomState(a)).tally[shawnId];
assert(tally.series === 1 && tally.wins === 2, "scoreboard counts the series win (🏅) and both round wins");
assert((await a.getByTestId("play-again").textContent()) === "New series", "host can start a new series");
const banter = await b.getByTestId("banter").textContent();
assert(banter!.includes("Shawn"), `leader banter: "${banter}"`);
await b.getByTestId("series").scrollIntoViewIfNeeded();
await b.screenshot({ path: `${SHOTS}/30-series-champion.png` });
await b.getByTestId("bests").scrollIntoViewIfNeeded();
await b.screenshot({ path: `${SHOTS}/31-bests-near-miss.png` });
await a.getByTestId("settings-button").evaluate((el: HTMLElement) => el.click());
await a.getByTestId("scoreboard").waitFor();
await a.screenshot({ path: `${SHOTS}/24-lobby-scoreboard.png`, fullPage: true });

await browser.close();
console.log("Power-ups test passed");
