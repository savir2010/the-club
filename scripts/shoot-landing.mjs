// Captures the landing page with a real GPU window and with software rendering (no-GPU fallback).
import { chromium } from "playwright";
const OUT = ".impeccable/review";
for (const mode of ["gpu", "software"]) {
  const b = await chromium.launch(mode === "gpu"
    ? { channel: "chrome", headless: false, args: ["--window-position=-2400,0", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-features=CalculateNativeWinOcclusion"] }
    : { channel: "chrome", headless: true, args: ["--disable-gpu", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const [w, h, tag] of mode === "gpu" ? [[1440, 900, "d"], [390, 844, "m"]] : [[1440, 900, "d"]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    p.on("pageerror", (e) => console.log(mode, "pageerror:", e.message));
    await p.goto("http://localhost:3100/?nogate"); await p.evaluate(() => localStorage.setItem("club-age-ok", "1"));
    await p.goto("http://localhost:3100/", { waitUntil: "networkidle" }); await p.waitForTimeout(3500);
    await p.screenshot({ path: `${OUT}/landing-${mode}-${tag}-1hero.png` });
    if (mode === "software") {
      const t0 = Date.now(); await p.evaluate(() => new Promise(r => { let n = 0; const f = () => (++n < 30 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }));
      console.log("software: 30 frames in", Date.now() - t0, "ms");
      break;
    }
    for (const [i, frac] of [[2, 0.5], [3, 1.15], [4, 2.6], [5, 3.5]]) {
      await p.evaluate((y) => window.scrollTo(0, y), Math.round(h * frac));
      await p.waitForTimeout(1300);
      await p.screenshot({ path: `${OUT}/landing-${mode}-${tag}-${i}.png` });
    }
    // find the interlude and capture it centred
    await p.locator('section[aria-label="Interlude"]').scrollIntoViewIfNeeded(); await p.waitForTimeout(1300);
    await p.screenshot({ path: `${OUT}/landing-${mode}-${tag}-6interlude.png` });
  }
  await b.close();
}
