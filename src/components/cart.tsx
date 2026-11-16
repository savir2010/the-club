"use client";

import { Minus, Plus, X } from "lucide-react";
import { bundleFor, byId, MEMBER_SAVE_PCT, money, unitPrice, type Product } from "@/lib/data";
import { ProductArt } from "./ProductArt";
import { useSession } from "@/lib/session";

export type Line = { id: string; qty: number; fresh?: boolean };

export function totals(lines: Line[]) {
  let retail = 0;
  let member = 0;
  let count = 0;
  for (const l of lines) {
    const p = byId(l.id);
    retail += p.retail_price * l.qty;
    member += unitPrice(p, l.qty) * l.qty;
    count += l.qty;
  }
  return { retail, member, savings: retail - member, count };
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
      className="inline-flex h-8 items-center rounded-[8px] border border-[var(--color-hairline-strong)]"
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
  return (
    <li
      className={`group grid grid-cols-[56px_1fr] gap-3 rounded-[10px] px-2 py-3 ${line.fresh ? "animate-[slide-in_260ms_var(--ease-out)_both,row-glow_1600ms_var(--ease-out)_both]" : ""}`}
    >
      <button
        onClick={() => onOpen?.(p)}
        className="size-14 overflow-hidden rounded-[8px] border border-[var(--color-hairline)]"
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
            onClick={onRemove}
            className="-mt-1 -mr-1 grid size-7 shrink-0 place-items-center rounded-md text-[var(--color-faint)] hover:text-[var(--color-ivory)]"
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
      <div className="flex justify-between">
        <dt className="text-[var(--color-muted)]">Member savings ({MEMBER_SAVE_PCT}%)</dt>
        <dd className="tnum text-[var(--color-brass)]">−{money(t.savings)}</dd>
      </div>
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
