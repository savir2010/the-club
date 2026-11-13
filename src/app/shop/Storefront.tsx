"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, MEMBER, PERSONA, PRODUCTS, type Product } from "@/lib/data";
import { useSession } from "@/lib/session";
import { NoraAvatar } from "@/components/brand";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/shop/ProductCard";
import { ClubSeal } from "@/components/shop/Price";
import { useShop } from "@/components/shop/ShopState";

function Rail({ id, title, note, href, items }: { id: string; title: string; note?: string; href?: string; items: Product[] }) {
  return (
    <section aria-labelledby={id} className="rounded-[18px] bg-[var(--color-raised)] px-5 pt-5 pb-6 ring-1 ring-[var(--color-hairline)] sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id={id} className="display text-[22px] sm:text-[24px]">{title}</h2>
          {note && <p className="text-[13px] text-[var(--color-muted)]">{note}</p>}
        </div>
        {href && (
          <Link href={href} className="flex shrink-0 items-center gap-0.5 text-[14px] text-[var(--color-brass)] hover:underline">
            See all <ChevronRight size={15} aria-hidden />
          </Link>
        )}
      </div>
      <ul className="rail -mx-1 mt-4 flex gap-5 overflow-x-auto px-1 pb-1">
        {items.map((p) => (
          <li key={p.id} className="flex w-[188px] shrink-0 sm:w-[212px]">
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Storefront() {
  const { member, signedIn } = useSession();
  const { setChatOpen } = useShop();
  const best = [...PRODUCTS].filter((p) => p.in_stock).sort((a, b) => b.review_count * b.rating - a.review_count * a.rating).slice(0, 8);
  const house = PRODUCTS.filter((p) => p.house_brand && p.in_stock).slice(0, 8);
  const heroArt = [best[0], best[1], best[2]];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pt-5 pb-28 sm:px-5">
      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-[22px] bg-[#17130f] text-[#f3ece0] ring-1 ring-[var(--color-hairline)]">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(60% 90% at 78% 40%, rgb(207 169 108 / 0.32), transparent 70%), radial-gradient(40% 60% at 10% 100%, rgb(143 174 134 / 0.16), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:px-14">
          <div>
            <p className="flex items-center gap-2 text-[13px] text-[#cbbfa9]">
              <ClubSeal /> {member ? "Member prices are on" : "Open to browse · members check out"}
            </p>
            <h1 className="display mt-5 max-w-[15ch] text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
              {member ? `Welcome back, ${MEMBER.first}.` : "Tonight’s shelf, at your door by eight."}
            </h1>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-[#d8cdb9]">
              {member
                ? `Every price below is your member price. ${PERSONA.name} remembers what you like and can reorder in one message.`
                : "Browse the full Sol Flower menu and fill your cart. Join at checkout and every price drops to the member price."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setChatOpen(true)} className="btn btn-lg rounded-full bg-[#cfa96c] pr-6 pl-2 text-[#17130f] hover:bg-[#ddb97f]">
                <NoraAvatar size={38} /> Ask {PERSONA.name}
              </button>
              <a href="#best" className="btn btn-lg rounded-full border border-[#f3ece0]/25 text-[#f3ece0] hover:border-[#f3ece0]/50">
                Shop best sellers
              </a>
            </div>
            {!signedIn && (
              <p className="mt-6 text-[13px] text-[#a99d88]">
                Already a member?{" "}
                <Link href="/signin?next=/shop" className="text-[#e6c992] underline decoration-[#e6c992]/40 underline-offset-4 hover:decoration-[#e6c992]">
                  Sign in
                </Link>
              </p>
            )}
          </div>

          <div className="relative mx-auto hidden h-[340px] w-full max-w-[520px] sm:block" aria-hidden>
            {heroArt.map((p, i) => (
              <div
                key={p.id}
                className="absolute overflow-hidden rounded-[18px] bg-white shadow-[0_30px_60px_-24px_rgb(0_0_0/0.7)] ring-1 ring-white/10"
                style={[
                  { width: "46%", aspectRatio: "1", left: "27%", top: "4%", zIndex: 3 },
                  { width: "36%", aspectRatio: "1", left: "0%", top: "34%", zIndex: 2, transform: "rotate(-5deg)" },
                  { width: "36%", aspectRatio: "1", right: "0%", top: "30%", zIndex: 2, transform: "rotate(5deg)" },
                ][i]}
              >
                <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section aria-labelledby="departments" className="mt-6">
        <h2 id="departments" className="sr-only">Shop by department</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {CATEGORIES.map((c) => {
            const p = PRODUCTS.find((x) => x.category === c.name)!;
            return (
              <li key={c.name}>
                <Link
                  href={`/shop?category=${encodeURIComponent(c.name)}`}
                  className="group block rounded-[18px] bg-[var(--color-raised)] p-3.5 ring-1 ring-[var(--color-hairline)] transition-shadow hover:shadow-[0_14px_34px_-20px_rgb(43_38_31/0.5)]"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-[12px] bg-white">
                    <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full transition-transform duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between px-0.5">
                    <span className="text-[16px] font-semibold">{c.name}</span>
                    <span className="tnum text-[12px] text-[var(--color-muted)]">{c.count} items</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 space-y-6">
        <div id="best" className="scroll-mt-32">
          <Rail id="rail-best" title="Best sellers" note="Most ordered by members this month" items={best} />
        </div>
        <Rail id="rail-house" title="From the Copperstate house" note="Grown in Arizona" href="/shop?q=Copperstate" items={house} />

        {/* Nora band */}
        <button
          onClick={() => setChatOpen(true)}
          className="flex w-full items-center gap-5 rounded-[18px] bg-[var(--color-raised)] px-6 py-5 text-left ring-1 ring-[var(--color-hairline)] transition-shadow hover:shadow-[0_14px_34px_-20px_rgb(43_38_31/0.5)]"
        >
          <NoraAvatar size={52} status />
          <span className="min-w-0 flex-1">
            <span className="display block text-[20px]">Not sure where to start?</span>
            <span className="mt-0.5 block text-[14px] text-[var(--color-muted)]">
              Tell {PERSONA.name} the occasion. She&rsquo;ll pick a few, explain them plainly and fill your cart.
            </span>
          </span>
          <span className="btn btn-sm btn-primary hidden rounded-full sm:inline-flex">Ask {PERSONA.name}</span>
        </button>

        {CATEGORIES.map((c) => (
          <Rail
            key={c.name}
            id={`rail-${c.name}`}
            title={c.name}
            href={`/shop?category=${encodeURIComponent(c.name)}`}
            items={PRODUCTS.filter((p) => p.category === c.name)}
          />
        ))}
      </div>
    </div>
  );
}
