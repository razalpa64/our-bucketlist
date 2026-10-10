import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#login-email", "razal@ourbucketlist.app");
await page.fill("#login-password", "razaljulian");
await page.click('button[type="submit"]');
await page.waitForURL("**/", { timeout: 20000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: ".scratch/shots/hero2.png" });

for (const [anchor, name] of [["#dreams", "dreams2"], ["#done", "done2"], ["#places", "places2"], ["#notes", "notes2"]]) {
  await page.click(`header a[href="${anchor}"]`);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `.scratch/shots/${name}.png` });
}

// open a dream detail
await page.click('article button[aria-label^="Open dream: QA· Meet"]');
await page.waitForTimeout(900);
await page.screenshot({ path: ".scratch/shots/detail2.png" });
await page.keyboard.press("Escape");

// mobile pass
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await mob.fill("#login-email", "razal@ourbucketlist.app");
await mob.fill("#login-password", "razaljulian");
await mob.click('button[type="submit"]');
await mob.waitForURL("**/", { timeout: 20000 });
await mob.waitForTimeout(3000);
await mob.screenshot({ path: ".scratch/shots/mobile-hero.png" });
await mob.evaluate(() => document.getElementById("dreams")?.scrollIntoView());
await mob.waitForTimeout(1200);
await mob.screenshot({ path: ".scratch/shots/mobile-dreams.png" });

await browser.close();
console.log("shots2 done");
