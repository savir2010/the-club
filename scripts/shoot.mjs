import { chromium } from "playwright";
const OUT = process.argv[2];
const base = "http://localhost:3100";
const pages = [
  ["home", "/", true], ["shop", "/shop", false], ["checkout", "/checkout", true],
  ["orders", "/orders/CL-20512?tip=12.46", true], ["account", "/account", true], ["subs", "/account/subscriptions", true],
  ["join", "/join", false],
];
const browser = await chromium.launch({ channel: "chrome" });
for (const [w, h, tag] of [[1440, 900, "d"], [390, 844, "m"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(base + "/?gate"); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${tag}-gate.png` });
  await page.goto(base + "/?nogate"); await page.evaluate(() => localStorage.setItem("club-age-ok", "1"));
  for (const [name, path, full] of pages) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(name === "orders" ? 7000 : 900);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: full });
  }
  if (tag === "d") {
    await page.goto(base + "/shop", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
    await page.getByRole("button", { name: "Show phone" }).click(); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/d-shop-phone.png` });
    await page.getByRole("button", { name: "Hide phone" }).click();
    await page.getByRole("button", { name: /View details for Desert Bloom/ }).click(); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/d-drawer.png` });
    await page.goto(base + "/join", { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
    for (let i = 0; i < 2; i++) { await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(400); }
    await page.getByText("Book a telehealth visit").click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/d-join-med.png` });
    await page.getByRole("button", { name: "Request visit" }).click(); await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(400);
    await page.getByRole("radio", { name: /Saguaro Credit/ }).click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/d-join-bank.png` });
    await page.getByRole("button", { name: "Continue" }).click(); await page.getByRole("button", { name: "Join the Club" }).click(); await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/d-join-welcome.png` });
  } else {
    await page.goto(base + "/shop", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
    await page.getByRole("button", { name: /Open cart/ }).click(); await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/m-shop-sheet.png` });
  }
  await ctx.close();
}
await browser.close();
console.log("ok");
