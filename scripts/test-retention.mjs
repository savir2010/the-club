// Retention features: the Box, the usual, this week's picks (site and text), savings, members' drop.
// Agent started with NORA_SMS_BRIDGE=1 NORA_SMS_DRY_RUN=1 (npm run nora-sms:dry).
import { chromium } from "playwright";
import fs from "fs";
const OUT = ".impeccable/review/retention";
fs.mkdirSync(OUT, { recursive: true });
const U = "http://localhost:3100";
const A = "http://localhost:8100";
const HANDLE = "+14085550100";
const ok = (c, m) => { if (!c) { console.log("FAIL:", m); process.exitCode = 1; } else console.log("ok  ", m); };
const json = (u, o) => fetch(u, o).then((r) => r.json());
const post = (u, body) => json(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
const until = async (fn, ms = 90000) => { const end = Date.now() + ms; while (Date.now() < end) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 1000)); } return null; };
const cartIds = async () => (await json(`${A}/cart?since=0`)).lines.map((l) => `${l.id}x${l.qty}`).sort().join(",");

await post(`${A}/sms/reset`);
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("pageerror:", e.message));

// guest: the drop is locked, the Box band explains the offer
await p.goto(`${U}/shop?nogate&as=guest`, { waitUntil: "networkidle" });
await p.evaluate(() => sessionStorage.clear());
await p.reload({ waitUntil: "networkidle" });
ok(await p.getByRole("heading", { name: "Any 3 items, 15% off." }).isVisible(), "Box band on the storefront");
ok((await p.getByText("Members' early access").count()) === 0, "members' early access section is gone");
ok((await p.locator("[data-usual]").count()) === 0, "guest sees no 'your usual'");
await p.screenshot({ path: `${OUT}/01-guest.png`, fullPage: false });
await p.getByRole("heading", { name: "Any 3 items, 15% off." }).scrollIntoViewIfNeeded();
await p.screenshot({ path: `${OUT}/02-guest-box-drop.png` });

// member: usual, picks, savings
await p.goto(`${U}/shop?nogate&as=member`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
ok(await p.locator("[data-usual]").isVisible(), "member sees their usual");
ok(await p.locator("[data-saved]").getByText("$39.20").isVisible(), "member sees $39.20 saved");
ok(await p.locator("[data-text-picks]").isVisible(), "'Text me these' shows when texting is on");
await p.screenshot({ path: `${OUT}/03-member-for-you.png` });

// reorder the usual -> 2 items, one short of a box
await p.locator("[data-reorder]").click();
await p.waitForTimeout(800);
ok(await p.getByText("Add 1 more for 15% off").first().isVisible(), "box meter: 1 more to go");
ok(await until(async () => (await cartIds()) === "edb-003x1,vap-001x1", 8000), "reorder reached the shared cart");
await p.screenshot({ path: `${OUT}/04-cart-two.png` });
await p.keyboard.press("Escape");

// third item fills the box
await p.goto(`${U}/shop/flw-001?nogate`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Add to cart" }).first().click();
await p.waitForTimeout(900);
ok(await p.getByText("Your box is full · 15% off").first().isVisible(), "box meter: full");
const boxLine = await p.locator("[data-box-line] dd").first().textContent();
// 32.40 + 27.00 + 34.20 = 93.60 member; 15% = 14.04
ok(boxLine?.includes("14.04"), `box discount is $14.04 (got ${boxLine})`);
await p.screenshot({ path: `${OUT}/05-cart-box-full.png` });
await p.keyboard.press("Escape");

// account page
await p.goto(`${U}/account?nogate`, { waitUntil: "networkidle" });
ok(await p.locator("[data-saved]").getByText("$39.20").isVisible(), "account shows savings");
await p.screenshot({ path: `${OUT}/06-account.png` });

// texting: weekly picks, then "2" and "the usual"
// Only against a rehearsal agent (npm run nora-sms:dry): a live one would send real texts.
if (!(await json(`${A}/sms/status`)).dry_run) {
  console.log("skip texting checks: Nora is live (real iMessage). Run `npm run nora-sms:dry` to rehearse them.");
  await b.close();
  process.exit(0);
}
await post(`${A}/sms/reset`);
await post(`${A}/sms/register`, { phone: "(408) 555-0100" });
await p.evaluate(() => sessionStorage.clear());
await p.goto(`${U}/shop?nogate`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.locator("[data-text-picks]").click();
ok(await until(async () => (await p.getByText("Sent to your phone").isVisible()), 15000), "site confirms picks were texted");
const out1 = (await json(`${A}/sms/status`)).outbox.map((o) => o.text);
console.log("     texted:", JSON.stringify(out1));
ok(out1.some((t) => t.includes("Citrus Status")) && out1.some((t) => t.includes("Cherry Limeade")), "picks text names both products");

await post(`${A}/sms/inject`, { handle: HANDLE, text: "2 please" });
ok(await until(async () => (await cartIds()).includes("vap-005")), "'2' added Cherry Limeade");
ok((await p.getByText(/By text with/).count()) === 0, "no 'by text' pop-up on the website");
await p.screenshot({ path: `${OUT}/07-picked-by-text.png` });

await post(`${A}/sms/inject`, { handle: HANDLE, text: "also add the usual" });
ok(await until(async () => { const c = await cartIds(); return c.includes("vap-001") && c.includes("edb-003"); }), "'the usual' added the last order");
await new Promise((r) => setTimeout(r, 6000));
const out2 = (await json(`${A}/sms/status`)).outbox.map((o) => o.text);
console.log("     Nora:", JSON.stringify(out2.slice(out1.length)));
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/08-usual-by-text.png` });
await b.close();
