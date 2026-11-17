"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { BoxMeter, CartLine, CartSummary, SavingsBreakdown, totals } from "@/components/cart";
import { money } from "@/lib/data";
import { useSession } from "@/lib/session";
import { Monogram } from "@/components/brand";
import { useShop } from "./ShopState";

export function CartDrawer() {
  const { lines, setQty, remove, cartOpen, setCartOpen, setChatOpen } = useShop();
  const router = useRouter();
  const { member } = useSession();
  const t = totals(lines);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  // stay mounted for a short exit, so closing slides away instead of vanishing
  const [shown, setShown] = useState(cartOpen);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (cartOpen) {
      setShown(true);
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShown(false);
      setLeaving(false);
    }, 200);
    return () => window.clearTimeout(t);
  }, [cartOpen]);

  if (!shown) return null;
  return (
    <div className={`fixed inset-0 z-50 ${leaving ? "pointer-events-none" : ""}`} role="dialog" aria-modal="true" aria-label="Cart" data-leaving={leaving || undefined}>
      <button
        className="absolute inset-0 animate-[fade-up_180ms_var(--ease-out)_both] bg-[#2b261f]/25"
        style={leaving ? { animation: "scrim-out 200ms var(--ease-in) both" } : undefined}
        onClick={() => setCartOpen(false)}
        aria-label="Close cart"
        tabIndex={-1}
      />
      <aside
        style={leaving ? { animation: "drawer-out 200ms var(--ease-in) both" } : undefined}
        className="absolute inset-y-0 right-0 flex w-full max-w-[420px] animate-[slide-in_260ms_var(--ease-out)_both] flex-col border-l border-[var(--color-hairline)] bg-[var(--color-raised)] shadow-[var(--shadow-float)]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="display text-[28px]">Your cart</h2>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close cart" autoFocus>
            <X size={18} />
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <ShoppingBag size={28} strokeWidth={1.1} className="mx-auto text-[var(--color-faint)]" aria-hidden />
              <p className="mt-4 text-[15px]">Your cart is empty</p>
              <button
                className="btn-text mt-2 text-[14px] text-[var(--color-muted)]"
                onClick={() => {
                  setCartOpen(false);
                  setChatOpen(true);
                }}
              >
                Ask Nora to fill it
              </button>
            </div>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto px-3 py-2" aria-live="polite">
            {lines.map((l) => (
              <CartLine
                key={l.id}
                line={l}
                onQty={(q) => setQty(l.id, q)}
                onRemove={() => remove(l.id)}
                onOpen={(p) => {
                  setCartOpen(false);
                  router.push(`/shop/${p.id}`);
                }}
              />
            ))}
          </ul>
        )}
        <div className="border-t border-[var(--color-hairline)] px-5 pt-5 pb-6">
          {!member && lines.length > 0 && (
            <div className="mb-4 flex items-center gap-3 text-[14px]">
              <Monogram size={30} />
              <p className="leading-snug">
                <span className="font-semibold">Members pay <span className="tnum">{money(t.member)}</span></span>
                <span className="text-[var(--color-muted)]"> for this cart. You&rsquo;ll join in a few steps at checkout.</span>
              </p>
            </div>
          )}
          {!member && <SavingsBreakdown lines={lines} pitch className="mb-5" />}
          {lines.length > 0 && <BoxMeter lines={lines} className="mb-5" />}
          <CartSummary lines={lines} />
          <Link
            id="review-order"
            href="/checkout"
            aria-disabled={lines.length === 0}
            onClick={() => setCartOpen(false)}
            className={`btn btn-lg btn-primary mt-5 w-full ${lines.length === 0 ? "pointer-events-none opacity-40" : ""}`}
          >
            Proceed to checkout
          </Link>
          <p className="mt-3 text-center text-[12px] text-[var(--color-muted)]">
            {member ? "Your driver will check your ID at the door." : "Checkout is for members. Joining takes about five minutes."}
          </p>
        </div>
      </aside>
    </div>
  );
}
