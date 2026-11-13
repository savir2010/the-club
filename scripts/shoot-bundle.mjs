import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })).newPage();
await p.goto("http://localhost:3100/?nogate"); await p.evaluate(() => localStorage.setItem("club-age-ok", "1"));
await p.goto("http://localhost:3100/shop", { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
await p.getByText("Bundle, each").first().scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
await p.screenshot({ path: ".impeccable/review/d-shop-bundle.png" });
await b.close();
