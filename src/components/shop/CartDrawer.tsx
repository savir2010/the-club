"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { CartLine, CartSummary, totals } from "@/components/cart";
import { MEMBER_SAVE_PCT, money } from "@/lib/data";
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

  if (!cartOpen) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Cart">
      <button className="absolute inset-0 animate-[fade-up_180ms_var(--ease-out)_both] bg-[#2b261f]/25" onClick={() => setCartOpen(false)} aria-label="Close cart" tabIndex={-1} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[420px] animate-[slide-in_260ms_var(--ease-out)_both] flex-col border-l border-[var(--color-hairline)] bg-[var(--color-raised)] shadow-[var(--shadow-float)]">
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
            <div className="mb-5 flex gap-3.5 rounded-[14px] border border-[var(--color-brass)]/35 bg-[var(--color-brass)]/[0.07] p-4">
              <Monogram size={34} />
              <div className="min-w-0 text-[14px]">
                <p className="font-semibold">Members save {MEMBER_SAVE_PCT}% on this cart</p>
                <p className="mt-0.5 leading-snug text-[var(--color-muted)]">
                  Members would pay only <span className="tnum font-semibold text-[var(--color-ivory)]">{money(t.member)}</span> instead of{" "}
                  <span className="tnum">{money(t.retail)}</span>, saving <span className="tnum text-[var(--color-brass)]">{money(t.savings)}</span>. You&rsquo;ll join in a few steps at checkout.
                </p>
              </div>
            </div>
          )}
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
