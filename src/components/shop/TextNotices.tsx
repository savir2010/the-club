"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check, MessageCircle, X } from "lucide-react";
import { findProduct, money, PERSONA } from "@/lib/data";
import { ProductArt } from "@/components/ProductArt";
import { bumpCart, flyToCart, sleep } from "./motion";

export type TextNotice =
  | { key: string; kind: "add" | "set" | "remove"; id: string; qty: number }
  | { key: string; kind: "order"; order: { id: string; items: number; total: number; day: string; window: string; to: string; path: string } };

/** What changed in the cart from a text to Nora, shown under the header next to the cart. */
export function TextNotices({ notices, onDismiss }: { notices: TextNotice[]; onDismiss: (key: string) => void }) {
  if (!notices.length) return null;
  return (
    <div className="pointer-events-none fixed top-[120px] right-3 z-[60] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2.5 md:top-[140px] md:right-5" aria-live="polite">
      {notices.map((n) => (
        <Notice key={n.key} n={n} onDismiss={() => onDismiss(n.key)} />
      ))}
    </div>
  );
}

function Notice({ n, onDismiss }: { n: TextNotice; onDismiss: () => void }) {
  const art = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (n.kind === "order") return;
    let gone = false;
    (async () => {
      if (n.kind === "add") {
        await sleep(450);
        if (!gone) await flyToCart(art.current);
      } else bumpCart();
    })();
    const t = window.setTimeout(onDismiss, 7000);
    return () => {
      gone = true;
      window.clearTimeout(t);
    };
    // once per notice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shell =
    "pointer-events-auto flex items-start gap-3 rounded-[16px] bg-[var(--color-raised)] p-3 pr-2 shadow-[var(--shadow-float)] ring-1 ring-[var(--color-hairline-strong)] animate-[fade-up_260ms_var(--ease-out)_both]";
  const tag = (
    <p className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-brass)]">
      <MessageCircle size={13} strokeWidth={2} aria-hidden /> By text with {PERSONA.name}
    </p>
  );
  const close = (
    <button className="icon-btn size-7 shrink-0" onClick={onDismiss} aria-label="Dismiss">
      <X size={14} />
    </button>
  );

  if (n.kind === "order") {
    const o = n.order;
    return (
      <div className={shell} role="status" data-text-notice="order">
        <span className="grid size-[52px] shrink-0 place-items-center rounded-[12px] bg-[var(--color-brass)] text-[var(--color-on-brass)]">
          <Check size={22} strokeWidth={2.4} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {tag}
          <p className="mt-0.5 text-[15px] font-semibold">Order {o.id} placed</p>
          <p className="tnum mt-0.5 text-[13px] text-[var(--color-muted)]">
            {o.items} item{o.items === 1 ? "" : "s"} · {money(o.total)} · {o.day} {o.window}
          </p>
          <Link href={o.path} onClick={onDismiss} className="btn btn-sm btn-primary mt-2.5 rounded-full">
            Track order
          </Link>
        </div>
        {close}
      </div>
    );
  }

  const p = findProduct(n.id);
  if (!p) return null;
  const what = n.kind === "add" ? `Added${n.qty > 1 ? ` × ${n.qty}` : ""}` : n.kind === "set" ? `Quantity set to ${n.qty}` : "Removed";
  return (
    <div className={shell} role="status" data-text-notice={n.kind}>
      <div ref={art} className="size-[52px] shrink-0 overflow-hidden rounded-[12px] bg-white ring-1 ring-[var(--color-hairline)]">
        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
      </div>
      <div className="min-w-0 flex-1">
        {tag}
        <p className="mt-0.5 truncate text-[15px] font-semibold">{p.name}</p>
        <p className="text-[13px] text-[var(--color-muted)]">{what} in your cart</p>
      </div>
      {close}
    </div>
  );
}
