// Demo data. Products, brands, descriptions and photos come from the Sol Flower (Copperstate Farms)
// menu, used with the founder's permission; ratings, member prices, people and addresses are demo values.
// Field names match the catalog.json spec in the demo brief so the real menu can drop in.

// The catalog, bundles, member and persona live in /data as JSON, shared with the Python agent.
import catalog from "../../data/catalog.json";
import bundles from "../../data/bundles.json";
import member from "../../data/member.json";
import persona from "../../data/persona.json";
import settings from "../../data/settings.json";

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
};

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
export const DELIVERY_SLOTS = settings.delivery_slots as Record<"Today" | "Tomorrow", string[]>;
export const ADDRESSES = member.addresses as { id: string; label: string; line: string; note: string }[];
export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const PERSONA = persona;
