import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, findProduct } from "@/lib/data";
import { ProductDetail } from "./ProductDetail";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = findProduct((await params).id);
  return { title: p ? `${p.name} · The Club` : "Not found · The Club" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!findProduct(id)) notFound();
  return <ProductDetail id={id} />;
}
