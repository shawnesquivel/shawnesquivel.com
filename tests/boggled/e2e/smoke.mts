// Fast crash check: clicks through every screen and back (in-app and browser back) and fails on any page error.
// scrollTo & co. return Promises like Chrome 150 does, so effects that accidentally return them blow up here too.
// Usage: npx tsx tests/boggled/e2e/smoke.mts (dev server on BOGGLED_URL)
import { chromium, devices, type Page } from "playwright";
import { assert, BASE, openLevel } from "./helpers.mjs";

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
await ctx.addInitScript(`
  for (const proto of [Element.prototype, window]) {
    for (const name of ["scrollTo", "scrollBy", "scroll", "scrollIntoView"]) {
      const orig = proto[name];
      if (typeof orig === "function") proto[name] = function (...args) { orig.apply(this, args); return Promise.resolve(); };
    }
  }
`);
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors: string[] = [];
const logged: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && logged.push(m.text().slice(0, 300)));

async function step(name: string, fn: (p: Page) => Promise<unknown>) {
  try {
    await fn(page);
  } catch (e) {
    const crashed = await page.getByTestId("crash").isVisible();
    throw new Error(`${name} failed${crashed ? " (crash screen shown)" : ""}\n${[...errors, ...logged].join("\n")}\n${e}`);
  }
  await page.waitForTimeout(250);
  const crashed = await page.getByTestId("crash").isVisible();
  assert(!crashed && errors.length === 0, `${name}${errors.length ? `: ${errors.join(" | ")}` : ""}`);
}

const home = (p: Page) => p.getByTestId("menu").waitFor();

console.log("Smoke");
await step("home loads", async (p) => {
  await p.goto(`${BASE}/boggled`);
  await home(p);
});
await step("story opens", async (p) => {
  await p.getByTestId("solo").click();
  await p.getByTestId("quest-map").waitFor();
});
await step("in-app back from story", async (p) => {
  await p.getByTestId("leave").click();
  await home(p);
});
await step("browser back from story", async (p) => {
  await p.getByTestId("solo").click();
  await p.getByTestId("quest-map").waitFor();
  await p.goBack();
  await home(p);
});
await step("level sheet and Play", async (p) => {
  await p.getByTestId("solo").click();
  await openLevel(p);
  await p.getByTestId("start").getByText("Play").waitFor({ timeout: 20000 });
  await p.getByTestId("start").click();
  await p.getByTestId("game").waitFor();
});
await step("leave a round", async (p) => {
  await p.getByTestId("end-early").click();
  await p.getByTestId("end-home").click();
  await home(p);
});
await step("create room, browser back", async (p) => {
  await p.getByTestId("menu-create").click();
  await p.getByTestId("room-code").waitFor();
  await p.goBack();
  await home(p);
});
await step("join step, in-app back", async (p) => {
  await p.getByTestId("menu-join").click();
  await p.getByTestId("code").waitFor();
  await p.getByTestId("back").click();
  await home(p);
});
await step("daily, browser back", async (p) => {
  await p.getByTestId("menu-daily").click();
  await p.getByTestId("daily-intro").waitFor();
  await p.goBack();
  await home(p);
});
await step("survival, in-app back", async (p) => {
  await p.getByTestId("menu-survival").click();
  await p.getByTestId("leave").first().click();
  await home(p);
});

await browser.close();
console.log("Smoke test passed");
