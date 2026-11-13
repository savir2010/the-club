import type { Metadata } from "next";
import { ShopGrid } from "./ShopGrid";

export const metadata: Metadata = { title: "Shop · The Club" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  return <ShopGrid category={category ?? null} q={q ?? ""} />;
}
