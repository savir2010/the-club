"use client";

import { useRef } from "react";
import { Minus, Plus, X } from "lucide-react";
import { BOX, boxDiscount, bundleFor, byId, MEMBER_SAVE_PCT, money, unitPrice, type Product } from "@/lib/data";
import { ProductArt } from "./ProductArt";
import { useSession } from "@/lib/session";

export type Line = { id: string; qty: number; fresh?: boolean };

export function totals(lines: Line[]) {
  let retail = 0;
  let base = 0;
  let count = 0;
  for (const l of lines) {
    const p = byId(l.id);
    retail += p.retail_price * l.qty;
    base += unitPrice(p, l.qty) * l.qty;
    count += l.qty;
  }
  // The Box: a full box (any BOX.size items) takes BOX.pct off the member subtotal.
  const box = boxDiscount(count, base);
  const member = Math.round((base - box) * 100) / 100;
  return { retail, base, box, boxed: box > 0, toBox: Math.max(0, BOX.size - count), member, savings: retail - member, count };
}

/** Progress toward a full box: three slots that fill with what's in the cart. */
export function BoxMeter({ lines, className = "" }: { lines: Line[]; className?: string }) {
  const { member } = useSession();
  const t = totals(lines);
  const units = lines.flatMap((l) => Array.from({ length: l.qty }, () => l.id));
  const extra = Math.max(0, units.length - BOX.size);
  return (
    <div
      data-box-meter={t.boxed ? "full" : t.count}
      className={`flex items-center gap-4 border p-4 transition-colors duration-500 ${t.boxed ? "border-[var(--color-ivory)] bg-[var(--color-raised-2)]" : "border-[var(--color-hairline-strong)]"} ${className}`}
    >
      <div className="flex shrink-0 gap-1.5" aria-hidden>
        {Array.from({ length: BOX.size }, (_, i) => {
          const id = units[i];
          if (!id) return <span key={i} className="grid h-12 w-10 place-items-center border border-[var(--color-hairline-strong)] text-[14px] font-light text-[var(--color-faint)]">+</span>;
          const p = byId(id);
          return (
            <span key={i} className="relative h-12 w-10 overflow-hidden animate-[fade-up_360ms_var(--ease-out)_both]">
              <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
              {i === BOX.size - 1 && extra > 0 && (
                <span className="tnum absolute inset-0 grid place-items-center bg-[#111111]/60 text-[12px] font-medium text-white">+{extra}</span>
              )}
            </span>
          );
        })}
      </div>
      <div className="min-w-0 text-[13px] leading-snug">
        <p className="display text-[18px] leading-tight">
          {t.boxed ? `Your box is full · ${BOX.pct}% off` : `Add ${t.toBox} more for ${BOX.pct}% off`}
        </p>
        <p className="mt-0.5 text-[var(--color-muted)]">
          {t.boxed
            ? `${member ? "You save" : "Members save"} another ${money(t.box)} on this order.`
            : `Any ${BOX.size} items make a box. Mix and match.`}
        </p>
      </div>
    </div>
  );
}

export function Stepper({
  qty,
  onChange,
  label,
}: {
  qty: number;
  onChange: (q: number) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex h-8 items-center rounded-none border border-[var(--color-hairline-strong)]"
      role="group"
      aria-label={`Quantity for ${label}`}
    >
      <button
        className="grid h-full w-8 place-items-center text-[var(--color-muted)] hover:text-[var(--color-ivory)] disabled:opacity-30"
        onClick={() => onChange(qty - 1)}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="tnum w-6 text-center text-[14px]" aria-live="polite">
        {qty}
      </span>
      <button
        className="grid h-full w-8 place-items-center text-[var(--color-muted)] hover:text-[var(--color-ivory)]"
        onClick={() => onChange(qty + 1)}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export function CartLine({
  line,
  onQty,
  onRemove,
  onOpen,
}: {
  line: Line;
  onQty: (q: number) => void;
  onRemove: () => void;
  onOpen?: (p: Product) => void;
}) {
  const p = byId(line.id);
  const row = useRef<HTMLLIElement>(null);
  // slide the row away, then remove it
  const removeSoftly = () => {
    const el = row.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onRemove();
    el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(24px)" }], { duration: 180, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" })
      .finished.then(onRemove, onRemove);
  };
  return (
    <li
      ref={row}
      className={`group grid grid-cols-[56px_1fr] gap-3 rounded-none px-2 py-3 ${line.fresh ? "animate-[slide-in_260ms_var(--ease-out)_both,row-glow_1600ms_var(--ease-out)_both]" : ""}`}
    >
      <button
        onClick={() => onOpen?.(p)}
        className="size-14 overflow-hidden rounded-none border border-[var(--color-hairline)]"
        aria-label={`View ${p.name}`}
      >
        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
      </button>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">{p.name}</p>
            <p className="text-[12px] text-[var(--color-muted)]">
              {p.brand} · {p.format}
            </p>
          </div>
          <button
            onClick={removeSoftly}
            className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-none text-[var(--color-faint)] hover:text-[var(--color-ivory)]"
            aria-label={`Remove ${p.name}`}
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <Stepper qty={line.qty} onChange={onQty} label={p.name} />
          <LinePrice p={p} qty={line.qty} />
        </div>
      </div>
    </li>
  );
}

/** Line total in the member ledger: retail struck, member in brass, bundle tier when it applies. */
export function LinePrice({ p, qty, size = 18 }: { p: Product; qty: number; size?: number }) {
  const { member } = useSession();
  const b = bundleFor(p);
  if (!member)
    return (
      <div className="flex flex-col items-end">
        <span className="num leading-none" style={{ fontSize: size }}>
          {money(p.retail_price * qty)}
        </span>
        <span className="mt-1 text-[11px] text-[var(--color-muted)]">
          Club <span className="tnum text-[var(--color-brass)]">{money(unitPrice(p, qty) * qty)}</span>
        </span>
      </div>
    );
  const bundled = !!b && qty >= b.min_qty;
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-baseline gap-2">
        <span className="tnum text-[12px] text-[var(--color-muted)] line-through">
          <span className="sr-only">Retail </span>
          {money(p.retail_price * qty)}
        </span>
        <span
          className={`num leading-none text-[var(--color-brass)] ${bundled ? "line-through decoration-1 opacity-60" : ""}`}
          style={{ fontSize: bundled ? size * 0.8 : size }}
        >
          <span className="sr-only">Member </span>
          {money(p.member_price * qty)}
        </span>
      </div>
      {bundled && (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[11px] text-[var(--color-muted)]">
            Bundle · {qty} × {money(b.price_each)}
          </span>
          <span className="num leading-none text-[var(--color-brass-hi)]" style={{ fontSize: size }}>
            {money(b.price_each * qty)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * The savings, front and centre: the total saved in large brass type, then each discount on its own
 * line with its percentage (member price, then the Box). Before the box is full, the Box line shows
 * what one more item would unlock. `pitch` is the guest version: what joining would save.
 */
export function SavingsBreakdown({
  lines, pitch = false, className = "", subscribe,
}: { lines: Line[]; pitch?: boolean; className?: string; subscribe?: { pct: number; amount: number } }) {
  const t = totals(lines);
  if (!t.count) return null;
  const memberOff = t.retail - t.base;
  const saved = t.savings + (subscribe?.amount ?? 0);
  const pctOff = Math.round((saved / t.retail) * 100);
  const chip = (txt: string, on = true) => (
    <span
      className={`tnum inline-flex min-w-[40px] text-[13px] ${
        on ? "text-[var(--color-ivory)]" : "text-[var(--color-muted)]"
      }`}
    >
      {txt}
    </span>
  );
  return (
    <div data-savings className={`rounded-none bg-[var(--color-brass)]/[0.09] p-4 ring-1 ring-[var(--color-brass)]/30 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="display text-[20px] leading-tight">{pitch ? "Join and save" : "You're saving"}</p>
          <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">{pctOff}% off retail on this order</p>
        </div>
        <p className="num text-[34px] leading-none text-[var(--color-brass)]" data-savings-total>
          {money(saved)}
        </p>
      </div>
      <dl className="mt-3.5 space-y-2 border-t border-[var(--color-brass)]/20 pt-3 text-[14px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2.5">{chip(`−${MEMBER_SAVE_PCT}%`)} Member prices</dt>
          <dd className="tnum font-medium text-[var(--color-brass)]">−{money(memberOff)}</dd>
        </div>
        {t.boxed ? (
          <div className="flex items-center justify-between gap-3" data-box-line>
            <dt className="flex items-center gap-2.5">{chip(`−${BOX.pct}%`)} Box of {t.count}</dt>
            <dd className="tnum font-medium text-[var(--color-brass)]">−{money(t.box)}</dd>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
            <dt className="flex items-center gap-2.5">{chip(`−${BOX.pct}%`, false)} Box</dt>
            <dd className="text-[13px]">Add {t.toBox} more to unlock</dd>
          </div>
        )}
        {subscribe && subscribe.amount > 0 && (
          <div className="flex items-center justify-between gap-3" data-subscribe-line>
            <dt className="flex items-center gap-2.5">{chip(`−${subscribe.pct}%`)} Subscribe &amp; Save</dt>
            <dd className="tnum font-medium text-[var(--color-brass)]">−{money(subscribe.amount)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function CartSummary({ lines }: { lines: Line[] }) {
  const { member } = useSession();
  const t = totals(lines);
  if (!member)
    return (
      <dl className="space-y-2.5 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-[var(--color-muted)]">Items ({t.count})</dt>
          <dd className="tnum">{money(t.retail)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-muted)]">Delivery</dt>
          <dd>Free</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-[var(--color-hairline)] pt-3">
          <dt className="font-medium">Subtotal</dt>
          <dd className="num text-[26px] leading-none">{money(t.retail)}</dd>
        </div>
      </dl>
    );
  return (
    <dl className="space-y-2.5 text-[14px]">
      <div className="flex justify-between">
        <dt className="text-[var(--color-muted)]">Retail value</dt>
        <dd className="tnum text-[var(--color-muted)] line-through">{money(t.retail)}</dd>
      </div>
      <SavingsBreakdown lines={lines} />
      <div className="flex justify-between">
        <dt className="text-[var(--color-muted)]">Delivery</dt>
        <dd>Free</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-[var(--color-hairline)] pt-3">
        <dt className="font-medium">Subtotal</dt>
        <dd className="num text-[26px] leading-none">{money(t.member)}</dd>
      </div>
    </dl>
  );
}
