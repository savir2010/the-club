"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronRight, IdCard, MapPin, MessageCircle, Repeat, Truck } from "lucide-react";
import { MEMBER, PERSONA, PRODUCTS, bundleFor, byId, money, type Product } from "@/lib/data";
import { ProductArt } from "@/components/ProductArt";
import { Aurora } from "@/components/Aurora";
import { NoraAvatar } from "@/components/brand";
import { ProductCard } from "@/components/shop/ProductCard";
import { Stars } from "@/components/shop/Stars";
import { useShop } from "@/components/shop/ShopState";
import { ClubSeal, Price, ProductPrice } from "@/components/shop/Price";
import { useSession } from "@/lib/session";

const ONSET: Record<Product["category"], string> = {
  Flower: "Felt within minutes when smoked or vaporized, and lasts one to three hours.",
  "Pre-rolls": "Felt within minutes. Take a draw or two and wait before having more.",
  Vapes: "Felt within minutes. Take one draw and wait 15 minutes before the next.",
  Edibles: "Start low: one serving, then wait two hours before having more. Effects last four to eight hours.",
  Concentrates: "Very high potency. Recommended for experienced members only.",
  Tinctures: "Held under the tongue, usually felt in 15 to 45 minutes. Start with the smallest marked dose.",
  Topicals: "Applied to the skin. Not eaten or inhaled.",
};

const REVIEWERS = [
  { name: "Marisol R.", date: "October 28, 2026" },
  { name: "Theo K.", date: "October 19, 2026" },
  { name: "Priya S.", date: "September 30, 2026" },
];

function reviewsFor(p: Product) {
  const fx = p.effects.slice(0, 2).join(" and ");
  return [
    { stars: 5, title: "Exactly what the label says", body: `Consistent from one order to the next. I'd describe it as ${fx}.${p.flavor[0] ? ` The ${p.flavor[0]} note is real, not a gimmick.` : ""}` },
    { stars: Math.round(p.rating) >= 5 ? 5 : 4, title: "Good value at the member price", body: `Cheaper than the shop down the road once you count the free delivery. Arrived in about an hour and the driver checked ID at the door.` },
    { stars: 4, title: p.category === "Edibles" ? "Go slow the first time" : "Nice, but know your dose", body: p.category === "Edibles" ? "I took one and waited like the label says. Glad I did. Easy to share with friends who are new to this." : "Stronger than I expected for the size. Nora suggested starting small and that was the right call." },
  ];
}

function distribution(r: number) {
  const five = Math.min(92, Math.round(30 + (r - 4) * 70));
  const four = Math.round((100 - five) * 0.55);
  const three = Math.round((100 - five - four) * 0.6);
  const two = Math.round((100 - five - four - three) * 0.6);
  return [five, four, three, two, 100 - five - four - three - two];
}

function Gallery({ p }: { p: Product }) {
  const [view, setView] = useState(0);
  const views = [
    { label: "Front", node: <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" /> },
    { label: "Label close-up", node: <ProductArt category={p.category} brand={p.brand} image={p.image} view="close" className="size-full" /> },
    {
      label: "At a glance",
      node: (
        <div className="grid size-full place-items-center bg-[var(--color-raised-2)] p-[12%] text-center">
          <div>
            <p className="smallcaps text-[var(--color-brass)]">{p.strain_type}</p>
            <p className="display mt-[6%] text-[clamp(18px,3.2vw,40px)] leading-tight">{p.potency.split(" · ")[0]}</p>
            <p className="mt-[5%] text-[clamp(11px,1vw,14px)] text-[var(--color-muted)]">{p.format}</p>
          </div>
        </div>
      ),
    },
    {
      label: "Mood",
      node: (
        <div className="relative size-full">
          <Aurora />
          <div className="absolute inset-[22%] overflow-hidden rounded-full shadow-[var(--shadow-float)]">
            <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
          </div>
        </div>
      ),
    },
  ];
  return (
    <div className="flex flex-col-reverse gap-3 self-start sm:flex-row sm:items-start">
      <div className="flex gap-2 sm:flex-col" role="tablist" aria-label="Product images">
        {views.map((v, i) => (
          <button
            key={v.label}
            role="tab"
            aria-selected={view === i}
            aria-label={v.label}
            onMouseEnter={() => setView(i)}
            onClick={() => setView(i)}
            className={`size-16 overflow-hidden rounded-[10px] border-2 transition-colors ${view === i ? "border-[var(--color-brass)]" : "border-[var(--color-hairline)] hover:border-[var(--color-hairline-strong)]"}`}
          >
            <span className="pointer-events-none block size-full [&_p]:!text-[7px] [&_.smallcaps]:hidden">{v.node}</span>
          </button>
        ))}
      </div>
      <div className="aspect-square flex-1 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)]" role="tabpanel" aria-label={views[view].label}>
        {views[view].node}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-[var(--color-hairline)] last:border-0">
      <th scope="row" className="w-[38%] py-2.5 pr-4 text-left align-top text-[14px] font-medium">{k}</th>
      <td className="py-2.5 text-[14px] text-[var(--color-ivory)]/85">{v}</td>
    </tr>
  );
}

export function ProductDetail({ id }: { id: string }) {
  const p = byId(id);
  const router = useRouter();
  const { add, lines, setChatOpen } = useShop();
  const [qty, setQty] = useState(1);
  const bundle = bundleFor(p);
  const { member, signedIn } = useSession();
  const inCart = lines.find((l) => l.id === p.id)?.qty ?? 0;
  const dist = distribution(p.rating);
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  const related = PRODUCTS.filter((x) => x.id !== p.id)
    .map((x) => ({ x, score: (x.category === p.category ? 2 : 0) + x.effects.filter((e) => p.effects.includes(e)).length + (x.brand === p.brand ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.x);

  const bullets = [
    `${p.potency}. ${p.format}.`,
    p.description,
    `Listed effects: ${p.effects.join(", ")}.${p.flavor.length ? ` Flavor notes: ${p.flavor.join(", ")}.` : ""}`,
    ONSET[p.category],
    p.house_brand ? "A Club house brand, at member pricing on every order." : `Carried by the Club from ${p.brand}, at member pricing on every order.`,
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pt-5 pb-28 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-[13px] text-[var(--color-muted)]">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/shop" className="hover:text-[var(--color-ivory)] hover:underline">Shop</Link></li>
          <li aria-hidden><ChevronRight size={13} /></li>
          <li><Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="hover:text-[var(--color-ivory)] hover:underline">{p.category}</Link></li>
          <li aria-hidden><ChevronRight size={13} /></li>
          <li aria-current="page" className="text-[var(--color-ivory)]">{p.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(280px,3fr)] lg:gap-8 xl:gap-12">
        <Gallery p={p} />

        {/* Details */}
        <div className="min-w-0">
          <Link href={`/shop?q=${encodeURIComponent(p.brand)}`} className="text-[14px] text-[var(--color-brass)] hover:underline">
            Visit the {p.brand} shelf
          </Link>
          <h1 className="display mt-2 text-[36px] leading-[1.08] sm:text-[44px]">{p.name}</h1>
          <p className="mt-1 text-[14px] text-[var(--color-muted)]">{p.strain_type} · {p.category} · {p.format}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
            <span className="tnum">{p.rating.toFixed(1)}</span>
            <Stars rating={p.rating} size={16} />
            <a href="#reviews" className="text-[var(--color-brass)] hover:underline">{p.review_count} member ratings</a>
            {p.rating >= 4.7 && <span className="badge border-[var(--color-brass)]/40 text-[var(--color-brass)]">Club pick</span>}
          </div>

          <div className="mt-6 border-t border-[var(--color-hairline)] pt-6">
            <ProductPrice p={p} size={40} detail />
            <p className="mt-2 text-[13px] text-[var(--color-muted)]">Free delivery · Tax calculated at checkout</p>
            {bundle && (
              <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-[var(--color-brass)]/40 bg-[var(--color-brass)]/[0.06] px-4 py-3">
                <BadgeCheck size={20} strokeWidth={1.5} className="shrink-0 text-[var(--color-brass)]" aria-hidden />
                <p className="text-[14px]">
                  <span className="font-medium">Bundle:</span> buy {bundle.min_qty} or more {p.brand} {p.format} {p.category.toLowerCase()} and pay{" "}
                  <span className="num text-[18px] text-[var(--color-brass)]">{money(bundle.price_each)}</span> each.
                </p>
              </div>
            )}
          </div>

          <table className="mt-6 w-full border-t border-[var(--color-hairline)]">
            <tbody>
              <Row k="Brand" v={p.brand} />
              <Row k="Type" v={p.strain_type} />
              <Row k="Potency" v={p.potency} />
              <Row k="Format" v={p.format} />
              {p.flavor.length > 0 && <Row k="Flavor" v={p.flavor.map(cap).join(", ")} />}
              <Row k="Effects" v={p.effects.map(cap).join(", ")} />
            </tbody>
          </table>

          <div className="mt-6 border-t border-[var(--color-hairline)] pt-6">
            <h2 className="text-[17px] font-semibold">About this item</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed marker:text-[var(--color-brass)]">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Buy box */}
        <aside aria-label="Buy" className="lg:sticky lg:top-[156px] lg:self-start">
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] p-5">
            <Price value={member ? p.member_price : p.retail_price} size={34} />
            {!member && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px]">
                <ClubSeal /> <span className="tnum font-semibold">{money(p.member_price)}</span>
                <span className="text-[var(--color-muted)]">when you join at checkout</span>
                <span className="font-semibold text-[var(--color-brass)]">· save {Math.round((1 - p.member_price / p.retail_price) * 100)}%</span>
              </p>
            )}
            <p className="mt-3 flex gap-2 text-[14px]">
              <Truck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--color-brass)]" aria-hidden />
              <span><span className="font-medium">Free delivery</span> tonight, 7:00 to 8:00 PM</span>
            </p>
            <p className="mt-2 flex gap-2 text-[13px] text-[var(--color-muted)]">
              <MapPin size={17} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
              {signedIn ? `Deliver to ${MEMBER.first}, Phoenix 85018` : "Delivering across Phoenix"}
            </p>

            <p className={`mt-4 text-[17px] font-medium ${p.in_stock ? "text-[var(--color-sage)]" : "text-[var(--color-clay)]"}`}>
              {p.in_stock ? "In stock" : "Out of stock"}
            </p>
            {inCart > 0 && <p className="mt-1 text-[13px] text-[var(--color-muted)]">{inCart} already in your cart</p>}

            {p.in_stock ? (
              <>
                <label htmlFor="qty" className="mt-4 flex items-center gap-3 text-[14px]">
                  Quantity
                  <select id="qty" value={qty} onChange={(e) => setQty(+e.target.value)} className="field h-9 w-20 px-3 text-[14px]">
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </label>
                {bundle && qty < bundle.min_qty && (
                  <button onClick={() => setQty(bundle.min_qty)} className="mt-2 text-left text-[13px] text-[var(--color-brass)] hover:underline">
                    Make it {bundle.min_qty} for the bundle price
                  </button>
                )}
                <div className="mt-4 grid gap-2.5">
                  <button className="btn btn-primary w-full rounded-full" onClick={() => add(p.id, qty)}>Add to cart</button>
                  <button
                    className="btn w-full rounded-full bg-[#17130f] text-[#f3ece0] hover:opacity-90"
                    onClick={() => {
                      add(p.id, qty);
                      router.push("/checkout");
                    }}
                  >
                    Buy now
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn-outline mt-4 w-full" onClick={() => setChatOpen(true)}>Ask {PERSONA.name} for something similar</button>
            )}

            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-[var(--color-hairline)] pt-4 text-[13px]">
              <dt className="text-[var(--color-muted)]">Delivered by</dt><dd>The Club courier</dd>
              <dt className="text-[var(--color-muted)]">Sold by</dt><dd>The Club</dd>
              <dt className="text-[var(--color-muted)]">Payment</dt><dd>{member ? "Your linked bank" : "Bank link, set up when you join"}</dd>
            </dl>
            <p className="mt-4 flex gap-2 text-[13px] text-[var(--color-muted)]">
              <IdCard size={17} strokeWidth={1.5} className="mt-px shrink-0" aria-hidden />
              Your driver checks ID at the door.
            </p>
            <button className="mt-3 inline-flex items-center gap-2 text-[13px] text-[var(--color-ivory)] hover:text-[var(--color-brass)]">
              <Repeat size={15} strokeWidth={1.5} aria-hidden /> Add to monthly box
            </button>
          </div>

          <button
            onClick={() => setChatOpen(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--color-hairline)] px-4 py-3 text-left hover:border-[var(--color-brass)]/50"
          >
            <NoraAvatar size={34} />
            <span className="flex-1">
              <span className="block text-[14px] font-medium">Questions about this?</span>
              <span className="block text-[13px] text-[var(--color-muted)]">Ask {PERSONA.name}, she knows the shelf.</span>
            </span>
            <MessageCircle size={17} strokeWidth={1.5} className="text-[var(--color-brass)]" aria-hidden />
          </button>
        </aside>
      </div>

      {/* Related */}
      <section aria-labelledby="related" className="mt-20 border-t border-[var(--color-hairline)] pt-10">
        <h2 id="related" className="display text-[30px]">Members also bought</h2>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {related.map((x) => (
            <li key={x.id} className="flex">
              <ProductCard p={x} compact />
            </li>
          ))}
        </ul>
      </section>

      {/* Reviews */}
      <section id="reviews" aria-labelledby="reviews-h" className="mt-16 grid scroll-mt-40 gap-10 border-t border-[var(--color-hairline)] pt-10 lg:grid-cols-[300px_1fr]">
        <div>
          <h2 id="reviews-h" className="display text-[30px]">Member reviews</h2>
          <div className="mt-3 flex items-center gap-3">
            <Stars rating={p.rating} size={18} />
            <span className="text-[16px]">{p.rating.toFixed(1)} out of 5</span>
          </div>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">{p.review_count} member ratings</p>
          <ul className="mt-5 space-y-2">
            {dist.map((pct, i) => (
              <li key={i} className="grid grid-cols-[48px_1fr_40px] items-center gap-3 text-[13px]">
                <span>{5 - i} star</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-[var(--color-raised-2)]">
                  <span className="block h-full rounded-full bg-[var(--color-brass)]" style={{ width: `${pct}%` }} />
                </span>
                <span className="tnum text-right text-[var(--color-muted)]">{pct}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12px] text-[var(--color-faint)]">Sample reviews for the demo. Names are fictional.</p>
        </div>
        <ul className="space-y-8">
          {reviewsFor(p).map((r, i) => (
            <li key={i} className="border-b border-[var(--color-hairline)] pb-8 last:border-0">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-[var(--color-raised-2)] text-[13px]">{REVIEWERS[i].name[0]}</span>
                <span className="text-[14px] font-medium">{REVIEWERS[i].name}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Stars rating={r.stars} size={14} />
                <span className="text-[15px] font-semibold">{r.title}</span>
              </div>
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">Reviewed {REVIEWERS[i].date} · Verified member order</p>
              <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed">{r.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
