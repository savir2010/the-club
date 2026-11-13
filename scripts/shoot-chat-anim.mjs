// Samples the Nora chat open/close animation at exact times by pausing and seeking CSS animations.
import { chromium } from "playwright";
const OUT = ".impeccable/review/shop";
const clip = { x: 900, y: 120, width: 540, height: 780 };
const b = await chromium.launch({ channel: "chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:3100/?nogate"); await p.evaluate(() => localStorage.setItem("club-age-ok", "1"));
await p.goto("http://localhost:3100/shop", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
const seek = (t) => p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
await p.getByRole("button", { name: /Ask Nora, your concierge/ }).click();
for (const t of [60, 160, 300, 900]) { await seek(t); await p.screenshot({ path: `${OUT}/anim-open-${t}.png`, clip }); }
await p.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.play(); } }));
await p.getByRole("button", { name: "Minimize chat" }).click();
await seek(120); await p.screenshot({ path: `${OUT}/anim-close-120.png`, clip });
await p.evaluate(() => document.getAnimations().forEach((a) => a.play()));
await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/anim-closed.png`, clip });
await b.close(); console.log("ok");
