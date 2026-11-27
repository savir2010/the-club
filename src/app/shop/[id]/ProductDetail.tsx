"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, IdCard, MapPin, MessageCircle, Repeat, Truck } from "lucide-react";
import { BoxMeter } from "@/components/cart";
import { MEMBER, PERSONA, PRODUCTS, SUBSCRIBE, byId, everyLabel, money, plateAlt, plateImage, subscribePrice, type Product } from "@/lib/data";
import { arrives, isoIn, longDate, useSubscriptions } from "@/lib/subscriptions";
import { ProductArt } from "@/components/ProductArt";
import { Aurora } from "@/components/Aurora";
import { NoraAvatar } from "@/components/brand";
import { ProductCard } from "@/components/shop/ProductCard";
import { Stars } from "@/components/shop/Stars";
import { useShop } from "@/components/shop/ShopState";
import { ClubSeal, ProductPrice } from "@/components/shop/Price";
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
  const photo = (src: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-full object-cover" />
  );
  const views = [
    { label: "Front", node: p.image ? photo(plateImage(p.image)) : <ProductArt category={p.category} brand={p.brand} className="size-full" /> },
    { label: "Detail", node: p.image ? photo(plateAlt(p)) : <ProductArt category={p.category} brand={p.brand} view="close" className="size-full" /> },
    {
      label: "At a glance",
      node: (
        <div className="grid size-full place-items-center bg-[var(--color-cream)] p-[12%] text-center">
          <div>
            <p className="smallcaps text-[var(--color-muted)]">{p.strain_type}</p>
            <p className="display mt-[8%] text-[clamp(22px,4vw,64px)] leading-tight">{p.potency.split(" · ")[0]}</p>
            <p className="mt-[6%] text-[clamp(11px,1vw,14px)] text-[var(--color-muted)]">{p.format}</p>
          </div>
        </div>
      ),
    },
    {
      label: "Mood",
      node: (
        <div className="relative size-full">
          <Aurora />
          <div className="absolute inset-[20%_24%] overflow-hidden">
            <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
          </div>
        </div>
      ),
    },
  ];
  return (
    <div className="flex flex-col-reverse gap-4 self-start sm:flex-row sm:items-start">
      <div className="flex gap-2.5 sm:flex-col" role="tablist" aria-label="Product images">
        {views.map((v, i) => (
          <button
            key={v.label}
            role="tab"
            aria-selected={view === i}
            aria-label={v.label}
            onMouseEnter={() => setView(i)}
            onClick={() => setView(i)}
            className={`relative aspect-[4/5] w-14 overflow-hidden transition-opacity duration-300 sm:w-16 ${view === i ? "opacity-100" : "opacity-55 hover:opacity-90"}`}
          >
            <span className="pointer-events-none block size-full [&_p]:!text-[6px] [&_.smallcaps]:hidden">{v.node}</span>
            <span className={`absolute inset-x-0 bottom-0 h-px bg-[var(--color-ivory)] transition-transform duration-500 ${view === i ? "scale-x-100" : "scale-x-0"}`} aria-hidden />
          </button>
        ))}
      </div>
      <div className="relative aspect-[4/5] flex-1 overflow-hidden bg-[var(--color-plate)]" role="tabpanel" aria-label={views[view].label}>
        {views.map((v, i) => (
          <div
            key={v.label}
            className="absolute inset-0 transition-opacity duration-[480ms] ease-[var(--ease-lux)]"
            style={{ opacity: view === i ? 1 : 0 }}
            aria-hidden={view !== i}
          >
            {v.node}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-[var(--color-hairline)] last:border-0">
      <th scope="row" className="smallcaps w-[38%] py-3.5 pr-4 text-left align-top font-normal text-[var(--color-muted)]">{k}</th>
      <td className="py-3 text-[14px]">{v}</td>
    </tr>
  );
}

/** Amazon-style purchase options: buy once, or Subscribe & Save on a repeat schedule. */
function BuyOptions({
  p, qty, setQty, member, onAdd, onBuyNow,
}: {
  p: Product; qty: number; setQty: (n: number) => void; member: boolean; onAdd: () => void; onBuyNow: (subscribeWeeks?: number) => void;
}) {
  const subs = useSubscriptions();
  const current = subs.find(p.id);
  const [mode, setMode] = useState<"once" | "subscribe">("once");
  const [weeks, setWeeks] = useState(current?.weeks ?? SUBSCRIBE.default_weeks);
  const [done, setDone] = useState(false);
  // the rate counting this item, so a third subscription shows the higher rate it unlocks
  const pct = subs.pct === SUBSCRIBE.pct_multi || (!current && subs.subs.length + 1 >= SUBSCRIBE.multi_at) ? SUBSCRIBE.pct_multi : SUBSCRIBE.pct;
  const base = member ? p.member_price : p.retail_price;
  const subPrice = subscribePrice(p.member_price, pct);
  const toMulti = SUBSCRIBE.multi_at - subs.subs.length - (current ? 0 : 1);

  const option = (value: "once" | "subscribe", children: React.ReactNode) => (
    <label
      className={`block cursor-pointer border p-4 transition-colors duration-300 ${mode === value ? "border-[var(--color-ivory)]" : "border-[var(--color-hairline-strong)] hover:border-[var(--color-ivory)]/50"}`}
    >
      <input type="radio" name="purchase" className="peer sr-only" checked={mode === value} onChange={() => { setMode(value); setDone(false); }} />
      <span className="flex items-start gap-3">
        <span className={`mt-[3px] grid size-[14px] shrink-0 place-items-center rounded-full border ${mode === value ? "border-[var(--color-ivory)]" : "border-[var(--color-hairline-strong)]"}`} aria-hidden>
          {mode === value && <span className="size-1.5 rounded-full bg-[var(--color-ivory)]" />}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </span>
    </label>
  );

  return (
    <div className="mt-4" data-buy-options>
      {member && current && (
        <p className="mb-3 flex items-start gap-2 bg-[var(--color-cream)] px-3.5 py-3 text-[13px]">
          <Repeat size={15} strokeWidth={1.6} className="mt-px shrink-0 text-[var(--color-sage)]" aria-hidden />
          <span>
            You subscribe to this · {everyLabel(current.weeks).toLowerCase()} · next {longDate(arrives(current))}.{" "}
            <Link href="/account/subscriptions" className="underline underline-offset-4">Manage</Link>
          </span>
        </p>
      )}
      <fieldset className="grid gap-2">
        <legend className="sr-only">Purchase options</legend>
        {option("once", (
          <span className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="font-medium">One-time purchase</span>
            <span className="tnum">{money(base)}</span>
          </span>
        ))}
        {option("subscribe", (
          <>
            <span className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-medium">
                Subscribe &amp; Save <span className="ml-1 text-[var(--color-muted)]">· {pct}% off</span>
              </span>
              <span className="tnum">{money(subPrice)}</span>
            </span>
            <span className="mt-1 block text-[12px] leading-snug text-[var(--color-muted)]">
              {member ? "Member price" : "Member price when you join"}, then {pct}% off every delivery. Skip or cancel anytime.
            </span>
            {mode === "subscribe" && (
              <span className="mt-3 block animate-[fade-up_200ms_var(--ease-out)_both]">
                <span className="flex items-center gap-2 text-[13px]">
                  Deliver
                  <select value={weeks} onChange={(e) => { setWeeks(+e.target.value); setDone(false); }} className="field h-8 flex-1 px-2.5 text-[13px]" aria-label="Delivery frequency">
                    {SUBSCRIBE.weeks.map((w) => <option key={w} value={w}>{everyLabel(w).toLowerCase()}</option>)}
                  </select>
                </span>
                <span className="mt-2 block text-[12px] text-[var(--color-muted)]">
                  {toMulti > 0
                    ? `Save ${SUBSCRIBE.pct_multi}% on everything with ${SUBSCRIBE.multi_at} or more subscriptions (${toMulti} more to go).`
                    : `You're at ${SUBSCRIBE.pct_multi}% off with ${SUBSCRIBE.multi_at}+ subscriptions.`}
                </span>
              </span>
            )}
          </>
        ))}
      </fieldset>

      <label htmlFor="qty" className="mt-5 flex items-center gap-4 text-[13px] text-[var(--color-muted)]">
        Quantity
        <select id="qty" value={qty} onChange={(e) => { setQty(+e.target.value); setDone(false); }} className="field h-10 w-20 px-3 text-[14px] text-[var(--color-ivory)]">
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
      </label>

      <div className="mt-5 grid gap-2.5">
        {mode === "once" ? (
          <>
            <button className="btn btn-lg btn-primary w-full" onClick={onAdd}>Add to cart</button>
            <button className="btn btn-lg btn-outline w-full" onClick={() => onBuyNow()}>Buy now</button>
          </>
        ) : member ? (
          done ? (
            <div className="border border-[var(--color-ivory)] bg-[var(--color-cream)] p-4 text-[13px] animate-[fade-up_320ms_var(--ease-out)_both]" role="status">
              <p className="flex items-center gap-2 text-[14px] font-medium"><Check size={15} strokeWidth={1.5} aria-hidden /> Subscribed</p>
              <p className="mt-1 text-[var(--color-muted)]">
                First delivery {longDate(isoIn(1))}, then {everyLabel(weeks).toLowerCase()}. We&rsquo;ll text you two days before each one.
              </p>
              <Link href="/account/subscriptions" className="btn-text smallcaps mt-3 inline-block">See your subscriptions</Link>
            </div>
          ) : (
            <button
              className="btn btn-primary w-full"
              data-subscribe-now
              onClick={() => {
                subs.add([{ id: p.id, qty }], weeks, isoIn(1));
                setDone(true);
              }}
            >
              <Repeat size={13} strokeWidth={1.5} aria-hidden /> {current ? "Update subscription" : "Subscribe now"}
            </button>
          )
        ) : (
          <button className="btn btn-primary w-full" onClick={() => onBuyNow(weeks)}>
            Join and subscribe
          </button>
        )}
      </div>
    </div>
  );
}

export function ProductDetail({ id }: { id: string }) {
  const p = byId(id);
  const router = useRouter();
  const { add, lines, setChatOpen } = useShop();
  const [qty, setQty] = useState(1);
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
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-32 sm:px-8 lg:px-12">
      <nav aria-label="Breadcrumb" className="text-[12px] text-[var(--color-muted)]">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/shop" className="nav-link py-0">Shop</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/shop?category=${encodeURIComponent(p.category)}`} className="nav-link py-0">{p.category}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-[var(--color-ivory)]">{p.name}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(340px,5fr)] lg:gap-16 xl:gap-24">
        <Gallery p={p} />

        {/* Purchase column */}
        <aside aria-label="Buy" className="min-w-0 lg:sticky lg:top-[156px] lg:self-start">
          <h1 className="display animate-[fade-up_800ms_var(--ease-out)_both] text-[40px] leading-[1.04] sm:text-[52px]">{p.name}</h1>
          <p className="mt-4 text-[14px] text-[var(--color-muted)]">
            <Link href={`/shop?q=${encodeURIComponent(p.brand)}`} className="text-[var(--color-ivory)] underline decoration-[var(--color-hairline-strong)] underline-offset-4 hover:decoration-current">{p.brand}</Link>
            {" "}· {p.strain_type} · {p.category} · {p.format}
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-muted)]">
            <span className="tnum text-[var(--color-ivory)]">{p.rating.toFixed(1)}</span> ·{" "}
            <a href="#reviews" className="underline decoration-[var(--color-hairline-strong)] underline-offset-4 hover:decoration-current">{p.review_count} member ratings</a>
          </p>

          <div className="mt-8 border-t border-[var(--color-hairline)] pt-7">
            <ProductPrice p={p} size={30} detail />
            <p className="mt-3 text-[13px] text-[var(--color-muted)]">Free delivery · Tax calculated at checkout</p>
          </div>

          <p className={`mt-6 text-[13px] ${p.in_stock ? "text-[var(--color-ivory)]" : "text-[var(--color-clay)]"}`}>
            <span className={`mr-2 inline-block size-1.5 rounded-full align-middle ${p.in_stock ? "bg-[var(--color-sage)]" : "bg-[var(--color-clay)]"}`} aria-hidden />
            {p.in_stock ? "In stock" : "Out of stock"}
          </p>
          {inCart > 0 && <p className="mt-1.5 text-[13px] text-[var(--color-muted)]">{inCart} already in your cart</p>}

          {p.in_stock ? (
            <BuyOptions p={p} qty={qty} setQty={setQty} member={member} onAdd={() => add(p.id, qty)} onBuyNow={(subscribeWeeks) => {
              add(p.id, qty);
              router.push(subscribeWeeks ? `/checkout?subscribe=${subscribeWeeks}` : "/checkout");
            }} />
          ) : (
            <button className="btn btn-outline mt-5 w-full" onClick={() => setChatOpen(true)}>Ask {PERSONA.name} for something similar</button>
          )}

          <BoxMeter lines={lines} className="mt-5" />

          <dl className="mt-7 space-y-3 border-t border-[var(--color-hairline)] pt-6 text-[13px]">
            <div className="flex gap-3">
              <Truck size={16} strokeWidth={1.25} className="mt-0.5 shrink-0" aria-hidden />
              <dt className="sr-only">Delivery</dt>
              <dd><span className="font-medium">Free delivery</span> tonight, 7:00 to 8:00 PM</dd>
            </div>
            <div className="flex gap-3 text-[var(--color-muted)]">
              <MapPin size={16} strokeWidth={1.25} className="mt-0.5 shrink-0" aria-hidden />
              <dt className="sr-only">Address</dt>
              <dd>{signedIn ? `Deliver to ${MEMBER.first}, Phoenix 85018` : "Delivering across Phoenix"}</dd>
            </div>
            <div className="flex gap-3 text-[var(--color-muted)]">
              <IdCard size={16} strokeWidth={1.25} className="mt-0.5 shrink-0" aria-hidden />
              <dt className="sr-only">At the door</dt>
              <dd>Your driver checks ID at the door.</dd>
            </div>
          </dl>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
            <dt className="text-[var(--color-muted)]">Delivered by</dt><dd>The Club courier</dd>
            <dt className="text-[var(--color-muted)]">Sold by</dt><dd>The Club</dd>
            <dt className="text-[var(--color-muted)]">Payment</dt><dd>{member ? "Your linked bank" : "Bank link, set up when you join"}</dd>
          </dl>
          {!member && (
            <p className="mt-5 flex flex-wrap items-center gap-1.5 text-[13px]">
              <ClubSeal /> <span className="tnum">{money(p.member_price)}</span>
              <span className="text-[var(--color-muted)]">when you join at checkout · save {Math.round((1 - p.member_price / p.retail_price) * 100)}%</span>
            </p>
          )}

          <button
            onClick={() => setChatOpen(true)}
            className="group mt-8 flex w-full items-center gap-4 border-t border-[var(--color-hairline)] pt-6 text-left"
          >
            <NoraAvatar size={36} />
            <span className="flex-1">
              <span className="display block text-[20px]">Questions about this?</span>
              <span className="block text-[13px] text-[var(--color-muted)]">Ask {PERSONA.name}, she knows the shelf.</span>
            </span>
            <MessageCircle size={16} strokeWidth={1.25} className="transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
          </button>
        </aside>
      </div>

      {/* Details */}
      <section aria-labelledby="about" className="mt-28 grid gap-12 border-t border-[var(--color-hairline)] pt-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2 id="about" className="display text-[34px] sm:text-[44px]">About this item</h2>
          <ul className="mt-8 space-y-4 text-[15px] leading-[1.7]">
            {bullets.map((b) => (
              <li key={b} className="grid grid-cols-[20px_1fr] gap-3">
                <span className="mt-[0.85em] h-px w-3 bg-[var(--color-ivory)]" aria-hidden />
                <span className="max-w-[62ch]">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <table className="w-full self-start border-t border-[var(--color-ivory)] lg:col-span-5 lg:col-start-8">
          <tbody>
            <Row k="Brand" v={p.brand} />
            <Row k="Type" v={p.strain_type} />
            <Row k="Potency" v={p.potency} />
            <Row k="Format" v={p.format} />
            {p.flavor.length > 0 && <Row k="Flavor" v={p.flavor.map(cap).join(", ")} />}
            <Row k="Effects" v={p.effects.map(cap).join(", ")} />
          </tbody>
        </table>
      </section>

      {/* Related */}
      <section aria-labelledby="related" className="mt-28 border-t border-[var(--color-hairline)] pt-8">
        <h2 id="related" className="display text-[34px] sm:text-[44px]">Members also bought</h2>
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4">
          {related.slice(0, 4).map((x) => (
            <li key={x.id} className="flex">
              <ProductCard p={x} />
            </li>
          ))}
        </ul>
      </section>

      {/* Reviews */}
      <section id="reviews" aria-labelledby="reviews-h" className="mt-28 grid scroll-mt-40 gap-12 border-t border-[var(--color-hairline)] pt-10 lg:grid-cols-[320px_1fr] lg:gap-20">
        <div>
          <h2 id="reviews-h" className="display text-[34px] sm:text-[44px]">Member reviews</h2>
          <div className="mt-5 flex items-center gap-3">
            <Stars rating={p.rating} size={15} />
            <span className="text-[15px]">{p.rating.toFixed(1)} out of 5</span>
          </div>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">{p.review_count} member ratings</p>
          <ul className="mt-6 space-y-2.5">
            {dist.map((pct, i) => (
              <li key={i} className="grid grid-cols-[48px_1fr_40px] items-center gap-3 text-[12px]">
                <span>{5 - i} star</span>
                <span className="h-px bg-[var(--color-hairline-strong)]">
                  <span className="block h-px bg-[var(--color-ivory)]" style={{ width: `${pct}%` }} />
                </span>
                <span className="tnum text-right text-[var(--color-muted)]">{pct}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[12px] text-[var(--color-faint)]">Sample reviews for the demo. Names are fictional.</p>
        </div>
        <ul>
          {reviewsFor(p).map((r, i) => (
            <li key={i} className="border-t border-[var(--color-hairline)] py-9 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-4">
                <Stars rating={r.stars} size={12} />
                <span className="text-[12px] text-[var(--color-muted)]">{REVIEWERS[i].name} · {REVIEWERS[i].date}</span>
              </div>
              <p className="display mt-4 text-[24px] leading-tight">{r.title}</p>
              <p className="mt-3 max-w-[66ch] text-[15px] leading-[1.7]">{r.body}</p>
              <p className="mt-3 text-[12px] text-[var(--color-muted)]">Verified member order</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
