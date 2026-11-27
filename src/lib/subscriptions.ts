"use client";

import { useSyncExternalStore } from "react";
import { SUBSCRIBE, subscribePct } from "@/lib/data";

/** One Subscribe & Save item: it arrives every `weeks` weeks, next on `next` (YYYY-MM-DD). */
export type Subscription = { id: string; qty: number; weeks: number; next: string; skipped?: boolean };

const KEY = "club-subscriptions";
const EVENT = "club-subscriptions";
// The demo member's subscriptions before they change anything.
const SEED: Subscription[] = [
  { id: "flw-001", qty: 2, weeks: 2, next: "2026-11-24" },
  { id: "vap-001", qty: 1, weeks: 4, next: "2026-12-07" },
];

let cache: Subscription[] | null = null;
function read(): Subscription[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Subscription[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}
function write(next: Subscription[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** YYYY-MM-DD for today plus `days`, in local time. */
export function isoIn(days: number, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const longDate = (iso: string) =>
  parse(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
/** The delivery after `iso` for a subscription that repeats every `weeks` weeks. */
export const after = (iso: string, weeks: number) => isoIn(weeks * 7, parse(iso));
/** When a subscription will actually arrive next (a skipped delivery moves to the one after). */
export const arrives = (s: Subscription) => {
  let next = s.skipped ? after(s.next, s.weeks) : s.next;
  const today = isoIn(0);
  for (let i = 0; next < today && i < 520; i++) next = after(next, s.weeks); // roll past dates forward on schedule
  return next;
};

export function useSubscriptions() {
  const subs = useSyncExternalStore(subscribe, read, () => SEED);
  const set = (fn: (s: Subscription[]) => Subscription[]) => write(fn(read()));
  return {
    subs,
    /** Subscribe & Save rate for this member right now. */
    pct: subscribePct(subs.length),
    find: (id: string) => subs.find((s) => s.id === id),
    /** Subscribe to items (or change the schedule of ones already subscribed). First delivery on `first`. */
    add: (items: { id: string; qty: number }[], weeks: number = SUBSCRIBE.default_weeks, first = isoIn(weeks * 7)) =>
      set((cur) => {
        const out = cur.filter((s) => !items.some((i) => i.id === s.id));
        return [...out, ...items.map((i) => ({ id: i.id, qty: i.qty, weeks, next: first }))];
      }),
    update: (id: string, patch: Partial<Subscription>) => set((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    cancel: (id: string) => set((cur) => cur.filter((s) => s.id !== id)),
  };
}
