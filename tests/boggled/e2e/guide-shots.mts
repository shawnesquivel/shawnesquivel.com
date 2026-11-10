// Regenerates the phone screenshots used by the guide page: npx tsx tests/boggled/e2e/guide-shots.mts (dev server on :3000).
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";
import { readBoard, setName, swipe, wordsOn } from "./helpers.mjs";
const BASE = "http://localhost:3000/boggled";
const OUT = "public/boggled/guide";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 760 } });
const a = await ctx.newPage();
const b = await ctx.newPage();
for (const p of [a, b]) p.on("pageerror", (e) => console.error("pageerror:", e.message));
const clean = (p: typeof a) => p.evaluate(() => {
  document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
  document.querySelectorAll("p").forEach((e) => e.textContent?.includes("isn't configured") && e.remove());
});
const shot = async (p: typeof a, name: string) => (await clean(p), p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 78 }));

await a.goto(BASE);
await a.waitForTimeout(800);
await shot(a, "home");
await a.getByTestId("menu-create").click();
await a.getByTestId("room-code").waitFor();
await a.getByTestId("edit-me").click();
await setName(a, "Shawn");
await a.getByTestId("edit-done").click();
const code = (await a.getByTestId("room-code").textContent())!.trim();

await b.goto(BASE);
await b.getByTestId("menu-join").click();
await b.getByTestId("code").fill(code);
await b.getByTestId("code-next").click();
await setName(b, "Maya");
await b.getByTestId("join").click();
await a.locator("[data-testid=roster] li").nth(1).waitFor({ timeout: 15000 });
await a.waitForTimeout(500);
await shot(a, "lobby");
await a.getByTestId("tv").click();
await a.getByTestId("tv-help").waitFor();
await a.waitForTimeout(300);
await shot(a, "tv");
await a.getByTestId("tv-close").click();

await a.evaluate(() => window.__boggled.updateSettings({ duration: 20, series: 0 }));
await a.getByTestId("start").click();
await a.getByTestId("game").waitFor();
await a.locator(".bg-overlay").waitFor({ state: "detached", timeout: 8000 });
await b.locator(".bg-overlay").waitFor({ state: "detached", timeout: 8000 });
const words = wordsOn(await readBoard(a));
for (const [i, [, path]] of words.slice(0, 6).entries()) await swipe(i % 2 ? b : a, path);
for (const [, path] of words.slice(6, 9)) await swipe(a, path);
await a.bringToFront();
await shot(a, "board");
await a.getByTestId("results").waitFor({ timeout: 30000 });
await a.waitForTimeout(12000);
await shot(a, "results");
await browser.close();
