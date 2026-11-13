// Records the simulated iMessage thread (src/app/demo/imessage) with the real Nora answering.
// Usage: node scripts/record-imessage.mjs <out-dir>   (needs npm run dev on :3100 and npm run agent)
import { chromium } from "playwright";
import fs from "fs";
const OUT = process.argv[2] ?? ".impeccable/review/imessage";
fs.mkdirSync(OUT, { recursive: true });
const size = { width: 876, height: 1784 };
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext({ viewport: size, recordVideo: { dir: OUT, size } });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto("http://localhost:3100/demo/imessage?play=1&zoom=2&nogate", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__threadDone === true, null, { timeout: 180000 });
await p.screenshot({ path: `${OUT}/final.png` });
const texts = await p.$$eval("p.relative, a[href^='/shop/']", (els) => els.map((e) => (e.tagName === "A" ? "[link] " : "") + e.textContent.trim()));
console.log(texts.join("\n"));
const video = await p.video().path();
await ctx.close(); await b.close();
fs.renameSync(video, `${OUT}/thread.webm`);
console.log("video:", `${OUT}/thread.webm`);
