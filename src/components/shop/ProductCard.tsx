"use client";

import { useRef } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { plateCutout, type Product } from "@/lib/data";
import { ProductArt } from "@/components/ProductArt";
import { useShop } from "./ShopState";
import { ProductPrice } from "./Price";
import { flyToCart } from "./motion";

/**
 * The product card. On a pointer device the plate crossfades to a detail view and a quiet
 * Add / Discover bar rises in; name and price never move. On touch, the add action sits under the price.
 */
export function ProductCard({ p, compact = false }: { p: Product; compact?: boolean }) {
  const { lines, add } = useShop();
  const inCart = lines.some((l) => l.id === p.id);
  const art = useRef<HTMLAnchorElement>(null);
  // Adding from a card keeps you browsing: the photo flies into the cart instead of opening it.
  const addHere = () => {
    add(p.id, 1, false);
    void flyToCart(art.current);
  };
  const href = `/shop/${p.id}`;
  const addLabel = inCart ? "Add another" : "Add to cart";

  return (
    <article className="group flex w-full flex-col">
      <div className="relative">
        <Link ref={art} href={href} className={p.image ? "plate plate-cut" : "plate"} aria-label={p.name} tabIndex={-1}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plateCutout(p.image)} alt="" loading="lazy" decoding="async" />
          ) : (
            <ProductArt category={p.category} brand={p.brand} className="absolute inset-0 size-full" />
          )}
        </Link>
        {!p.in_stock && (
          <span className="pointer-events-none absolute top-3.5 left-3.5 text-[12px] text-[#111111]/75">Out of stock</span>
        )}
        {!compact && (
          <div className="plate-reveal px-3.5">
            <div className="flex w-full bg-[#FAF9F6]/92 text-[#111111] backdrop-blur-[6px]">
              {p.in_stock ? (
                <button onClick={addHere} className="smallcaps flex h-11 flex-1 items-center justify-center gap-2 transition-colors hover:bg-[#111111] hover:text-[#FAF9F6]" aria-label={`${addLabel}, ${p.name}`}>
                  {inCart && <Check size={13} strokeWidth={1.5} aria-hidden />}
                  {inCart ? "Add another" : "Quick add"}
                </button>
              ) : (
                <span className="smallcaps flex h-11 flex-1 items-center justify-center text-[#111111]/50">Out of stock</span>
              )}
              <span className="my-3 w-px bg-[#111111]/15" aria-hidden />
              <Link href={href} className="smallcaps flex h-11 flex-1 items-center justify-center transition-colors hover:bg-[#111111] hover:text-[#FAF9F6]">
                Discover
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className={`display leading-[1.15] ${compact ? "text-[18px]" : "text-[20px] sm:text-[22px]"}`}>
          <Link href={href} className="line-clamp-2">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-[12px] text-[var(--color-muted)]">
          {p.brand} · {p.strain_type} · {p.potency.split(" · ")[0]}
        </p>
        <div className="mt-3">
          <ProductPrice p={p} size={15} quiet />
        </div>

        {/* Touch screens: no hover, so the add action is always here */}
        {!compact && (
          <div className="mt-auto pt-4 [@media(hover:hover)_and_(pointer:fine)]:hidden">
            {p.in_stock ? (
              <button onClick={addHere} className="btn-text smallcaps inline-flex items-center gap-1.5" aria-label={`${addLabel}, ${p.name}`}>
                {inCart && (
                  <span className="added-in inline-flex">
                    <Check size={13} strokeWidth={1.5} aria-hidden />
                  </span>
                )}
                {inCart ? "In cart · add one" : "Add to cart"}
              </button>
            ) : (
              <span className="smallcaps text-[var(--color-faint)]">Out of stock</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
