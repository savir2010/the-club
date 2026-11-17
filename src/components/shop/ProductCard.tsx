"use client";

import { useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { type Product } from "@/lib/data";
import { ProductArt } from "@/components/ProductArt";
import { Stars } from "./Stars";
import { useShop } from "./ShopState";
import { ProductPrice } from "./Price";
import { flyToCart } from "./motion";

export function ProductCard({ p, compact = false }: { p: Product; compact?: boolean }) {
  const { lines, add } = useShop();
  const inCart = lines.some((l) => l.id === p.id);
  const art = useRef<HTMLAnchorElement>(null);
  // Adding from a card keeps you browsing: the photo flies into the cart instead of opening it.
  const addHere = () => {
    add(p.id, 1, false);
    void flyToCart(art.current);
  };
  const best = p.rating >= 4.8 && p.review_count >= 100;
  const href = `/shop/${p.id}`;

  return (
    <article className="group flex w-full flex-col">
      <Link
        ref={art}
        href={href}
        className="relative block aspect-square overflow-hidden rounded-[14px] bg-white ring-1 ring-[var(--color-hairline)] transition-shadow duration-300 group-hover:shadow-[0_14px_34px_-18px_rgb(43_38_31/0.45)]"
        aria-label={p.name}
        tabIndex={-1}
      >
        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.035]" />
        {!p.in_stock ? (
          <span className="absolute top-2.5 left-2.5 rounded-[6px] bg-[#2b261f]/80 px-2 py-1 text-[11px] font-medium text-white">Out of stock</span>

        ) : best ? (
          <span className="absolute top-2.5 left-2.5 rounded-[6px] bg-[#17130f] px-2 py-1 text-[11px] font-semibold tracking-[0.02em] text-[#e6c992]">Best seller</span>
        ) : null}
      </Link>

      <div className="mt-3 flex flex-1 flex-col px-0.5">
        <p className="text-[12px] text-[var(--color-muted)]">{p.brand}</p>
        <h3 className={`mt-0.5 leading-snug ${compact ? "text-[14px]" : "text-[15px]"}`}>
          <Link href={href} className="line-clamp-2 font-medium hover:text-[var(--color-brass)]">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-[12px]">
          <span className="tnum font-medium">{p.rating.toFixed(1)}</span>
          <Stars rating={p.rating} size={13} />
          <span className="tnum text-[var(--color-brass)]">({p.review_count})</span>
        </p>
        <p className="mt-1 text-[12px] text-[var(--color-muted)]">
          {p.strain_type} · {p.potency.split(" · ")[0]} · {p.format}
        </p>

        <div className="mt-2.5">
          <ProductPrice p={p} size={compact ? 22 : 26} />
        </div>
        <p className="mt-1.5 text-[12px] text-[var(--color-muted)]">
          Free delivery <span className="font-semibold text-[var(--color-ivory)]">tonight</span>
        </p>

        {!compact && (
          <div className="mt-auto pt-3.5">
            {!p.in_stock ? (
              <button className="btn btn-sm btn-outline h-9 w-full rounded-full" disabled>
                Out of stock
              </button>
            ) : inCart ? (
              <button className="btn btn-sm btn-outline h-9 w-full rounded-full" onClick={addHere} aria-label={`Add another ${p.name}`}>
                <span className="added-in inline-flex items-center gap-2">
                  <Check size={15} className="text-[var(--color-brass)]" aria-hidden /> In cart · add one
                </span>
              </button>
            ) : (
              <button className="btn btn-sm btn-primary h-9 w-full rounded-full" onClick={addHere} aria-label={`Add ${p.name} to cart`}>
                Add to cart
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
