// Delivery trip report (Arizona adult-use, demo).
// Every placed order is saved as a snapshot; the trip report is built from it with a random generator
// seeded by the order id, so the driver, vehicle and usage log are random per order but stable on reload.
// Money that matters for compliance is computed here from the catalog, never typed in.

import compliance from "../../agent/data/compliance.json";
import { ADDRESSES, findProduct, USUAL } from "./data";

export const COMPLIANCE = compliance;
export type Vehicle = (typeof compliance.fleet)[number];

/** What the checkout saves when an order is placed. */
export type OrderSnapshot = {
  id: string;
  placedAt: string; // ISO
  day: "Today" | "Tomorrow";
  slot: string; // e.g. "7:00–8:00 PM"
  addressId: string;
  lines: { id: string; qty: number }[];
  charged: number; // what the member paid for products (after member pricing and discounts, before tax and tip)
  tax: number;
  tip: number;
  total: number;
};

const KEY = "club-orders";

export function newOrderId() {
  return `CL-${Math.floor(20600 + Math.random() * 79000)}`;
}

export function saveOrder(o: OrderSnapshot) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, OrderSnapshot>;
    all[o.id] = o;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function loadOrder(id: string): OrderSnapshot | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, OrderSnapshot>;
    return all[id] ?? null;
  } catch {
    return null;
  }
}

/** Orders opened by link with no snapshot (another browser, an old link) fall back to the member's usual. */
export function fallbackOrder(id: string): OrderSnapshot {
  const now = new Date();
  return {
    id,
    placedAt: now.toISOString(),
    day: "Today",
    slot: "7:00–8:00 PM",
    addressId: "home",
    lines: USUAL.lines,
    charged: USUAL.total,
    tax: 0,
    tip: 0,
    total: USUAL.total,
  };
}

// --- seeded random ---------------------------------------------------------

function seedFrom(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- time helpers ----------------------------------------------------------

/** "7:00–8:00 PM" or "11:00 AM–12:00 PM" → minutes after midnight for start and end. */
export function parseSlot(slot: string): [number, number] {
  const [a, b] = slot.split(/[–-]/).map((s) => s.trim());
  const endMer = /PM/i.test(b) ? "PM" : "AM";
  const toMin = (s: string, fallbackMer: string) => {
    const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 0;
    let h = Number(m[1]) % 12;
    const mer = (m[3] ?? fallbackMer).toUpperCase();
    if (mer === "PM") h += 12;
    return h * 60 + Number(m[2]);
  };
  return [toMin(a, endMer), toMin(b, endMer)];
}

export const clock = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const dateOf = (o: OrderSnapshot) => {
  const d = new Date(o.placedAt);
  if (o.day === "Tomorrow") d.setDate(d.getDate() + 1);
  return d;
};

// --- the trip --------------------------------------------------------------

export type LogEntry = {
  trip: string;
  out: number; // minutes after midnight
  back: number | null; // null while the trip is open
  stops: number;
  retailValue: number;
  driver: string;
  current?: boolean;
};

export type Check = { label: string; detail: string; cite: string; status: "pass" | "pending" | "fail" };

export function buildTrip(o: OrderSnapshot) {
  const r = rng(seedFrom(o.id));
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const C = compliance;

  const driver = {
    name: `${pick(C.drivers.first)} ${pick(C.drivers.last)}`,
    card: `FA-${String(Math.floor(100000 + r() * 899999))}`,
    phone: `(602) 555-${String(Math.floor(200 + r() * 7700)).padStart(4, "0")}`,
  };
  const vehicle = pick(C.fleet);
  const date = dateOf(o);
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tripId = `TRP-${ymd}-${o.id.replace(/\D/g, "").slice(-4)}${String.fromCharCode(65 + Math.floor(r() * 26))}`;

  const items = o.lines
    .map((l) => ({ p: findProduct(l.id), qty: l.qty }))
    .filter((x): x is { p: NonNullable<typeof x.p>; qty: number } => !!x.p)
    .map(({ p, qty }) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      format: p.format,
      potency: p.potency,
      qty,
      retailEach: p.retail_price,
      retailValue: Math.round(p.retail_price * qty * 100) / 100,
    }));
  // The rule caps RETAIL value, so this uses retail price, not the discounted member price.
  const retailValue = Math.round(items.reduce((s, i) => s + i.retailValue, 0) * 100) / 100;
  const units = items.reduce((s, i) => s + i.qty, 0);

  // Route and times: leave so the driver arrives inside the window, then return to the premises.
  const [winStart, winEnd] = parseSlot(o.slot);
  const driveMin = 14 + Math.floor(r() * 14);
  const depart = winStart - driveMin - 6;
  const arrive = winStart + Math.floor(r() * Math.max(10, winEnd - winStart - 20));
  const returnAt = arrive + 8 + driveMin;
  const miles = Math.round((driveMin * 0.55 + r() * 2) * 10) / 10;
  const address = ADDRESSES.find((a) => a.id === o.addressId) ?? ADDRESSES[0];

  // Earlier trips by the same vehicle today: the daily usage record this trip is added to.
  const earlier: LogEntry[] = [];
  let t = 9 * 60 + Math.floor(r() * 50);
  const priorCount = Math.floor(r() * 4);
  for (let i = 0; i < priorCount; i++) {
    const len = 40 + Math.floor(r() * 50);
    if (t + len > depart - 20) break;
    earlier.push({
      trip: `TRP-${ymd}-${String(1000 + Math.floor(r() * 8999))}${String.fromCharCode(65 + Math.floor(r() * 26))}`,
      out: t,
      back: t + len,
      stops: 1 + Math.floor(r() * 3),
      retailValue: Math.round((60 + r() * 420) * 100) / 100,
      driver: `${pick(C.drivers.first)} ${pick(C.drivers.last)}`,
    });
    t += len + 30 + Math.floor(r() * 90);
  }
  const log: LogEntry[] = [
    ...earlier,
    { trip: tripId, out: depart, back: null, stops: 1, retailValue, driver: driver.name, current: true },
  ];

  const cap = C.max_vehicle_retail_value;
  const checks: Check[] = [
    {
      label: "Vehicle is on the vehicle register",
      detail: `${vehicle.unit} · ${vehicle.year} ${vehicle.make} ${vehicle.model} · plate ${vehicle.plate}`,
      cite: "R9-18-312.01(A)",
      status: "pass",
    },
    {
      label: "Trip added to the daily vehicle usage record",
      detail: `Date, usage period and retail value recorded (${log.length} ${log.length === 1 ? "trip" : "trips"} today on ${vehicle.unit})`,
      cite: "R9-18-312.01(A)",
      status: "pass",
    },
    {
      label: `Retail value in vehicle at or under ${money0(cap)}`,
      detail: `${money2(retailValue)} on board for this trip (${Math.round((retailValue / cap) * 1000) / 10}% of limit)`,
      cite: "R9-18-312.01",
      status: retailValue <= cap ? "pass" : "fail",
    },
    {
      label: "Copy of the consumer's order attached to the trip plan",
      detail: `Order ${o.id}, ${units} ${units === 1 ? "item" : "items"}, attached below`,
      cite: "R9-18-312.01 · R9-18-312(D)(1)",
      status: "pass",
    },
    {
      label: "Vehicle tracking active",
      detail: `GPS unit GT-${vehicle.vin6.slice(0, 4)} reporting for ${vehicle.unit}`,
      cite: "R9-18-312",
      status: "pass",
    },
    {
      label: "Surveillance and recording active",
      detail: `Cabin and cargo cameras recording, device DC-${vehicle.vin6.slice(2)}`,
      cite: "R9-18-312",
      status: "pass",
    },
    {
      label: "Products in locked, secured storage",
      detail: "Sealed bag in the locked cargo compartment; seal number on this report",
      cite: "R9-18-312",
      status: "pass",
    },
    {
      label: "Vehicle available for inspection",
      detail: `Can be presented to ADHS within ${C.inspection_window_hours} hours of a request`,
      cite: "R9-18-312.01(A)",
      status: "pass",
    },
    {
      label: "Age and ID verified at the door",
      detail: "Driver checks a valid government ID (21+) at hand-off and records it here",
      cite: "R9-18-312.01",
      status: "pending",
    },
    {
      label: "Return to premises logged",
      detail: "End of usage period recorded when the vehicle is back",
      cite: "R9-18-312.01(A)",
      status: "pending",
    },
  ];

  return {
    tripId,
    order: o,
    date,
    driver,
    vehicle,
    items,
    units,
    retailValue,
    cap,
    route: {
      from: C.premises.address,
      to: address.line,
      toLabel: address.label,
      depart,
      arrive,
      returnAt,
      winStart,
      winEnd,
      miles,
      driveMin,
    },
    seal: `SB-${String(Math.floor(1000000 + r() * 8999999))}`,
    log,
    checks,
    generatedAt: new Date(o.placedAt),
  };
}

export type Trip = ReturnType<typeof buildTrip>;

const money0 = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const money2 = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
