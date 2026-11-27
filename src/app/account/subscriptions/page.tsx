"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, MessageCircle, Repeat, SkipForward, Undo2, X } from "lucide-react";
import { PERSONA, SUBSCRIBE, byId, everyLabel, money, subscribePrice } from "@/lib/data";
import { SiteFooter } from "@/components/SiteChrome";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { SignedInOnly } from "@/components/SignedInOnly";
import { ProductArt } from "@/components/ProductArt";
import { arrives, longDate, useSubscriptions, type Subscription } from "@/lib/subscriptions";

export default function Subscriptions() {
  const { subs, pct, update, cancel } = useSubscriptions();
  const toMulti = Math.max(0, SUBSCRIBE.multi_at - subs.length);

  // Upcoming deliveries, Amazon style: items arriving the same day travel together.
  const byDate = new Map<string, Subscription[]>();
  for (const s of [...subs].sort((a, b) => arrives(a).localeCompare(arrives(b)))) {
    byDate.set(arrives(s), [...(byDate.get(arrives(s)) ?? []), s]);
  }
  const dates = [...byDate.keys()];
  const lineTotal = (s: Subscription) => subscribePrice(byId(s.id).member_price, pct) * s.qty;

  return (
    <div className="min-h-dvh">
      <ShopHeader />
      <SignedInOnly>
        <main className="container-club pt-12 pb-24">
          <p className="flex items-center gap-2 text-[13px] font-medium tracking-[0.1em] text-[var(--color-brass)] uppercase">
            <Repeat size={15} aria-hidden /> Subscribe &amp; Save
          </p>
          <h1 className="display mt-2 text-[44px] sm:text-[52px]">Your subscriptions</h1>
          <p className="mt-2 max-w-[60ch] text-[var(--color-muted)]">
            Each item arrives on its own schedule at the member price, then {pct}% off. Change how often, skip a delivery or cancel anytime.
          </p>

          {/* the rate, and how to reach the higher one */}
          <div data-subscribe-rate className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-none bg-[var(--color-brass)]/[0.09] px-5 py-4 ring-1 ring-[var(--color-brass)]/30">
            <p className="num text-[40px] leading-none text-[var(--color-brass)]">{pct}%</p>
            <div className="min-w-[220px] flex-1">
              <p className="font-medium">{toMulti ? `You're saving ${pct}% on every subscribed delivery` : `You've unlocked ${SUBSCRIBE.pct_multi}% off`}</p>
              <p className="text-[14px] text-[var(--color-muted)]">
                {toMulti
                  ? `Subscribe to ${toMulti} more item${toMulti === 1 ? "" : "s"} to save ${SUBSCRIBE.pct_multi}% on all of them.`
                  : `${SUBSCRIBE.multi_at} or more subscriptions take ${SUBSCRIBE.pct_multi}% off every one.`}
              </p>
            </div>
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: SUBSCRIBE.multi_at }, (_, i) => (
                <span key={i} className={`h-px w-8 ${i < subs.length ? "bg-[var(--color-brass)]" : "bg-[var(--color-brass)]/20"}`} />
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
            <section aria-labelledby="upcoming">
              <h2 id="upcoming" className="display text-[28px]">Upcoming deliveries</h2>
              {!subs.length ? (
                <div className="mt-5 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-hairline-strong)] p-8 text-center">
                  <p className="text-[17px] font-medium">No subscriptions yet</p>
                  <p className="mt-1 text-[14px] text-[var(--color-muted)]">Choose Subscribe &amp; Save on any product, or switch it on at checkout.</p>
                  <Link href="/shop" className="btn btn-primary mt-5">Browse the shop</Link>
                </div>
              ) : (
                dates.map((d) => {
                  const group = byDate.get(d)!;
                  return (
                    <div key={d} className="mt-6" data-delivery={d}>
                      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-hairline)] pb-2">
                        <p className="flex items-center gap-2 font-medium">
                          <CalendarDays size={16} strokeWidth={1.5} className="text-[var(--color-brass)]" aria-hidden /> {longDate(d)}
                        </p>
                        <p className="tnum text-[14px] text-[var(--color-muted)]">
                          {group.reduce((n, s) => n + s.qty, 0)} item{group.reduce((n, s) => n + s.qty, 0) === 1 ? "" : "s"} ·{" "}
                          {money(group.reduce((n, s) => n + lineTotal(s), 0))}
                        </p>
                      </div>
                      <ul className="divide-y divide-[var(--color-hairline)]">
                        {group.map((s) => (
                          <Row key={s.id} s={s} pct={pct} total={lineTotal(s)} update={update} cancel={cancel} />
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </section>

            <aside aria-label="Summary" className="lg:sticky lg:top-[140px] lg:self-start">
              <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-7">
                <p className="flex items-center gap-2 text-[14px] text-[var(--color-muted)]">
                  <CalendarDays size={16} strokeWidth={1.4} aria-hidden /> Next delivery
                </p>
                <p className="display mt-2 text-[32px] leading-tight" aria-live="polite">{dates[0] ? longDate(dates[0]) : "None scheduled"}</p>
                <p className="mt-3 text-[14px] text-[var(--color-muted)]">We&rsquo;ll text you two days before. Delivery is always free.</p>
                <dl className="mt-6 space-y-2 border-t border-[var(--color-hairline)] pt-4 text-[14px]">
                  <div className="flex justify-between"><dt className="text-[var(--color-muted)]">Subscriptions</dt><dd className="tnum">{subs.length}</dd></div>
                  <div className="flex justify-between"><dt className="text-[var(--color-muted)]">Your rate</dt><dd className="tnum font-medium text-[var(--color-brass)]">{pct}% off</dd></div>
                </dl>
                <Link href="/shop" className="btn btn-primary mt-6 w-full">Add more items</Link>
              </div>
              <Link
                href={`/shop?ask=${encodeURIComponent("What should I add to my Subscribe & Save?")}`}
                className="mt-3 flex items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] p-5 transition-colors hover:border-[var(--color-brass)]/60"
              >
                <MessageCircle size={20} strokeWidth={1.4} className="text-[var(--color-brass)]" aria-hidden />
                <span className="flex-1">
                  <span className="block">Not sure what to add?</span>
                  <span className="block text-[14px] text-[var(--color-muted)]">{PERSONA.name} can suggest what you reorder most.</span>
                </span>
                <ArrowRight size={18} strokeWidth={1.4} className="text-[var(--color-muted)]" aria-hidden />
              </Link>
            </aside>
          </div>
        </main>
      </SignedInOnly>
      <SiteFooter />
    </div>
  );
}

function Row({
  s, pct, total, update, cancel,
}: {
  s: Subscription; pct: number; total: number;
  update: (id: string, patch: Partial<Subscription>) => void; cancel: (id: string) => void;
}) {
  const p = byId(s.id);
  return (
    <li data-subscription={s.id} className="grid grid-cols-[80px_1fr] gap-4 py-5 sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <Link href={`/shop/${p.id}`} className="aspect-square overflow-hidden rounded-none border border-[var(--color-hairline)] bg-[var(--color-plate)]">
        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
      </Link>
      <div className="min-w-0">
        <p className="text-[13px] text-[var(--color-muted)]">{p.brand}</p>
        <Link href={`/shop/${p.id}`} className="block text-[18px] leading-snug font-medium hover:underline">{p.name}</Link>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
          <select
            value={s.weeks}
            onChange={(e) => update(s.id, { weeks: +e.target.value })}
            className="field h-8 w-auto px-2.5 text-[13px]"
            aria-label={`How often ${p.name} arrives`}
          >
            {SUBSCRIBE.weeks.map((w) => <option key={w} value={w}>{everyLabel(w)}</option>)}
          </select>
          <select
            value={s.qty}
            onChange={(e) => update(s.id, { qty: +e.target.value })}
            className="field h-8 w-auto px-2.5 text-[13px]"
            aria-label={`Quantity of ${p.name}`}
          >
            {Array.from({ length: 6 }, (_, i) => <option key={i + 1} value={i + 1}>Qty {i + 1}</option>)}
          </select>
          <button className="btn btn-sm btn-text h-8 px-2" onClick={() => update(s.id, { skipped: !s.skipped })}>
            {s.skipped ? <><Undo2 size={14} aria-hidden /> Undo skip</> : <><SkipForward size={14} aria-hidden /> Skip next</>}
          </button>
          <button className="btn btn-sm btn-text h-8 px-2 text-[var(--color-muted)]" onClick={() => cancel(s.id)}>
            <X size={14} aria-hidden /> Cancel
          </button>
        </div>
        {s.skipped && <p className="mt-1.5 text-[12px] text-[var(--color-muted)]">{longDate(s.next)} is skipped. You won&rsquo;t be charged for it.</p>}
      </div>
      <div className="col-start-2 text-left sm:col-start-3 sm:text-right">
        <p className="tnum text-[13px] text-[var(--color-muted)] line-through">{money(p.retail_price * s.qty)}</p>
        <p className="num text-[24px] leading-none text-[var(--color-brass)]">{money(total)}</p>
        <p className="mt-1 text-[12px] text-[var(--color-muted)]">member price, then {pct}% off</p>
      </div>
    </li>
  );
}
