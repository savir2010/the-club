"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { PRODUCTS, PERSONA } from "@/lib/data";
import { NoraAvatar } from "@/components/brand";
import { ProductArt } from "@/components/ProductArt";
import { useShop, type TextNotice } from "./ShopState";

/**
 * Cards for things the member really did by texting Nora: an item added or removed, or an order
 * placed. They appear only when a real text changed the shared cart (never for rehearsal texts).
 */
export function TextNotices() {
  const { notices, dismissNotice, setCartOpen } = useShop();
  if (!notices.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-[70] flex flex-col items-end gap-2.5 sm:top-[124px] sm:right-6 sm:bottom-auto sm:left-auto sm:w-[360px]" aria-live="polite">
      {notices.map((n) => (
        <Notice key={n.key} n={n} dismiss={dismissNotice} openCart={() => setCartOpen(true)} />
      ))}
    </div>
  );
}

function Notice({ n, dismiss, openCart }: { n: TextNotice; dismiss: (key: string) => void; openCart: () => void }) {
  const onClose = () => dismiss(n.key);
  // orders stay until closed; cart changes fade after a while
  useEffect(() => {
    if (n.kind === "order") return;
    const t = window.setTimeout(() => dismiss(n.key), 9000);
    return () => window.clearTimeout(t);
  }, [n.kind, n.key, dismiss]);

  const p = n.kind !== "order" ? PRODUCTS.find((x) => x.id === n.id) : null;
  return (
    <div
      data-text-notice={n.kind}
      className="pointer-events-auto w-full animate-[fade-up_320ms_var(--ease-out)_both] rounded-[var(--radius-card)] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] p-4 shadow-[0_18px_40px_-20px_rgb(17_17_17/0.5)]"
    >
      <div className="flex items-center gap-2.5">
        <NoraAvatar size={28} />
        <p className="flex-1 text-[12px] text-[var(--color-muted)]">
          <MessageCircle size={12} className="mr-1 inline -translate-y-px" aria-hidden />
          By text with {PERSONA.name} · just now
        </p>
        <button className="icon-btn -m-1.5 p-1.5 text-[var(--color-muted)]" onClick={onClose} aria-label="Dismiss">
          <X size={15} aria-hidden />
        </button>
      </div>

      {n.kind === "order" ? (
        <div className="mt-3">
          <p className="text-[15px] font-medium">Order {n.order.id} placed</p>
          <p className="tnum mt-1 text-[13px] text-[var(--color-muted)]">
            {n.order.items} item{n.order.items === 1 ? "" : "s"} · ${n.order.total.toFixed(2)} with tax · arriving {n.order.day.toLowerCase()} {n.order.window}
          </p>
          <Link href={n.order.path} onClick={onClose} className="btn btn-sm btn-primary mt-3 h-9 w-full">
            Track your order
          </Link>
        </div>
      ) : (
        p && (
          <div className="mt-3 flex items-center gap-3">
            <span className="size-12 shrink-0 overflow-hidden bg-[var(--color-plate)] ring-1 ring-[var(--color-hairline)]">
              <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{n.kind === "add" ? "Added to your cart" : "Removed from your cart"}</p>
              <p className="truncate text-[13px] text-[var(--color-muted)]">
                {n.kind === "add" && n.qty > 1 ? `${n.qty} × ` : ""}
                {p.name}
              </p>
            </div>
            {n.kind === "add" && (
              <button
                className="btn btn-sm btn-outline h-8 shrink-0 px-3"
                onClick={() => {
                  openCart();
                  onClose();
                }}
              >
                View cart
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
