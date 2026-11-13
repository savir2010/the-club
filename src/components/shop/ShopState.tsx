"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Line } from "@/components/cart";

type ShopState = {
  lines: Line[];
  add: (id: string, qty?: number, openCart?: boolean) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  phone: boolean;
  setPhone: (v: boolean) => void;
};

const Ctx = createContext<ShopState | null>(null);

// Shoppers arrive with an empty cart; it fills as they browse or ask Nora.
const START: Line[] = [];
const KEY = "club-cart";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>(START);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [phone, setPhone] = useState(false);

  // per-tab convenience only: the cart survives moving between grid and product pages
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(lines.map(({ id, qty }) => ({ id, qty }))));
    } catch {}
  }, [lines]);

  const add = useCallback((id: string, qty = 1, openCart = true) => {
    setLines((ls) =>
      ls.some((l) => l.id === id)
        ? ls.map((l) => (l.id === id ? { ...l, qty: l.qty + qty, fresh: true } : { ...l, fresh: false }))
        : [...ls.map((l) => ({ ...l, fresh: false })), { id, qty, fresh: true }],
    );
    if (openCart) setCartOpen(true);
  }, []);
  const setQty = useCallback(
    (id: string, qty: number) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty, fresh: false } : l))),
    [],
  );
  const remove = useCallback((id: string) => setLines((ls) => ls.filter((l) => l.id !== id)), []);

  const value = useMemo(
    () => ({ lines, add, setQty, remove, cartOpen, setCartOpen, chatOpen, setChatOpen, phone, setPhone }),
    [lines, add, setQty, remove, cartOpen, chatOpen, phone],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop must be used inside ShopProvider");
  return v;
}
