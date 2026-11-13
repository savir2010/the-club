// Captures the shop grid, the Nora chat window, a product page and the cart drawer.
import { chromium } from "playwright";
const OUT = process.argv[2] ?? ".impeccable/review/shop";
const b = await chromium.launch({ channel: "chrome" });
for (const [w, h, tag] of [[1440, 900, "d"], [390, 844, "m"]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("pageerror", (e) => console.log(tag, "pageerror:", e.message));
  await p.goto("http://localhost:3100/?nogate"); await p.evaluate(() => localStorage.setItem("club-age-ok", "1"));
  await p.goto("http://localhost:3100/shop", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${tag}-grid.png` });
  await p.screenshot({ path: `${OUT}/${tag}-grid-full.png`, fullPage: true });
  await p.getByRole("button", { name: /Ask Nora, your concierge/ }).click(); await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${tag}-chat.png` });
  await p.goto("http://localhost:3100/shop/edb-003", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/${tag}-product.png` });
  await p.screenshot({ path: `${OUT}/${tag}-product-full.png`, fullPage: true });
  await p.getByRole("button", { name: "Add to cart", exact: true }).click(); await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${tag}-cart.png` });
}
await b.close();
console.log("ok");
