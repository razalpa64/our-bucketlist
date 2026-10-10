import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync(".scratch/shots", { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: ".scratch/shots/login.png" });

await page.fill("#login-email", "razal@ourbucketlist.app");
await page.fill("#login-password", "razaljulian");
await page.click('button[type="submit"]');
await page.waitForURL("**/", { timeout: 20000 });
await page.waitForTimeout(3500);
await page.screenshot({ path: ".scratch/shots/hero.png" });

await page.screenshot({ path: ".scratch/shots/full.png", fullPage: true });

// open the add-dream form
await page.click("text=+ dream");
await page.waitForTimeout(900);
await page.screenshot({ path: ".scratch/shots/form.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(500);

// scroll to dreams grid
await page.click('header a[href="#dreams"]');
await page.waitForTimeout(1500);
await page.screenshot({ path: ".scratch/shots/dreams.png" });

await browser.close();
console.log("shots done");
