// The Tuesday demo flow, end to end, with Nora's texting in dry-run mode
// (agent started with NORA_SMS_BRIDGE=1 NORA_SMS_DRY_RUN=1):
//   guest browses and fills a basket → checkout gate → join (ID, AZDHS, bank, plan + mobile)
//   → the mobile is registered → a "text" to Nora adds an item → it appears in the website cart
//   → an item added on the website is in Nora's cart → a text places the order → the site shows it.
import { chromium } from "playwright";
import fs from "fs";
const OUT = ".impeccable/review/demo";
fs.mkdirSync(OUT, { recursive: true });
const U = "http://localhost:3100";
const A = "http://localhost:8100";
const PHONE = "(408) 555-0100"; // fake test number
const HANDLE = "+14085550100";
const ok = (c, m) => { if (!c) { console.log("FAIL:", m); process.exitCode = 1; } else console.log("ok  ", m); };
const json = (u, o) => fetch(u, o).then((r) => r.json());
const text = (t) => fetch(`${A}/sms/inject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle: HANDLE, text: t }) }).then((r) => r.json());
const until = async (fn, ms = 90000) => { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 1000)); } return null; };

// This test registers a made-up mobile and texts Nora, so it runs only against a rehearsal agent.
if (!(await json(`${A}/sms/status`)).dry_run) {
  console.log("Nora is live (real iMessage). Run this test against `npm run nora-sms:dry` instead.");
  process.exit(1);
}
await fetch(`${A}/sms/reset`, { method: "POST" });
const b = await chromium.launch({ channel: "chrome" });
// RECORD=1 saves a video of the run (a backup for the demo) to .impeccable/review/demo/video
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...(process.env.RECORD ? { recordVideo: { dir: `${OUT}/video`, size: { width: 1440, height: 900 } } } : {}) });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("pageerror:", e.message));
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

// 1. browse as a guest and fill a basket
await p.goto(`${U}/shop?nogate&as=guest`, { waitUntil: "networkidle" });
await p.evaluate(() => sessionStorage.clear());
await p.goto(`${U}/shop/edb-003?nogate`, { waitUntil: "networkidle" });
ok(await p.getByText(/save 10%/).first().isVisible(), "product page shows the 10% member saving");
await p.getByRole("button", { name: "Add to cart" }).first().click(); await p.waitForTimeout(700);
ok(await p.locator("[data-savings]").getByText("Join and save").isVisible(), "cart drawer shows what joining saves");
await shot("01-cart-guest");
await p.getByRole("link", { name: "Proceed to checkout" }).click();
await p.waitForURL("**/checkout"); await p.waitForTimeout(800);

// 2. join: account (with mobile), ID, AZDHS, bank, plan
await p.getByLabel("Mobile number").fill(PHONE);
await p.getByRole("button", { name: "Continue" }).click(); await p.waitForTimeout(300);
await p.getByRole("button", { name: /sample ID/ }).click();
await p.getByRole("button", { name: /Verify my ID/ }).click();
await p.getByText("ID verified").waitFor();
await p.getByRole("button", { name: "Continue" }).click(); await p.waitForTimeout(300);
await p.locator("[data-az-check]").waitFor();
await p.getByText("Eligible to buy in Arizona").waitFor({ timeout: 10000 });
ok(true, "Arizona validity check runs by itself and passes");
await shot("02-azdhs");
await p.getByRole("button", { name: "Continue" }).click(); await p.waitForTimeout(300);
await p.getByRole("button", { name: "Chase" }).click();
await p.getByRole("button", { name: "Continue to Chase" }).click();
await p.getByRole("button", { name: "Verify" }).click();
await p.getByRole("button", { name: /Link checking/ }).click(); await p.getByText("linked.").waitFor();
await p.getByRole("button", { name: "Continue" }).click(); await p.waitForTimeout(600);
ok(!(await p.getByText("$__").count()), "plan shows real fees, not $__");
ok(await p.getByText(/Save \(408\) 555-0111 as Nora/).waitFor({ timeout: 5000 }).then(() => true).catch(() => false), "plan shows Nora's number to save");
await shot("03-plan");
await p.getByRole("button", { name: /Start membership/ }).click();
const reg = await until(async () => (await json(`${A}/sms/status`)).registered.includes(HANDLE) || null, 8000);
ok(reg, "joining registered the member's mobile with Nora");
await p.getByRole("button", { name: "Continue to delivery" }).click(); await p.waitForTimeout(800);

// 3. the website cart reached the shared cart
await p.goto(`${U}/shop?nogate`, { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
const shared = await json(`${A}/cart`);
ok(shared.lines.some((l) => l.id === "edb-003"), "basket from the website is in Nora's shared cart");

// 4. a text adds something; the website shows it
const before = (await json(`${A}/cart`)).lines.length;
ok((await text("hey nora can you add the LA Baker flower to my cart")).ok, "text sent to Nora (dry run)");
const added = await until(async () => (await json(`${A}/cart`)).lines.length > before || null);
ok(added, "Nora added the item from the text");
const counted = await until(async () => (await p.locator("#cart-button").getAttribute("aria-label")).includes("2 items") || null, 8000);
ok(counted, "website cart count picks up the item from the text");
ok((await p.getByText(/By text with/).count()) === 0, "no 'by text' pop-up on the website");
await p.waitForTimeout(300); await shot("04-added-by-text");
await p.waitForTimeout(1500);
await p.locator("#cart-button").click(); await p.waitForTimeout(600);
ok(await p.getByRole("dialog", { name: "Cart" }).getByText("LA Baker").first().isVisible(), "item from the text is in the website cart");
await shot("05-cart-after-text");
await p.keyboard.press("Escape");

// 5. order by text; the website shows the order
const s0 = await json(`${A}/sms/status`);
const out0 = s0.outbox.length;
await text("perfect. deliver tonight 8 to 9 at home, place the order");
let st = await until(async () => { const s = await json(`${A}/sms/status`); return s.orders > s0.orders ? s : null; }, 45000);
if (!st) { // Nora may confirm first; say yes
  await text("yes place it");
  st = await until(async () => { const s = await json(`${A}/sms/status`); return s.orders > s0.orders ? s : null; });
}
ok(st, "Nora placed the order by text");
const emptied = await until(async () => (await p.locator("#cart-button").getAttribute("aria-label")).includes("0 items") || null, 8000);
ok(emptied, "website cart empties once the order is placed");
ok((await p.getByText(/placed/).count()) === 0, "no order pop-up on the website");
await shot("06-order-by-text");
ok((await json(`${A}/cart`)).lines.length === 0, "cart is empty after the order");
await new Promise((r) => setTimeout(r, 6000)); // let the confirmation texts go out
const out = (await json(`${A}/sms/status`)).outbox.slice(out0).map((m) => m.text);
console.log("\n--- Nora's texts ---\n" + out.join("\n---\n"));
await ctx.close();
await b.close();
