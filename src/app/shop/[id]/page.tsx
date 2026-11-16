import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { findProduct } from "@/lib/data";
import { ProductDetail } from "./ProductDetail";

// Rendered per request so link previews (iMessage) point at the address the page was reached by.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = findProduct((await params).id);
  if (!p) return { title: "Not found · The Club" };
  // Link previews (iMessage, Slack): when Nora texts this page, the phone shows the photo and price.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3100";
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0];
  const base = `${proto}://${host.split(",")[0]}`;
  const title = `${p.name} · $${p.member_price.toFixed(2)} for members`;
  const description = `${p.brand} · ${p.format} · ${p.potency}. Free delivery tonight from The Club.`;
  return {
    title: `${p.name} · The Club`,
    description,
    metadataBase: new URL(base),
    openGraph: { title, description, siteName: "The Club", type: "website", images: [{ url: p.image, width: 900, height: 900, alt: p.name }] },
    twitter: { card: "summary_large_image", title, description, images: [p.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!findProduct(id)) notFound();
  return <ProductDetail id={id} />;
}
