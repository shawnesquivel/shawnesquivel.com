// Bomb power-up, reactions and the session scoreboard across two rounds. Needs local Supabase like two-player.mts.
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import { assert, BASE, readBoard, roomState, setName, SHOTS, swipe, wordsOn } from "./helpers.mjs";

mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
const a = await (await browser.newContext({ ...devices["iPhone 13"] })).newPage();
const b = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
for (const [n, p] of [["A", a], ["B", b]] as const) p.on("pageerror", (e) => console.error(`pageerror ${n}:`, e.message));

console.log("Power-ups, reactions, scoreboard");
await a.goto(`${BASE}/boggled`);
await a.getByTestId("menu-create").click();
await setName(a, "Shawn");
await a.getByTestId("create").click();
const code = (await a.getByTestId("room-code").textContent())!.trim();
await b.goto(`${BASE}/boggled?room=${code}`);
assert(await b.getByTestId("join").isVisible(), "invite link skips straight to the name step");
await setName(b, "Gf");
await b.getByTestId("join").click();
await a.waitForFunction(() => window.__boggled.getState().roster.length === 2, null, { timeout: 15000 });
await a.getByText("Start round").waitFor({ timeout: 20000 });

await a.getByTestId("reaction-bar").getByLabel("React 😂").click();
await b.locator(".bg-reaction").first().waitFor({ timeout: 5000 });
assert((await b.locator(".bg-reaction").first().textContent())!.includes("😂"), "reaction floats up on the other phone");

assert((await b.getByTestId("opt-powerups").getAttribute("aria-checked")) === "true", "power-ups default on");
await a.getByTestId("opt-size").getByText("5×5").click();
await a.evaluate(() => window.__boggled.updateSettings({ duration: 25 }));
await b.waitForFunction(() => window.__boggled.getState().settings.duration === 25 && window.__boggled.getState().settings.size === 5);
await a.screenshot({ path: `${SHOTS}/20-settings.png`, fullPage: true });

async function playRound(round: number) {
  await a.getByTestId("start").or(a.getByTestId("play-again")).click();
  await Promise.all([a.locator(".bg-overlay").waitFor({ state: "detached", timeout: 10000 }), b.getByTestId("game").waitFor()]);
  await b.locator(".bg-overlay").waitFor({ state: "detached", timeout: 10000 });
  const words = wordsOn(await readBoard(a));
  const long = words.find(([w]) => w.length >= 6);
  assert(long, `round ${round}: board has a 6+ letter word (${long?.[0]})`);
  if (round === 1) {
    assert(!(await a.getByTestId("bomb").isVisible()), "no bomb before a 6-letter word");
    await swipe(a, long[1]);
    await a.getByTestId("bomb").waitFor({ timeout: 3000 });
    assert(true, `"${long[0]}" earns a bomb`);
    await a.screenshot({ path: `${SHOTS}/21-bomb-earned.png` });
    await a.getByTestId("bomb").click({ force: true });
    await b.locator("[data-blocked]").waitFor({ timeout: 3000 });
    const blockedAt = Date.now();
    const tile = Number(await b.locator("[data-blocked]").getAttribute("data-tile"));
    assert((await b.locator("[data-blocked]").count()) === 1, `rival's tile ${tile} is blocked`);
    assert((await b.getByTestId("toasts").textContent())!.includes("bombed your board"), "rival is told who bombed them");
    await b.screenshot({ path: `${SHOTS}/22-bombed.png` });
    assert(!(await a.getByTestId("bomb").isVisible()), "bomb is used up");
    const through = wordsOn((await roomState(b)).round!.board).find(([, p]) => p.includes(tile));
    if (through) {
      await swipe(b, through[1]);
      const got = (await roomState(b)).myWords;
      assert(!got.includes(through[0]), `blocked tile can't be used ("${through[0]}" rejected; accepted: ${got.join(",") || "none"})`);
    }
    await b.locator("[data-blocked]").waitFor({ state: "detached", timeout: 7000 });
    const lasted = Date.now() - blockedAt;
    assert(lasted > 3500 && lasted < 6500, `block lifts after ~5s (${lasted}ms)`);
  }
  for (const [w, p] of words.filter(([w]) => w.length <= 4).slice(0, round === 1 ? 6 : 2)) {
    if (!(await roomState(a)).myWords.includes(w)) await swipe(a, p);
  }
  await Promise.all([a.getByTestId("podium").waitFor({ timeout: 60000 }), b.getByTestId("podium").waitFor({ timeout: 60000 })]);
}

await playRound(1);
await b.getByTestId("scoreboard").waitFor();
assert((await roomState(b)).roundsPlayed === 1, "round 1 counted");
const shawn = () => a.evaluate(() => window.__boggled.getState().tally[window.__boggled.getState().me.id]);
const after1 = await shawn();
await playRound(2);
await a.waitForFunction(() => window.__boggled.getState().roundsPlayed === 2);
const after2 = await shawn();
assert(after2.wins === 2 && after2.points > after1.points, `wins and points accumulate across rounds (${after2.wins} wins, ${after2.points} pts)`);
const banter = await b.getByTestId("banter").textContent();
assert(banter!.includes("Shawn"), `leader banter: "${banter}"`);
assert((await b.locator(".bg-title-badge").textContent()) === "Letter Legend", "leader gets a title badge");
await b.getByTestId("scoreboard").scrollIntoViewIfNeeded();
await b.screenshot({ path: `${SHOTS}/23-scoreboard-2-rounds.png` });
await a.getByText("Settings").click();
await a.getByTestId("scoreboard").waitFor();
await a.screenshot({ path: `${SHOTS}/24-lobby-scoreboard.png`, fullPage: true });

await browser.close();
console.log("Power-ups test passed");
