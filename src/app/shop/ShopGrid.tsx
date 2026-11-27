"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { BRANDS, EFFECTS, PERSONA, PRODUCTS } from "@/lib/data";
import { ProductCard } from "@/components/shop/ProductCard";
import { Storefront } from "./Storefront";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

function Filters({
  effects,
  toggleEffect,
  brands,
  toggleBrand,
  maxPrice,
  setMaxPrice,
  inStock,
  setInStock,
}: {
  effects: string[];
  toggleEffect: (e: string) => void;
  brands: string[];
  toggleBrand: (b: string) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  inStock: boolean;
  setInStock: (v: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-[13px] font-medium">Effect</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {EFFECTS.map((e) => (
            <label key={e} className="cursor-pointer">
              <input type="checkbox" className="peer sr-only" checked={effects.includes(e)} onChange={() => toggleEffect(e)} />
              <span className="chip h-8 text-[12.5px] peer-checked:border-[var(--color-ivory)] peer-checked:bg-[var(--color-ivory)] peer-checked:text-[var(--color-canvas)] peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-ivory)]">
                {e}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[13px] font-medium">Brand</legend>
        <ul className="mt-3 space-y-1">
          {BRANDS.map((b) => (
            <li key={b}>
              <label className="flex cursor-pointer items-center gap-3 py-1 text-[14px] text-[var(--color-ivory)]/85">
                <input type="checkbox" className="size-4 accent-[var(--color-brass)]" checked={brands.includes(b)} onChange={() => toggleBrand(b)} />
                {b}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label htmlFor="price" className="flex items-baseline justify-between text-[13px] font-medium">
          Max price <span className="num text-[14px]">${maxPrice}</span>
        </label>
        <input id="price" type="range" min={10} max={80} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-3 w-full accent-[var(--color-brass)]" />
        <div className="tnum mt-1 flex justify-between text-[12px] text-[var(--color-faint)]">
          <span>$10</span>
          <span>$80</span>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-[14px]">
        <input type="checkbox" className="size-4 accent-[var(--color-brass)]" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
        In stock only
      </label>
    </div>
  );
}

export function ShopGrid({ category, q }: { category: string | null; q: string }) {
  const [effects, setEffects] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(80);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [drawer, setDrawer] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void) => (v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = PRODUCTS.filter(
      (p) =>
        (!category || p.category === category) &&
        (!needle || [p.name, p.brand, p.category, p.strain_type, ...p.flavor, ...p.effects].join(" ").toLowerCase().includes(needle)) &&
        (effects.length === 0 || effects.some((e) => p.effects.includes(e.toLowerCase()))) &&
        (brands.length === 0 || brands.includes(p.brand)) &&
        p.member_price <= maxPrice &&
        (!inStock || p.in_stock),
    );
    if (sort === "price-asc") out.sort((a, b) => a.member_price - b.member_price);
    if (sort === "price-desc") out.sort((a, b) => b.member_price - a.member_price);
    if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
    return out;
  }, [category, q, effects, brands, maxPrice, inStock, sort]);

  const filterCount = effects.length + brands.length + (maxPrice < 80 ? 1 : 0) + (inStock ? 1 : 0);
  const clear = () => {
    setEffects([]);
    setBrands([]);
    setMaxPrice(80);
    setInStock(false);
  };
  const filterProps = {
    effects,
    toggleEffect: toggle(effects, setEffects),
    brands,
    toggleBrand: toggle(brands, setBrands),
    maxPrice,
    setMaxPrice,
    inStock,
    setInStock,
  };
  const heading = q ? `Results for “${q}”` : category ?? "The shelf";

  if (!q && !category) return <Storefront />;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] gap-14 px-4 pt-12 pb-32 sm:px-8 sm:pt-16 lg:px-12">
      <aside className="hidden w-[220px] shrink-0 lg:block" aria-label="Filters">
        <div className="sticky top-[160px]">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-[26px]">Refine</h2>
            {filterCount > 0 && (
              <button onClick={clear} className="btn-text text-[13px] text-[var(--color-muted)]">
                Clear
              </button>
            )}
          </div>
          <div className="mt-6">
            <Filters {...filterProps} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--color-hairline)] pb-8">
          <div>
            <h1 className="display animate-[fade-up_700ms_var(--ease-out)_both] text-[44px] leading-none sm:text-[64px]">{heading}</h1>
            <p className="mt-4 text-[13px] text-[var(--color-muted)]">
              {items.length} {items.length === 1 ? "result" : "results"} · free delivery tonight
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm btn-outline lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontal size={13} strokeWidth={1.5} aria-hidden /> Filters{filterCount > 0 && ` (${filterCount})`}
            </button>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field h-10 w-auto text-[13px]">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Member rating</option>
            </select>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="display text-[30px]">Nothing on the shelf matches that.</p>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">Try fewer filters, or ask {PERSONA.name}.</p>
            <div className="mt-5 flex justify-center gap-3">
              <button className="btn btn-sm btn-outline" onClick={clear}>Clear filters</button>
              <Link href="/shop" className="btn btn-sm btn-outline">See everything</Link>
            </div>
          </div>
        ) : (
          <ul key={items.map((p) => p.id).join()} className="mt-12 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              // results ease in one after another whenever the filters change
              <li key={p.id} className="flex animate-[fade-up_700ms_var(--ease-out)_both]" style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}>
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        )}
      </main>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 animate-[fade-in_300ms_var(--ease-out)_both] bg-[#111111]/30" onClick={() => setDrawer(false)} aria-label="Close" tabIndex={-1} />
          <div className="absolute inset-y-0 left-0 flex w-[320px] max-w-[88vw] animate-[fade-up_220ms_var(--ease-out)_both] flex-col bg-[var(--color-canvas)]">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="display text-[28px]">Refine</h2>
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close" autoFocus>
                <X size={18} strokeWidth={1.25} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <Filters {...filterProps} />
            </div>
            <div className="flex gap-3 border-t border-[var(--color-hairline)] p-4">
              <button className="btn btn-outline flex-1" onClick={clear}>Clear</button>
              <button className="btn btn-primary flex-1" onClick={() => setDrawer(false)}>Show {items.length}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
