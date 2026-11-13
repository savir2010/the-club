import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
for (const [w,h,t] of [[1440,900,"desktop"],[390,844,"mobile"]]) {
  const p = await (await b.newContext({ viewport:{width:w,height:h}, reducedMotion:"reduce" })).newPage();
  await p.goto("http://localhost:3100/?nogate", { waitUntil: "networkidle" }); for (let y=0;y<5000;y+=600){ await p.mouse.wheel(0,600); await p.waitForTimeout(150);} await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(1200);
  await p.screenshot({ path: `.impeccable/review/${t}.png`, fullPage: true });
}
await b.close();
