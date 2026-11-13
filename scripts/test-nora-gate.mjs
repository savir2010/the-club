import { chromium } from "playwright";
const OUT = ".impeccable/review/store";
const U = "http://localhost:3100";
const b = await chromium.launch({ channel: "chrome" });
for (const as of ["guest", "member"]) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 940 } })).newPage();
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  await p.goto(`${U}/shop?nogate&as=${as}`, { waitUntil: "networkidle" });
  await p.evaluate(() => sessionStorage.setItem("club-cart", JSON.stringify([{ id: "edb-003", qty: 1 }])));
  await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(800);
  await p.getByRole("button", { name: /Ask Nora/ }).first().click(); await p.waitForTimeout(4000);
  const box = p.getByPlaceholder(/what you're after/);
  await box.waitFor({ timeout: 30000 });
  await p.waitForFunction(() => !document.querySelector('textarea[placeholder*="is on it"], input[placeholder*="is on it"]'), null, { timeout: 60000 });
  await box.fill("Yeah pay now, deliver it to my home at 8pm tonight");
  await p.getByRole("button", { name: "Send message" }).click();
  await p.waitForURL("**/checkout", { timeout: 60000 }).catch(async () => { await p.screenshot({ path: `${OUT}/nora-fail.png` }); });
  if (as === "member") await p.waitForURL("**/orders/**", { timeout: 30000 }).catch(() => {}); else await p.waitForTimeout(2500);
  console.log(as, "→", p.url());
  await p.screenshot({ path: `${OUT}/nora-${as}.png` });
  await p.context().close();
}
await b.close();
