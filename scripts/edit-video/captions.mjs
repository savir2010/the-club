// Renders the edit's caption bubbles and title/end cards as PNGs in Manrope and the brand palette.
// Usage: node scripts/edit-video/captions.mjs <out-dir>
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const here = path.dirname(new URL(import.meta.url).pathname);
const CAPS = JSON.parse(fs.readFileSync(path.join(here, "captions.json"), "utf8"));
const fontB64 = fs.readFileSync("node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2").toString("base64");
const brand = fs.readFileSync("src/components/brand.tsx", "utf8");
const body = brand
  .slice(brand.indexOf('<g>\n        <rect width="64"'), brand.lastIndexOf("</svg>"))
  .replace(/\{\/\*.*?\*\/\}/g, "")
  .replace(/strokeWidth/g, "stroke-width")
  .replace(/strokeLinecap/g, "stroke-linecap");
const face = `<svg viewBox="0 0 64 64" width="100%" height="100%">${body}</svg>`;

const css = `@font-face{font-family:M;src:url(data:font/woff2;base64,${fontB64}) format("woff2");font-weight:200 800}
*{margin:0;box-sizing:border-box} body{background:transparent;font-family:M,sans-serif;-webkit-font-smoothing:antialiased}
.b{display:inline-flex;gap:22px;align-items:flex-start;padding:26px 34px 28px 26px;border-radius:30px;background:rgba(255,253,249,.95);
 box-shadow:0 30px 70px -28px rgba(60,44,20,.45),0 2px 8px rgba(60,44,20,.08),inset 0 0 0 1px rgba(43,38,31,.07)}
.av{flex:none;width:58px;height:58px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px rgba(141,107,61,.45)}
.me{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#efe6d8;color:#6f532c;font-size:24px;font-weight:650;box-shadow:inset 0 0 0 1.5px rgba(43,38,31,.12)}
.k{font-size:15px;font-weight:720;letter-spacing:.18em;color:#8d6b3d;text-transform:uppercase}
.t{margin-top:8px;font-size:36px;line-height:1.14;font-weight:640;letter-spacing:-.025em;color:#2b261f}
.q{margin-top:8px;font-size:34px;line-height:1.2;font-weight:580;letter-spacing:-.02em;color:#2b261f}
.q:before{content:"“"} .q:after{content:"”"}
.s{margin-top:10px;font-size:21px;line-height:1.42;color:#6c6457;font-weight:460}
.card{position:relative;width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#2b261f;
 background:radial-gradient(60% 70% at 25% 30%,rgba(201,164,106,.55),transparent 70%),radial-gradient(55% 60% at 80% 75%,rgba(226,190,150,.6),transparent 70%),radial-gradient(40% 40% at 60% 40%,rgba(255,253,247,.9),transparent 70%),linear-gradient(160deg,#fbf7f0,#f1e7d6 55%,#e8dbc4)}
.mono{width:86px;height:86px;border-radius:50%;border:1.5px solid #8d6b3d;display:grid;place-items:center;font-size:42px;font-weight:500}
.h1{font-size:112px;font-weight:620;letter-spacing:-.05em;line-height:1}
.h2{margin-top:26px;font-size:34px;color:#6c6457;font-weight:460;letter-spacing:-.01em}
.foot{position:absolute;bottom:56px;font-size:18px;color:#827969;letter-spacing:.02em}
.big{width:150px;height:150px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px rgba(141,107,61,.5),0 30px 60px -20px rgba(60,44,20,.5);margin-bottom:44px}`;

const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const c of CAPS) {
  let html;
  if (c.card === "title") html = `<div class="card"><div class="mono">C</div><div class="h1" style="margin-top:44px">Meet Nora</div><div class="h2">The members-only cannabis concierge for The Club</div><div class="foot">Product walkthrough · demo build</div></div>`;
  else if (c.card === "end") html = `<div class="card"><div class="big">${face}</div><div class="h1" style="font-size:92px">Tell us what you want.</div><div class="h1" style="font-size:92px;color:#8d6b3d;margin-top:12px">We bring it to your door.</div><div class="foot">The Club · Demo only · 21+ or 18+ with a valid Arizona medical marijuana card</div></div>`;
  else if (c.card === "bg") html = `<div class="card"></div>`;
  else html = `<div class="b" style="max-width:${c.w ?? 760}px">${c.who === "me" ? `<div class="me">D</div>` : `<div class="av">${face}</div>`}<div>${c.k ? `<div class="k">${c.k}</div>` : ""}${c.t ? `<div class="t">${c.t}</div>` : ""}${c.q ? `<div class="q">${c.q}</div>` : ""}${c.s ? `<div class="s">${c.s}</div>` : ""}</div></div>`;
  await p.setContent(`<style>${css}</style><div id=r style="display:inline-block;padding:${c.card ? 0 : 40}px">${html}</div>`);
  await p.evaluate(() => document.fonts.ready);
  await (await p.$(c.card ? ".card" : "#r")).screenshot({ path: `${OUT}/${c.id}.png`, omitBackground: !c.card });
}
await b.close();
console.log("rendered", CAPS.length, "to", OUT);
