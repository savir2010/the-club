"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, IdCard, Pencil } from "lucide-react";
import { ADDRESSES, money } from "@/lib/data";
import { SiteFooter } from "@/components/SiteChrome";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ThemeSync } from "@/components/shop/ThemeToggle";

const STEPS = ["Confirmed", "Packed", "Out for delivery", "Delivered"] as const;

// Route through a fictional street grid, in map units (0–600 × 0–380)
const ROUTE: [number, number][] = [
  [70, 300], [70, 230], [210, 230], [210, 150], [360, 150], [360, 90], [500, 90], [500, 140],
];

function pointAt(t: number) {
  const segs = ROUTE.slice(1).map((p, i) => {
    const a = ROUTE[i];
    return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) };
  });
  const total = segs.reduce((s, x) => s + x.len, 0);
  let d = t * total;
  for (const s of segs) {
    if (d <= s.len) {
      const k = d / s.len;
      return [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k] as const;
    }
    d -= s.len;
  }
  return ROUTE[ROUTE.length - 1];
}

export function Tracking({ id, initialTip = 5, slot, to }: { id: string; initialTip?: number; slot?: string; to?: string }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tip, setTip] = useState(initialTip);
  const [editing, setEditing] = useState(false);

  // Scripted: Confirmed → Packed → Out for delivery, then the car moves
  useEffect(() => {
    const a = setTimeout(() => setStep(1), 2500);
    const b = setTimeout(() => setStep(2), 5000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  useEffect(() => {
    if (step < 2) return;
    const iv = setInterval(() => setProgress((p) => Math.min(1, p + 0.01)), 400);
    return () => clearInterval(iv);
  }, [step]);

  const [x, y] = pointAt(progress);
  const eta = Math.max(1, Math.round(22 * (1 - progress)));
  const routeD = useMemo(() => "M" + ROUTE.map((p) => p.join(" ")).join(" L"), []);

  return (
    <div className="min-h-dvh">
      <ThemeSync />
      <ShopHeader />
      <main className="container-club pt-12 pb-24">
        <h1 className="display text-[44px] sm:text-[52px]" aria-live="polite">
          {step < 2 ? (step === 0 ? "Your order is confirmed" : "Your order is packed") : `Arriving in about ${eta} min`}
        </h1>
        <p className="tnum mt-3 text-[15px] text-[var(--color-muted)]">Order {id} · Delivering to {(ADDRESSES.find((x) => x.label === to) ?? ADDRESSES.find((x) => x.id === "home"))!.line.split(",")[0]}{slot ? ` · ${slot}` : ""}</p>

        {/* Status steps */}
        <ol className="mt-10 grid grid-cols-4 gap-2" aria-label="Order status">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s} aria-current={current ? "step" : undefined}>
                <div className={`h-[3px] rounded-full transition-colors duration-500 ${i <= step ? "bg-[var(--color-brass)]" : "bg-[var(--color-hairline-strong)]"}`} />
                <p className={`mt-3 flex items-center gap-1.5 text-[13px] sm:text-[14px] ${i <= step ? "text-[var(--color-ivory)]" : "text-[var(--color-faint)]"}`}>
                  {done && <Check size={14} className="text-[var(--color-brass)]" aria-hidden />}
                  {s}
                  {done && <span className="sr-only">, complete</span>}
                  {current && <span className="sr-only">, current</span>}
                </p>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Mock map */}
          <figure className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--map-ground)]">
            <svg viewBox="0 0 600 380" className="block w-full" role="img" aria-label={`Map: driver is ${Math.round(progress * 100)}% of the way to you`}>
              <defs>
                <pattern id="blocks" width="70" height="70" patternUnits="userSpaceOnUse">
                  <rect width="70" height="70" style={{ fill: "var(--map-ground)" }} />
                  <rect x="6" y="6" width="58" height="58" rx="4" style={{ fill: "var(--map-block)" }} />
                </pattern>
              </defs>
              <rect width="600" height="380" fill="url(#blocks)" />
              <path d="M0 330 C 140 300, 260 360, 600 310" style={{ stroke: "var(--map-road)" }} strokeWidth="26" fill="none" />
              <path d="M430 0 L 560 380" style={{ stroke: "var(--map-road)" }} strokeWidth="14" fill="none" />
              <path d={routeD} style={{ stroke: "var(--color-ivory)" }} strokeOpacity="0.12" strokeWidth="5" fill="none" strokeLinejoin="round" />
              <path
                d={routeD}
                strokeWidth="3"
                fill="none"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - progress}
                style={{ stroke: "var(--color-brass)", transition: "stroke-dashoffset 400ms linear" }}
              />
              {/* Destination */}
              <g transform="translate(500 140)">
                <circle r="14" style={{ fill: "var(--color-brass)" }} opacity="0.18" />
                <circle r="6" style={{ fill: "var(--color-ivory)", stroke: "var(--map-road)" }} strokeWidth="2" />
              </g>
              <text x="500" y="172" textAnchor="middle" style={{ fill: "var(--color-muted)" }} fontSize="12" fontFamily="var(--font-manrope)">You</text>
              {/* Store */}
              <rect x="62" y="292" width="16" height="16" rx="3" style={{ fill: "var(--color-muted)" }} />
              {/* Driver */}
              <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 400ms linear" }}>
                <circle r="16" style={{ fill: "var(--color-brass)" }} opacity="0.2" className="motion-safe:animate-pulse" />
                <circle r="8" style={{ fill: "var(--color-brass)", stroke: "var(--map-road)" }} strokeWidth="3" />
              </g>
            </svg>
            <figcaption className="absolute bottom-3 left-4 text-[12px] text-[var(--color-faint)]">Illustrative map. Not real driver tracking.</figcaption>
          </figure>

          {/* Driver card */}
          <aside className="flex flex-col gap-6" aria-label="Your driver">
            <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-6">
              <div className="flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-full bg-[var(--color-raised-2)] ring-1 ring-[var(--color-hairline-strong)]">
                  <span className="display text-[26px] text-[var(--color-muted)]">M</span>
                </div>
                <div>
                  <p className="display text-[28px] leading-none">Marco</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-ivory)]">
                    <BadgeCheck size={16} strokeWidth={1.5} className="text-[var(--color-brass)]" aria-hidden />
                    Licensed delivery agent
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--color-hairline)] pt-5">
                <div>
                  <dt className="text-[12px] text-[var(--color-muted)]">{step < 2 && slot ? "Window" : "ETA"}</dt>
                  <dd className={`num mt-1 leading-none ${step < 2 && slot ? "text-[18px]" : "text-[26px]"}`}>{step < 2 ? (slot ? slot.replace(/^Today /, "") : "7:40 PM") : `${eta} min`}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--color-muted)]">Vehicle</dt>
                  <dd className="mt-1 text-[15px]">Gray sedan</dd>
                </div>
              </dl>
              <p className="mt-5 flex items-start gap-2.5 rounded-[10px] bg-[var(--color-canvas)] p-3.5 text-[14px]">
                <IdCard size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-[var(--color-brass)]" aria-hidden />
                Your driver will check your ID at the door.
              </p>

              <div className="mt-5 border-t border-[var(--color-hairline)] pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[15px]">Tip for Marco</p>
                  {!editing && (
                    <button className="btn-text inline-flex items-center gap-1 text-[14px]" onClick={() => setEditing(true)}>
                      <Pencil size={13} aria-hidden /> {money(tip)}
                    </button>
                  )}
                </div>
                {editing && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[...new Set([initialTip, 5, 8, 12])].map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setTip(v);
                          setEditing(false);
                        }}
                        aria-pressed={tip === v}
                        className={`tnum h-10 rounded-[10px] border text-[14px] ${tip === v ? "border-[var(--color-brass)] bg-[var(--color-brass)]/12" : "border-[var(--color-hairline-strong)] text-[var(--color-muted)]"}`}
                      >
                        {money(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
