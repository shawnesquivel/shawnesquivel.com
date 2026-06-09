// End-to-end playthrough of /dune with Playwright.
// Scenarios:
//   1. intro renders, game starts
//   2. sandwalking (irregular taps) keeps vibration low, label = "sandwalk"
//   3. rhythmic walking (holding W) summons wormsign
//   4. worm reaches the rhythmic walker -> breach -> death screen
//   5. restart works
//   6. thumper diverts an approaching worm, worm devours it and leaves
//   7. drum sand instantly maxes vibration
//   8. refuge rock = safe; worm balks and circles
//   9. crossing to the sietch cliffs -> win screen + stats
//
// Usage: node scripts/playtest-dune.mjs [baseURL]

import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOT_DIR = process.env.SHOT_DIR ?? "/tmp/dune-shots";
fs.mkdirSync(SHOT_DIR, { recursive: true });

let failures = 0;
function check(name, cond, extra = "") {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("pageerror", (e) => {
  failures++;
  console.log("  FAIL  page error:", e.message);
});

const state = () => page.evaluate(() => window.__DUNE__.getState());
const shot = (name) => page.screenshot({ path: `${SHOT_DIR}/${name}.png` });

console.log("\n=== 1. Load & intro ===");
await page.goto(`${BASE}/dune`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__DUNE__ !== undefined, null, { timeout: 20000 });
await sleep(2500); // let the intro fly-over settle
check("intro phase", (await state()).phase === "intro");
check("title visible", await page.getByRole("heading", { name: "THE CROSSING" }).isVisible());
await shot("01-intro");

console.log("\n=== 2. Start + sandwalk (irregular taps) ===");
await page.getByTestId("start-button").click();
await sleep(500);
check("playing phase", (await state()).phase === "playing");
await shot("02-start");

// step off the rock first so steps register as sand steps
await page.evaluate(() => window.__DUNE__.teleport(0, 215));
// the book's broken pattern: step... drag... drag... step... step... wait...
const brokenPattern = [180, 560, 210, 690, 340, 1150, 160, 420, 950, 260, 580, 200, 760, 330, 1100, 170];
for (const gap of brokenPattern) {
  await page.keyboard.press("KeyW", { delay: 40 });
  await sleep(gap);
}
let s = await state();
check("vibration stays low while sandwalking", s.vibration < 0.45, `vib=${s.vibration.toFixed(2)}`);
check("no worm called", s.worm.state === "idle", `worm=${s.worm.state}`);
check("sandwalk steps counted", s.sandwalkSteps >= 6, `sw=${s.sandwalkSteps}/${s.steps}`);
await shot("03-sandwalking");

console.log("\n=== 3. Rhythmic walking summons the worm ===");
await page.keyboard.down("KeyW");
await page.waitForFunction(() => window.__DUNE__.getState().worm.state !== "idle", null, { timeout: 25000 });
s = await state();
check("wormsign appears from rhythmic walking", s.worm.state === "approach", `worm=${s.worm.state}`);
await page.getByTestId("wormsign").waitFor({ state: "visible", timeout: 5000 });
check("wormsign HUD visible", await page.getByTestId("wormsign").isVisible());
await shot("04-wormsign");

console.log("\n=== 4. The worm takes the rhythmic walker ===");
await page.waitForFunction(() => window.__DUNE__.getState().phase === "dead", null, { timeout: 90000 });
await page.keyboard.up("KeyW");
await page.getByTestId("death-screen").waitFor({ state: "visible", timeout: 5000 });
check("death screen", await page.getByTestId("death-screen").isVisible());
check("death quote", await page.getByText("approach of a mountain").isVisible());
await shot("05-death");

console.log("\n=== 5. Restart ===");
await page.getByTestId("restart-button").click();
await sleep(400);
s = await state();
check("restart -> playing", s.phase === "playing");
check("worm reset", s.worm.state === "idle");
check("position reset", Math.abs(s.z - 250) < 2, `z=${s.z.toFixed(1)}`);

console.log("\n=== 6. Thumper diverts the worm ===");
await page.evaluate(() => window.__DUNE__.teleport(0, 150));
await page.evaluate(() => window.__DUNE__.setVibration(0.5));
// summon via loud rhythmic steps
await page.keyboard.down("KeyW");
await page.waitForFunction(() => window.__DUNE__.getState().worm.state === "approach", null, { timeout: 25000 });
await page.keyboard.up("KeyW");
// plant a thumper, then slip away quietly
await page.keyboard.press("KeyT");
await sleep(300);
s = await state();
check("thumper planted", s.activeThumpers === 1 && s.thumpers === 1, `inv=${s.thumpers} active=${s.activeThumpers}`);
await page.evaluate(() => window.__DUNE__.teleport(-68, 138)); // refuge rock, 70m+ away
await page.waitForFunction(
  () => {
    const st = window.__DUNE__.getState();
    return st.activeThumpers === 0 && st.phase === "playing";
  },
  null,
  { timeout: 60000 }
);
s = await state();
check("worm devoured the thumper, player alive", s.phase === "playing");
await shot("06-thumper-devoured");
// after finishing the breach the worm should depart sated
await page.waitForFunction(
  () => ["leave", "idle"].includes(window.__DUNE__.getState().worm.state),
  null,
  { timeout: 30000 }
);
s = await state();
check("worm sated/leaving", ["leave", "idle"].includes(s.worm.state), `worm=${s.worm.state}`);
check("player still alive after diversion", s.phase === "playing");

console.log("\n=== 7. Drum sand ===");
await page.evaluate(() => window.__DUNE__.restart());
await sleep(300);
await page.evaluate(() => window.__DUNE__.teleport(-14, 190)); // center of a drum patch
await page.keyboard.press("KeyW");
await sleep(400);
s = await state();
check("drum sand maxes vibration", s.vibration > 0.95, `vib=${s.vibration.toFixed(2)}`);
check("drum sand summons worm", s.worm.state === "approach", `worm=${s.worm.state}`);
check("drum sand message", (s.message ?? "").includes("DRUM SAND"));
await shot("07-drum-sand");

console.log("\n=== 8. Rock refuge is safe ===");
await page.evaluate(() => window.__DUNE__.teleport(-68, 138)); // refuge
await page.evaluate(() => window.__DUNE__.setVibration(1));
// worm is inbound to our last loud position; wait for it to arrive & balk
await page.waitForFunction(
  () => {
    const st = window.__DUNE__.getState();
    return st.worm.state === "search" || st.worm.state === "leave" || st.worm.state === "idle";
  },
  null,
  { timeout: 60000 }
);
s = await state();
check("player alive on rock", s.phase === "playing");
check("onRock flag", s.onRock === true);
await shot("08-rock-refuge");

console.log("\n=== 9. Reach the sietch -> victory ===");
await page.evaluate(() => window.__DUNE__.restart());
await sleep(300);
await page.evaluate(() => window.__DUNE__.teleport(0, -225));
// sandwalk the final stretch for real
for (let i = 0; i < 30; i++) {
  await page.keyboard.press("KeyW", { delay: 40 });
  await sleep(120 + Math.random() * 500);
  const st = await state();
  if (st.phase === "won") break;
}
s = await state();
check("victory", s.phase === "won", `phase=${s.phase} z=${s.z.toFixed(1)}`);
await page.getByTestId("win-screen").waitFor({ state: "visible", timeout: 5000 });
check("win screen", await page.getByTestId("win-screen").isVisible());
check("win stats steps > 0", s.steps > 0);
await shot("09-victory");

console.log("\n=== 10. Visual sanity: canvas actually renders ===");
// A black/blank 1280x720 frame compresses to a few KB; a rendered desert is far larger.
for (const f of ["02-start", "04-wormsign", "07-drum-sand"]) {
  const size = fs.statSync(`${SHOT_DIR}/${f}.png`).size;
  check(`screenshot ${f} is a real render`, size > 60000, `${size} bytes`);
}

await browser.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} FAILURES`}\nScreenshots: ${SHOT_DIR}`);
process.exit(failures === 0 ? 0 : 1);
