// /boggled/test (wordbrawl.app/test) never sends analytics, shows a badge, and invites point at the normal page.
// Usage: npx tsx tests/boggled/e2e/test-mode.mts (dev server on BOGGLED_URL, Supabase URL configured)
import { chromium, type Page } from "playwright";
import { assert, BASE, createRoom } from "./helpers.mjs";

const browser = await chromium.launch();

async function open(path: string) {
  const ctx = await browser.newContext();
  // A string, not a function: tsx's helpers don't exist inside the page.
  await ctx.addInitScript(`
    localStorage.setItem("boggled:track", "1");
    window.__shared = [];
    Object.defineProperty(navigator, "share", { value: async (d) => void window.__shared.push(d.url) });
  `);
  const page = await ctx.newPage();
  const sent: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/rest/v1/boggled_events") && req.method() === "POST") sent.push(...JSON.parse(req.postData() ?? "[]").map((e: { event: string }) => e.event));
  });
  await page.goto(`${BASE}${path}`);
  await page.getByTestId("menu-create").waitFor();
  return { page, sent };
}

async function playAround(page: Page) {
  await createRoom(page, "Tester");
  await page.getByTestId("share").click();
  await page.waitForTimeout(300);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.goto("about:blank");
  await page.waitForTimeout(800);
}

console.log("Test mode");
const test = await open("/boggled/test");
assert(await test.page.getByTestId("test-mode").isVisible(), "test mode shows a badge");
await playAround(test.page);
assert(test.sent.length === 0, `no analytics sent from /test (got ${test.sent.join(",") || "none"})`);

console.log("Normal mode");
const normal = await open("/boggled");
assert((await normal.page.getByTestId("test-mode").count()) === 0, "no badge on the normal page");
await createRoom(normal.page, "Player");
await normal.page.goto("about:blank");
await normal.page.waitForTimeout(800);
assert(normal.sent.includes("session_start"), "normal page still tracks");

console.log("Invites from test mode");
const inv = await open("/boggled/test");
await createRoom(inv.page, "Host");
await inv.page.getByTestId("share").click();
await inv.page.waitForTimeout(300);
const shared = await inv.page.evaluate(() => (window as unknown as { __shared: string[] }).__shared);
assert(shared.length === 1 && /\/boggled\?room=[A-Z]{4}$/.test(new URL(shared[0]).pathname + new URL(shared[0]).search), `invite link skips /test (${shared[0]})`);

await browser.close();
console.log("Test-mode test passed");
