"use client";

import { money, type Product } from "@/lib/data";
import { useSession } from "@/lib/session";

/** A price as the member reads it: quiet tabular figures, no raised cents. */
export function Price({ value, size = 16, className = "" }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`price ${size >= 24 ? "font-[family-name:var(--font-display)] font-medium tracking-[-0.01em]" : ""} ${className}`} style={{ fontSize: size }}>
      {money(value)}
    </span>
  );
}

/** The "Club" mark used wherever member pricing is named: the word in Cormorant italic, no box. */
export function ClubSeal({ className = "" }: { className?: string }) {
  return <span className={`font-[family-name:var(--font-display)] text-[1.15em] leading-none italic ${className}`}>Club</span>;
}

/**
 * The price block for a product. Members see their price with retail struck through.
 * Guests see retail, with the member price offered underneath.
 */
export function ProductPrice({ p, size = 16, detail = false, quiet = false }: { p: Product; size?: number; detail?: boolean; quiet?: boolean }) {
  const { member } = useSession();
  // Cards: one price, the one every member pays. Retail and the saving live on the product page and in the cart.
  if (quiet)
    return (
      <p className="flex items-baseline gap-2">
        <Price value={p.member_price} size={size} />
        <span className="text-[12px] text-[var(--color-muted)]"><ClubSeal /></span>
      </p>
    );
  const off = Math.round((1 - p.member_price / p.retail_price) * 100);
  if (member)
    return (
      <div>
        <div className="flex items-start gap-2">
          {detail && <span className="mt-0.5 text-[13px] text-[var(--color-muted)]">−{off}%</span>}
          <Price value={p.member_price} size={size} />
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
          <ClubSeal />
          <span>
            List <span className="tnum line-through">{money(p.retail_price)}</span>
            {!detail && <span> · save {off}%</span>}
          </span>
        </p>
      </div>
    );
  return (
    <div>
      <Price value={p.retail_price} size={size} />
      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
        <ClubSeal />
        <span>
          <span className="tnum text-[var(--color-ivory)]">{money(p.member_price)}</span>
          <span className="text-[var(--color-muted)]"> with membership</span>
          <span className="text-[var(--color-muted)]"> · save {off}%</span>
        </span>
      </p>
    </div>
  );
}
