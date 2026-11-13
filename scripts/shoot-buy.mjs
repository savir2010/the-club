// Plays the scripted "buy it" flow in the Nora chat and captures key moments.
import { chromium } from "playwright";
const OUT = ".impeccable/review/shop";
const b = await chromium.launch({ channel: "chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on("pageerror", (e) => console.log("pageerror:", e.message));
await p.goto("http://localhost:3100/?nogate"); await p.evaluate(() => { localStorage.setItem("club-age-ok", "1"); sessionStorage.clear(); });
await p.goto("http://localhost:3100/shop", { waitUntil: "networkidle" }); await p.waitForTimeout(600);
await p.getByRole("button", { name: /Ask Nora, your concierge/ }).click(); await p.waitForTimeout(1000);
await p.locator("#msg").fill("Buy it"); await p.keyboard.press("Enter");
const shots = [[700, "1-typing"], [1500, "2-reply"], [2650, "3-flying"], [3600, "4-landed"], [4500, "5-cart"], [5300, "6-cursor"], [5900, "7-click"]];
let last = 0;
for (const [t, name] of shots) { await p.waitForTimeout(t - last); last = t; await p.screenshot({ path: `${OUT}/buy-${name}.png` }); }
await p.waitForURL("**/checkout", { timeout: 8000 }); await p.waitForTimeout(1200);
await p.screenshot({ path: `${OUT}/buy-8-checkout.png` });
console.log("url:", p.url());
await b.close();
