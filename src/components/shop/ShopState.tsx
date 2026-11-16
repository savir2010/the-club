"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Line } from "@/components/cart";
import { useSession } from "@/lib/session";
import { TextNotices, type TextNotice } from "./TextNotices";

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
const POLL_MS = 1200;

type CartEvent = {
  v: number;
  source: string;
  kind: "add" | "set" | "remove" | "sync" | "order" | "reset";
  id?: string;
  qty?: number;
  order?: { id: string; items: number; total: number; day: string; window: string; to: string; path: string };
};

const plain = (ls: Line[]) => ls.map(({ id, qty }) => ({ id, qty }));
const same = (a: Line[], b: Line[]) => JSON.stringify(plain(a)) === JSON.stringify(plain(b));

export function ShopProvider({ children }: { children: ReactNode }) {
  const { member, ready } = useSession();
  const [lines, setLines] = useState<Line[]>(START);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [notices, setNotices] = useState<TextNotice[]>([]);

  // per-tab convenience only: the cart survives moving between grid and product pages
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(plain(lines)));
    } catch {}
  }, [lines]);

  /*
   * Members share one cart with Nora's text thread. The site sends its own changes to the agent
   * and polls for changes made by text, which arrive with a notice and fly into the cart.
   * Guests keep a cart in this tab only.
   */
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const version = useRef(0);
  const synced = useRef(false);
  const remote = useRef<Line[] | null>(null); // last cart taken from the agent; not sent back

  useEffect(() => {
    if (!ready || !member) {
      synced.current = false;
      return;
    }
    let stop = false;
    let timer: number | undefined;

    const push = async (ls: Line[]) => {
      const r = await fetch("/api/nora/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: plain(ls) }) });
      if (r.ok) version.current = Math.max(version.current, (await r.json()).v);
    };

    const poll = async () => {
      try {
        const r = await fetch(`/api/nora/cart?since=${version.current}`, { cache: "no-store" });
        if (r.ok) {
          const d: { v: number; lines: Line[]; events: CartEvent[] } = await r.json();
          if (d.v < version.current) version.current = 0; // the agent restarted
          const theirs = d.events.filter((e) => e.source !== "web");
          version.current = Math.max(version.current, d.v);
          if (theirs.length && !same(d.lines, linesRef.current)) {
            const added = new Set(theirs.filter((e) => e.kind === "add").map((e) => e.id));
            remote.current = d.lines;
            setLines(d.lines.map((l) => ({ ...l, fresh: added.has(l.id) })));
          }
          const fresh: TextNotice[] = theirs.flatMap((e): TextNotice[] =>
            e.kind === "add" && e.id ? [{ key: `${e.v}`, kind: "add", id: e.id, qty: e.qty ?? 1 }]
            : e.kind === "remove" && e.id ? [{ key: `${e.v}`, kind: "remove", id: e.id, qty: 0 }]
            : e.kind === "set" && e.id ? [{ key: `${e.v}`, kind: "set", id: e.id, qty: e.qty ?? 1 }]
            : e.kind === "order" && e.order ? [{ key: `${e.v}`, kind: "order", order: e.order }]
            : [],
          );
          if (fresh.length) setNotices((ns) => [...ns, ...fresh].slice(-4));
        }
      } catch {}
      if (!stop) timer = window.setTimeout(poll, POLL_MS);
    };

    (async () => {
      try {
        const r = await fetch("/api/nora/cart?since=0", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const d: { v: number; lines: Line[] } = await r.json();
        version.current = d.v;
        // What's in this tab wins (a guest who just joined keeps their basket); otherwise pick up
        // the cart from the text thread.
        if (linesRef.current.length) await push(linesRef.current);
        else if (d.lines.length) {
          remote.current = d.lines;
          setLines(d.lines);
        }
        synced.current = true;
      } catch {}
      if (!stop) timer = window.setTimeout(poll, POLL_MS);
    })();

    return () => {
      stop = true;
      synced.current = false;
      window.clearTimeout(timer);
    };
  }, [member, ready]);

  // send the site's own changes (never echo back a cart that just came from the agent)
  useEffect(() => {
    if (!member || !synced.current) return;
    if (remote.current && same(remote.current, lines)) return;
    remote.current = null;
    const t = window.setTimeout(() => {
      fetch("/api/nora/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: plain(lines) }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && (version.current = Math.max(version.current, d.v)))
        .catch(() => {});
    }, 250);
    return () => window.clearTimeout(t);
  }, [lines, member]);

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
  const dismiss = useCallback((key: string) => setNotices((ns) => ns.filter((n) => n.key !== key)), []);

  const value = useMemo(
    () => ({ lines, add, setQty, remove, cartOpen, setCartOpen, chatOpen, setChatOpen, phone, setPhone }),
    [lines, add, setQty, remove, cartOpen, chatOpen, phone],
  );
  return (
    <Ctx.Provider value={value}>
      {children}
      <TextNotices notices={notices} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useShop() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShop must be used inside ShopProvider");
  return v;
}
