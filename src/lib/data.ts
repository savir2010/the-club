// Demo data. Products, brands, descriptions and photos come from the Sol Flower (Copperstate Farms)
// menu, used with the founder's permission; ratings, member prices, people and addresses are demo values.
// Field names match the catalog.json spec in the demo brief so the real menu can drop in.

// The catalog, bundles, member and persona live in /data as JSON, shared with the Python agent.
import catalog from "../../agent/data/catalog.json";
import bundles from "../../agent/data/bundles.json";
import member from "../../agent/data/member.json";
import persona from "../../agent/data/persona.json";
import settings from "../../agent/data/settings.json";

export type Category =
  | "Flower"
  | "Pre-rolls"
  | "Vapes"
  | "Edibles"
  | "Concentrates"
  | "Tinctures"
  | "Topicals";

export type Product = {
  id: string;
  brand: string;
  house_brand: boolean;
  name: string;
  category: Category;
  strain_type: "Indica" | "Sativa" | "Hybrid" | "CBD";
  format: string;
  potency: string;
  effects: string[];
  flavor: string[];
  retail_price: number;
  member_price: number;
  in_stock: boolean;
  description: string;
  image: string;
  rating: number;
  review_count: number;
  source_url?: string;
  /** Optional second photograph (detail, texture, open pack). Shown on hover in the product grid. */
  image_alt?: string;
};

/**
 * Editorial plates: every product photo is set on one warm ground at 4:5 (public/img/products/editorial,
 * made from the menu photos). The alternate plate is a close detail of the same pack on a deeper ground,
 * used until a real second photograph is supplied as `image_alt` in the catalog.
 */
export const plateImage = (image: string) => image.replace(/^\/img\/products\/([^/]+)\.jpg$/, "/img/products/editorial/$1.jpg");
/** The same plate with its grey ground cut out (public/img/products/cutout, made by scripts/cutout-plates.py),
 * so a tile can sit on the page colour and show the grey only on hover. */
export const plateCutout = (image: string) => image.replace(/^\/img\/products\/([^/]+)\.jpg$/, "/img/products/cutout/$1.webp");
export const plateAlt = (p: { image: string; image_alt?: string }) =>
  p.image_alt ?? p.image.replace(/^\/img\/products\/([^/]+)\.jpg$/, "/img/products/editorial/$1-alt.jpg");

const CATEGORY_NAMES: Category[] = ["Flower", "Pre-rolls", "Vapes", "Edibles", "Concentrates", "Topicals"];

export const EFFECTS = ["Relaxed", "Calm", "Happy", "Sleepy", "Energetic", "Creative", "Focused"];
export const BRANDS = [...new Set((catalog as { brand: string }[]).map((p) => p.brand))].sort();


export const PRODUCTS = catalog as Product[];

export const byId = (id: string) => PRODUCTS.find((x) => x.id === id)!;
export const findProduct = (id: string) => PRODUCTS.find((x) => x.id === id);

export const CATEGORIES: { name: Category; count: number }[] = CATEGORY_NAMES.map((name) => ({
  name,
  count: PRODUCTS.filter((x) => x.category === name).length,
}));

// bundles.json shape: brand, category, format, minimum quantity, price each
export const BUNDLES = bundles as { brand: string; category: string; format: string; min_qty: number; price_each: number }[];

export const bundleFor = (p: Product) =>
  BUNDLES.find((b) => b.brand === p.brand && b.category === p.category && b.format === p.format);

/** Price per item for a given quantity: bundle price once the minimum is met, else member price. */
export const unitPrice = (p: Product, qty: number) => {
  const b = bundleFor(p);
  return b && qty >= b.min_qty ? b.price_each : p.member_price;
};

export const MEMBER = member;

export const TAX_RATE = settings.tax_rate; // fixed demo rate
/** Demo membership fees (the pitch shows real numbers; Copperstate sets them before launch). */
export const PLANS = [
  { name: "Monthly", perMonth: settings.membership.monthly, billed: `$${settings.membership.monthly} billed each month. Cancel anytime.` },
  { name: "Yearly", perMonth: Math.round((settings.membership.yearly / 12) * 100) / 100, billed: `$${settings.membership.yearly} billed once a year.` },
];
/** How much less members pay than retail across the menu, as a whole percent (every product is the same today). */
export const MEMBER_SAVE_PCT = Math.round(
  (PRODUCTS.reduce((s, p) => s + (1 - p.member_price / p.retail_price), 0) / PRODUCTS.length) * 100,
);
/** The Box: any `size` items in one order take `pct` off the member subtotal (mix and match). */
export const BOX = settings.box as { size: number; pct: number };
/** Box discount on a member subtotal, rounded to the cent; zero until the cart holds a full box. */
export const boxDiscount = (count: number, memberSubtotal: number) =>
  count >= BOX.size ? Math.round(memberSubtotal * BOX.pct) / 100 : 0;
export const DELIVERY_SLOTS = settings.delivery_slots as Record<"Today" | "Tomorrow", string[]>;
export const ADDRESSES = member.addresses as { id: string; label: string; line: string; note: string }[];
export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const PERSONA = persona;

export type PastOrder = { id: string; date: string; items: string[]; lines: { id: string; qty: number }[]; total: number };
export const PAST_ORDERS = member.pastOrders as PastOrder[];
/** The member's usual: their most recent order. */
export const USUAL = PAST_ORDERS[0];
/** What membership has saved the demo member so far: retail value minus what they paid, over every past order. */
export const MEMBER_SAVED = Math.round(
  PAST_ORDERS.reduce((s, o) => s + o.lines.reduce((r, l) => r + byId(l.id).retail_price * l.qty, 0) - o.total, 0) * 100,
) / 100;
/** This week's picks Nora chose for the member (also what she texts on Fridays). */
export const WEEKLY_PICKS = member.weekly_picks as { id: string; reason: string }[];

/** Subscribe & Save: any item repeats on its own schedule at an extra discount (replaces the monthly box). */
export const SUBSCRIBE = settings.subscribe as { pct: number; pct_multi: number; multi_at: number; weeks: number[]; default_weeks: number };
/** Subscribe & Save percentage for a member with `count` subscriptions (the higher rate from SUBSCRIBE.multi_at on). */
export const subscribePct = (count: number) => (count >= SUBSCRIBE.multi_at ? SUBSCRIBE.pct_multi : SUBSCRIBE.pct);
export const subscribePrice = (price: number, pct: number = SUBSCRIBE.pct) => Math.round(price * (100 - pct)) / 100;
export const everyLabel = (weeks: number) => (weeks === 1 ? "Every week" : `Every ${weeks} weeks`);
