import { mkdirSync } from "node:fs";
import { chromium, devices, type Page } from "playwright";
import { assert, BASE, readBoard, roomState, SHOTS, wordsOn } from "./helpers.mjs";

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
const sent: { event: string; props: Record<string, unknown> }[] = [];
page.on("request", (req) => {
  if (req.url().includes("/rest/v1/boggled_events") && req.method() === "POST") sent.push(...JSON.parse(req.postData() ?? "[]"));
});

const HOUR = 3_600_000;
const setQuest = (q: object) => page.evaluate((v) => localStorage.setItem("boggled:quest", JSON.stringify(v)), q);
const quest = () => page.evaluate(() => JSON.parse(localStorage.getItem("boggled:quest") ?? "{}"));

async function openMap() {
  await page.goto(`${BASE}/boggled`);
  await page.getByTestId("solo").click();
  await page.getByTestId("quest-map").waitFor();
}

// Plays the selected level: skips the versus intro, adds `count` words instantly, ends the round.
async function playLevel(p: Page, count: number, waitForBot = false) {
  await p.getByTestId("start").click();
  await p.getByTestId("vs-intro").waitFor();
  await p.getByTestId("vs-intro").waitFor({ state: "detached", timeout: 8000 });
  const words = wordsOn(await readBoard(p), (await roomState(p)).round!.settings.minLength)
    .slice(0, count)
    .map(([w]) => w);
  await p.evaluate((ws) => ws.forEach((w) => window.__boggled.addWord(w)), words);
  if (waitForBot) await p.waitForFunction(() => (window.__boggled.getState().livePoints["bot:hoot"] ?? 0) > 0, null, { timeout: 40000 });
  await p.evaluate(() => window.__boggled.endEarly());
  await p.getByTestId("verdict").waitFor({ timeout: 25000 });
}

console.log("Quest map");
await page.goto(`${BASE}/boggled`);
await page.evaluate(() => localStorage.removeItem("boggled:quest"));
await openMap();
assert((await page.getByTestId("region-name").textContent())!.includes("Training Grounds"), "starts in the Training Grounds");
assert(await page.getByTestId("node-1").isEnabled(), "level 1 is open");
assert(await page.getByTestId("node-2").isDisabled(), "level 2 is locked");
assert((await page.locator(".bg-heart:not(.empty)").count()) === 5, "5 lives to start");
assert((await page.getByTestId("level-title").textContent())!.includes("Bun Bun"), "level 1 is Bun Bun");
await page.getByTestId("start").getByText("Play Level 1").waitFor({ timeout: 20000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/q01-map.png` });

console.log("Versus intro and a win");
await page.getByTestId("start").click();
await page.getByTestId("vs-intro").waitFor();
assert((await quest()).lost.length === 1, "starting a quest round spends a life up front");
await page.waitForTimeout(1600);
await page.screenshot({ path: `${SHOTS}/q02-vs.png` });
assert((await page.getByTestId("vs-level").textContent())!.includes("LEVEL 1"), "versus intro shows the level");
await page.getByTestId("vs-intro").waitFor({ state: "detached", timeout: 8000 });
await page.getByTestId("hint").waitFor({ timeout: 3000 });
await page.waitForTimeout(1300);
await page.screenshot({ path: `${SHOTS}/q02b-hint.png` });
assert(true, "a short word is traced on the board to get you going");
const words = wordsOn(await readBoard(page)).slice(0, 12).map(([w]) => w);
await page.evaluate((ws) => ws.forEach((w) => window.__boggled.addWord(w)), words);
assert(!(await page.getByTestId("hint").isVisible()), "the hint goes away once you find a word");
await page.waitForFunction(() => (window.__boggled.getState().livePoints["bot:hoot"] ?? 0) > 0, null, { timeout: 40000 });
await page.evaluate(() => window.__boggled.endEarly());
await page.getByTestId("reveal").waitFor();
await page.getByTestId("feed-me").locator(".bg-reveal").first().waitFor({ timeout: 5000 });
assert(!(await page.getByTestId("verdict").isVisible()), "words reveal one by one before the verdict");
await page.waitForTimeout(1500);
await page.screenshot({ path: `${SHOTS}/q03-reveal.png` });
await page.getByTestId("continue").waitFor({ timeout: 25000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/q04-victory.png` });
assert((await page.getByTestId("verdict").textContent()) === "VICTORY!", "victory verdict");
assert((await page.locator(".bg-stars.big .on").count()) === 3, "a blowout earns 3 stars");
assert((await page.locator(".bg-heart:not(.empty)").count()) === 5, "a win refunds the life");
assert(!(await page.getByTestId("missed").isVisible()), "word lists are hidden by default");
assert(await page.getByTestId("coin-reward").isVisible(), `coins earned: ${await page.locator(".bg-coin-total").textContent()}`);
await page.getByTestId("words-toggle").click();
assert(await page.getByTestId("word-lists").isVisible(), "See the words opens the lists");
await page.getByTestId("words-toggle").click();

console.log("Map progression");
await page.getByTestId("continue").click();
await page.getByTestId("quest-map").waitFor();
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/q05-map-walk.png` });
await page.waitForTimeout(1500);
assert((await page.getByTestId("level-title").textContent())!.includes("Lv 2"), "the map moves you on to level 2");
assert(await page.getByTestId("node-2").isEnabled(), "level 2 is now open");
assert((await page.getByTestId("node-1").locator(".on").count()) === 3, "level 1 shows its 3 stars");
assert(Number((await page.getByTestId("coins").textContent())!.replace(/\D/g, "")) > 0, "the map shows your coins");
await page.getByTestId("node-1").click();
assert((await page.getByTestId("best").textContent())!.includes("Best"), "the card shows your best score against that opponent");
await page.getByTestId("node-2").click();
await page.screenshot({ path: `${SHOTS}/q06-map-level2.png` });

console.log("A loss costs a life");
await page.getByTestId("start").click();
await page.getByTestId("vs-intro").waitFor({ state: "detached", timeout: 8000 });
await page.waitForFunction(() => (window.__boggled.getState().livePoints["bot:hoot"] ?? 0) > 0, null, { timeout: 40000 });
const oppName = (await roomState(page)).roster.find((m) => m.id === "bot:hoot")!.name;
const oppChip = page.locator(".bg-chip", { hasText: oppName });
assert((await oppChip.textContent())!.includes("🙈"), "the opponent's score stays hidden during the round");
await page.evaluate(() => {
  const s = window.__boggled.getState();
  const shift = (s.round!.endsAt - s.round!.startsAt) / 2;
  s.round!.startsAt -= shift;
  s.round!.endsAt -= shift;
});
await page.waitForFunction(() => window.__boggled.getState().halftime, null, { timeout: 5000 });
assert((await oppChip.textContent())!.includes("🙈"), "no halftime score reveal in Story");
assert(!(await roomState(page)).toasts.some((t) => t.kind === "halftime" || t.kind === "brag"), "no halftime or long-word toasts about the opponent");
await page.evaluate(() => window.__boggled.endEarly());
await page.getByTestId("map-button").waitFor({ timeout: 25000 });
assert((await page.getByTestId("verdict").textContent()) === "DEFEAT", "defeat verdict");
assert((await page.locator(".bg-heart:not(.empty)").count()) === 4, "4 lives left");
assert(await page.getByTestId("lives-timer").isVisible(), "shows when the next life comes back");
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/q07-defeat.png` });
await page.getByTestId("map-button").click();
await page.getByTestId("quest-map").waitFor();
assert((await page.getByTestId("level-title").textContent())!.includes("Lv 2"), "no level lost on defeat");

console.log("Out of lives");
const now = Date.now();
await setQuest({ unlocked: 3, stars: { 1: 3, 2: 2 }, lost: [0, 1, 2, 3, 4].map((i) => ({ at: now - 20 * HOUR + 600_000 + i * HOUR, round: `x${i}` })), applied: [] });
await openMap();
assert(await page.getByTestId("watch-ad").isVisible(), "0 lives: Play becomes Watch ad");
assert(/4:\d\d:\d\d/.test((await page.getByTestId("out-of-lives-timer").textContent())!), "countdown to the next free life");
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/q08-no-lives.png` });
await page.getByTestId("watch-ad").click();
await page.getByTestId("ad").waitFor();
await page.screenshot({ path: `${SHOTS}/q08b-ad.png` });
await page.getByTestId("ad-claim").click({ timeout: 8000 });
assert((await page.locator(".bg-heart:not(.empty)").count()) === 1, "watching the ad gives back a life");
assert(await page.getByTestId("start").isVisible(), "Play is back");
await page.getByTestId("practice").click();
await page.getByTestId("quick-intro").waitFor();
assert(await page.getByTestId("settings").isVisible(), "practice is still open, with settings");
await page.getByTestId("leave").click();
await page.getByTestId("quest-map").waitFor();

console.log("Boss, badge and the next region");
await setQuest({ unlocked: 5, stars: { 1: 3, 2: 2, 3: 1, 4: 3 }, lost: [], applied: [] });
await openMap();
await page.getByTestId("weapon-unlock").waitFor();
await page.waitForTimeout(2800);
await page.screenshot({ path: `${SHOTS}/q09a-weapon-unlock.png` });
await page.getByTestId("weapon-ok").click();
assert((await quest()).tips.includes("blast"), "reaching level 5 unlocks the Word Blast, explained once");
assert((await page.getByTestId("level-title").textContent())!.includes("Dr. Hoot"), "level 5 is the Dr. Hoot boss");
assert((await page.getByTestId("level-card").textContent())!.includes("Bombs"), "boss card lists its powers");
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/q09-boss-node.png` });
await page.getByTestId("start").click();
await page.getByTestId("vs-intro").waitFor();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${SHOTS}/q10-boss-vs.png` });
await page.getByTestId("vs-intro").waitFor({ state: "detached", timeout: 8000 });
const bossWords = wordsOn(await readBoard(page)).map(([w]) => w);
const long = bossWords.find((w) => w.length >= 5)!;
await page.evaluate((w) => window.__boggled.addWord(w), long);
await page.getByTestId("blast").waitFor();
assert(true, `a ${long.length}-letter word (${long}) earns a Word Blast`);
await page.waitForFunction(() => (window.__boggled.getState().progress["bot:hoot"] ?? 0) > 0, null, { timeout: 40000 });
const before = (await roomState(page)).progress["bot:hoot"];
await page.screenshot({ path: `${SHOTS}/q10b-blast.png` });
await page.getByTestId("blast").evaluate((el: HTMLElement) => el.click());
assert((await roomState(page)).progress["bot:hoot"] === before - 1, "the blast blows up the opponent's latest word");
await page.evaluate((ws) => ws.forEach((w) => window.__boggled.addWord(w)), bossWords.filter((w) => w !== long).slice(0, 20));
await page.evaluate(() => window.__boggled.endEarly());
await page.getByTestId("skip-reveal").click();
assert(await page.getByTestId("verdict").isVisible(), "Skip jumps straight to the verdict");
await page.getByTestId("continue").waitFor({ timeout: 8000 });
await page.getByTestId("continue").click();
await page.getByTestId("badge-earned").waitFor();
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/q11-badge.png` });
await page.getByTestId("onward").click();
await page.getByTestId("region-intro").waitFor();
await page.waitForTimeout(700);
await page.screenshot({ path: `${SHOTS}/q12-region-intro.png` });
await page.getByTestId("region-intro").waitFor({ state: "detached", timeout: 5000 });
assert((await page.getByTestId("region-name").textContent())!.includes("Whispering Woods"), "beating the boss moves you into the Whispering Woods");
assert((await page.getByTestId("level-title").textContent())!.includes("Lv 6"), "level 6 is selected");
await page.screenshot({ path: `${SHOTS}/q13-woods.png` });

console.log("Shop and items");
await setQuest({ unlocked: 10, stars: {}, lost: [], applied: [], coins: 200, items: { bomb: 0, shield: 0, time: 0 }, tips: ["blast"] });
await openMap();
assert((await page.getByTestId("node-10").textContent())!.includes("BOSS · Lv 10"), "the boss node is labelled with its level");
await page.getByTestId("shop-button").click();
await page.getByTestId("shop").waitFor();
for (const item of ["bomb", "shield", "time"]) await page.getByTestId(`buy-${item}`).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${SHOTS}/q09b-shop.png` });
assert((await page.getByTestId("shop-coins").textContent())!.includes(String(200 - 40 - 30 - 25)), "buying spends coins");
await page.getByTestId("shop-close").click();
assert((await page.getByTestId("loadout").textContent())!.replace(/\s/g, "") === "💣1🛡️1⏱️1", "the card shows the power-ups you take into the fight");
await page.screenshot({ path: `${SHOTS}/q09c-boss-card.png` });

console.log("Boss powers hit the player");
await page.getByTestId("start").click();
await page.getByTestId("vs-intro").waitFor({ state: "detached", timeout: 8000 });
const ends0 = (await roomState(page)).round!.endsAt;
await page.getByTestId("item-time").evaluate((el: HTMLElement) => el.click());
assert((await roomState(page)).round!.endsAt - ends0 === 15000, "⏱️ adds 15 seconds");
await page.getByTestId("item-bomb").evaluate((el: HTMLElement) => el.click());
await page.getByTestId("toasts").getByText("stunned").waitFor({ timeout: 2000 });
assert(true, "💣 stuns the opponent");
await page.screenshot({ path: `${SHOTS}/q14a-items.png` });
await page.waitForFunction(() => window.__boggled.getState().itemsUsed.shield === 1, null, { timeout: 60000 });
assert(true, "🛡️ blocks the first boss attack");
await page.waitForFunction(() => Object.keys(window.__boggled.getState().flipped).length + Object.keys(window.__boggled.getState().blocked).length > 0, null, { timeout: 60000 });
assert(true, "Countess Vix flips or bombs your tiles mid-round");
await page.screenshot({ path: `${SHOTS}/q14-boss-attack.png` });
await page.evaluate(() => window.__boggled.endEarly());
await page.getByTestId("verdict").waitFor({ timeout: 25000 });

console.log("Final boss");
await setQuest({ unlocked: 20, stars: {}, lost: [], applied: [], tips: ["blast"] });
await openMap();
assert((await page.getByTestId("level-title").textContent())!.includes("Lexidrake"), "level 20 is Lexidrake");
await page.waitForTimeout(400);
await page.screenshot({ path: `${SHOTS}/q15-final-node.png` });
await playLevel(page, 30);
await page.getByTestId("continue").waitFor({ timeout: 25000 });
await page.getByTestId("continue").click();
await page.getByTestId("quest-complete").waitFor();
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/q16-quest-complete.png` });

if (sent.length) {
  console.log("Analytics");
  await page.goto("about:blank");
  await page.waitForTimeout(800);
  const ends = sent.filter((e) => e.event === "round_end" && e.props.mode === "quick");
  assert(ends.some((e) => e.props.bot_level === 1 && e.props.stars === 3 && e.props.bot === "win"), "quest round_end carries level, stars and result");
  assert(sent.some((e) => e.event === "round_start" && e.props.boss === true), "boss rounds are marked");
}

await browser.close();
console.log("Quest test passed");
