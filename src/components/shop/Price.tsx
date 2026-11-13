"use client";

import { money, type Product } from "@/lib/data";
import { useSession } from "@/lib/session";

/** $27⁰⁰ — dollars large, cents raised. */
export function Price({ value, size = 26, className = "" }: { value: number; size?: number; className?: string }) {
  const [d, c] = value.toFixed(2).split(".");
  return (
    <span className={`price ${className}`} style={{ fontSize: size }} aria-label={money(value)}>
      <span className="cur" aria-hidden>$</span>
      <span aria-hidden>{Number(d).toLocaleString("en-US")}</span>
      <span className="cents" aria-hidden>{c}</span>
    </span>
  );
}

/** The small brass "Club" seal used wherever member pricing is named. */
export function ClubSeal({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-[18px] items-center rounded-[4px] bg-[var(--color-brass)] px-1.5 text-[10px] font-bold tracking-[0.08em] text-[var(--color-on-brass)] uppercase ${className}`}
    >
      Club
    </span>
  );
}

/**
 * The price block for a product. Members see their price with retail struck through.
 * Guests see retail, with the member price offered underneath.
 */
export function ProductPrice({ p, size = 26, detail = false }: { p: Product; size?: number; detail?: boolean }) {
  const { member } = useSession();
  const off = Math.round((1 - p.member_price / p.retail_price) * 100);
  if (member)
    return (
      <div>
        <div className="flex items-start gap-2">
          {detail && <span className="mt-1 text-[20px] font-light text-[var(--color-clay)]">−{off}%</span>}
          <Price value={p.member_price} size={size} />
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
          <ClubSeal />
          <span>
            List <span className="tnum line-through">{money(p.retail_price)}</span>
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
          <span className="tnum font-semibold text-[var(--color-ivory)]">{money(p.member_price)}</span>
          <span className="text-[var(--color-muted)]"> with membership</span>
        </span>
      </p>
    </div>
  );
}
