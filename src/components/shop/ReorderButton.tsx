"use client";

import { Repeat } from "lucide-react";
import { useShop } from "./ShopState";

/** Puts every item from a past order back in the cart and opens it. */
export function ReorderButton({ lines, className = "btn-text text-[14px]" }: { lines: { id: string; qty: number }[]; className?: string }) {
  const { add, setCartOpen } = useShop();
  return (
    <button
      className={className}
      onClick={() => {
        lines.forEach((l) => add(l.id, l.qty, false));
        setCartOpen(true);
      }}
    >
      <Repeat size={13} className="mr-1 inline" aria-hidden />
      Reorder
    </button>
  );
}
