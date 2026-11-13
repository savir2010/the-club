// Freezes the fly-to-cart animation mid-arc for review.
import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:3100/?nogate"); await p.evaluate(() => { localStorage.setItem("club-age-ok", "1"); sessionStorage.clear(); });
await p.goto("http://localhost:3100/shop", { waitUntil: "networkidle" }); await p.waitForTimeout(600);
await p.getByRole("button", { name: /Ask Nora, your concierge/ }).click(); await p.waitForTimeout(1000);
await p.locator("[data-pick-add=top-001]").click();
await p.waitForTimeout(30);
for (const t of [250, 520]) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { if (a.effect?.target?.parentElement === document.body) { a.pause(); a.currentTime = t; } }), t);
  await p.screenshot({ path: `.impeccable/review/shop/fly-${t}.png`, clip: { x: 700, y: 0, width: 740, height: 900 } });
}
await b.close(); console.log("ok");
