"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MessageCircle, Pause, Pencil, Play, SkipForward } from "lucide-react";
import { BUNDLES, PERSONA, byId, money } from "@/lib/data";
import { SiteFooter } from "@/components/SiteChrome";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { SignedInOnly } from "@/components/SignedInOnly";
import { ProductArt } from "@/components/ProductArt";
import { Ledger } from "@/components/Ledger";

const BOX = [
  { id: "vap-001", qty: 1 },
  { id: "flw-001", qty: 2, bundle: BUNDLES[0].price_each },
];

export default function Subscriptions() {
  const [state, setState] = useState<"active" | "skipped" | "paused">("active");
  const retail = BOX.reduce((s, l) => s + byId(l.id).retail_price * l.qty, 0);
  const member = BOX.reduce((s, l) => s + (l.bundle ?? byId(l.id).member_price) * l.qty, 0);

  const next = state === "skipped" ? "January 7, 2027" : "December 7, 2026";

  return (
    <div className="min-h-dvh">
      <ShopHeader />
      <SignedInOnly>
      <main className="container-club pt-12 pb-24">
        <h1 className="display text-[44px] sm:text-[52px]">Your monthly box</h1>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <section aria-labelledby="box-items">
            <h2 id="box-items" className="sr-only">Items in your box</h2>
            <ul className="divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
              {BOX.map((l) => {
                const p = byId(l.id);
                return (
                  <li key={l.id} className="grid grid-cols-[96px_1fr] gap-5 py-6 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                    <div className="aspect-square overflow-hidden rounded-[12px] border border-[var(--color-hairline)]">
                      <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
                    </div>
                    <div>
                      <p className="text-[13px] text-[var(--color-muted)]">{p.brand}</p>
                      <p className="display text-[26px] leading-tight">{p.name}</p>
                      <p className="mt-1 text-[14px] text-[var(--color-muted)]">
                        {p.format} · Qty {l.qty}
                        {l.bundle && <> · Bundle: 2 or more at {money(l.bundle)} each</>}
                      </p>
                    </div>
                    <div className="col-start-2 sm:col-start-3">
                      <Ledger retail={p.retail_price} member={p.member_price} bundle={l.bundle} align="end" />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
              <p className="text-[var(--color-muted)]">
                Each month <span className="tnum line-through">{money(retail)}</span>
              </p>
              <p className="flex items-baseline gap-3">
                <span className="text-[14px] text-[var(--color-muted)]">Member price</span>
                <span className="num text-[36px] leading-none text-[var(--color-brass)]">{money(member)}</span>
              </p>
            </div>

            <Link
              href="/shop?ask=Change%20my%20monthly%20box"
              className="mt-12 flex items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] p-5 transition-colors hover:border-[var(--color-brass)]/60"
            >
              <MessageCircle size={20} strokeWidth={1.4} className="text-[var(--color-brass)]" aria-hidden />
              <span className="flex-1">
                <span className="block">&ldquo;Change my monthly box&rdquo;</span>
                <span className="block text-[14px] text-[var(--color-muted)]">Open the chat and tell {PERSONA.name} what to swap.</span>
              </span>
              <ArrowRight size={18} strokeWidth={1.4} className="text-[var(--color-muted)]" aria-hidden />
            </Link>
          </section>

          <aside aria-label="Delivery and controls" className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-7">
              <p className="flex items-center gap-2 text-[14px] text-[var(--color-muted)]">
                <CalendarDays size={16} strokeWidth={1.4} aria-hidden /> Next delivery
              </p>
              <p className="display mt-2 text-[34px] leading-none" aria-live="polite">
                {state === "paused" ? "Paused" : next}
              </p>
              <p className="mt-3 text-[14px] text-[var(--color-muted)]">
                {state === "paused"
                  ? "Nothing will be sent until you resume."
                  : state === "skipped"
                    ? "December is skipped. You won't be charged this month."
                    : "We'll text you two days before. Delivery is free."}
              </p>

              <div className="mt-7 grid gap-2.5">
                <Link href="/shop" className="btn btn-primary w-full">
                  <Pencil size={16} aria-hidden /> Edit box
                </Link>
                <button
                  className="btn btn-outline w-full"
                  onClick={() => setState(state === "skipped" ? "active" : "skipped")}
                  disabled={state === "paused"}
                >
                  <SkipForward size={16} aria-hidden /> {state === "skipped" ? "Undo skip" : "Skip a month"}
                </button>
                <button className="btn btn-outline w-full" onClick={() => setState(state === "paused" ? "active" : "paused")}>
                  {state === "paused" ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
                  {state === "paused" ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      </SignedInOnly>
      <SiteFooter />
    </div>
  );
}
