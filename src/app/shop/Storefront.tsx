"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, Repeat } from "lucide-react";
import {
  BOX, CATEGORIES, MEMBER, MEMBER_SAVE_PCT, MEMBER_SAVED, PAST_ORDERS, PERSONA, PRODUCTS, USUAL, WEEKLY_PICKS,
  byId, money, plateCutout, type Product,
} from "@/lib/data";
import { BoxMeter } from "@/components/cart";
import { useSession } from "@/lib/session";
import { NoraAvatar } from "@/components/brand";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/shop/ProductCard";
import { ClubSeal } from "@/components/shop/Price";
import { useShop } from "@/components/shop/ShopState";
import { RevealOnScroll } from "@/components/LandingMotion";

function Rail({ id, title, note, href, items, limit = 8 }: { id: string; title: string; note?: string; href?: string; items: Product[]; limit?: number }) {
  return (
    <section aria-labelledby={id} data-reveal>
      <div className="flex items-end justify-between gap-6 border-t border-[var(--color-hairline)] pt-7">
        <div>
          <h2 id={id} className="display text-[30px] leading-none sm:text-[40px]">{title}</h2>
          {note && <p className="mt-3 text-[13px] text-[var(--color-muted)]">{note}</p>}
        </div>
        {href && (
          <Link href={href} className="nav-link smallcaps shrink-0">
            View all
          </Link>
        )}
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4">
        {items.slice(0, limit).map((p, i) => (
          <li key={p.id} data-reveal-child style={{ ["--i" as string]: i % 4 }} className="flex">
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const panel = "flex flex-col border-t border-[var(--color-ivory)] pt-6";
const panelTitle = "display text-[26px] leading-tight";

function Thumb({ id }: { id: string }) {
  const p = byId(id);
  return (
    <span className="h-14 w-11 shrink-0 overflow-hidden">
      <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
    </span>
  );
}

/** Members: the usual in one tap, this week's picks from Nora, and what the membership has saved them. */
function ForYou() {
  const { add, setCartOpen } = useShop();
  const [texting, setTexting] = useState(false);
  const [sent, setSent] = useState<"idle" | "busy" | "sent" | string>("idle");

  useEffect(() => {
    fetch("/api/nora/sms/info", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setTexting(!!d.texting))
      .catch(() => {});
  }, []);

  const addAll = (ls: { id: string; qty: number }[]) => {
    ls.forEach((l) => add(l.id, l.qty, false));
    setCartOpen(true);
  };

  const textPicks = async () => {
    setSent("busy");
    try {
      const r = await fetch("/api/nora/sms/weekly", { method: "POST" });
      const d = await r.json();
      setSent(r.ok ? "sent" : d.message || "Couldn't text right now.");
    } catch {
      setSent("Couldn't text right now.");
    }
  };

  return (
    <section aria-label={`For ${MEMBER.first}`} className="grid gap-12 lg:grid-cols-[1fr_1.35fr_0.85fr] lg:gap-14">
      <div className={panel} data-usual>
        <h2 className={panelTitle}>Your usual</h2>
        <ul className="mt-4 space-y-3">
          {USUAL.lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3">
              <Thumb id={l.id} />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-medium">{byId(l.id).name}</span>
                <span className="tnum block text-[12px] text-[var(--color-muted)]">
                  {l.qty > 1 ? `${l.qty} × ` : ""}{money(byId(l.id).member_price)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-[var(--color-muted)]">Last ordered {USUAL.date}</p>
        <div className="mt-auto pt-4">
          <button className="btn btn-primary w-full" onClick={() => addAll(USUAL.lines)} data-reorder>
            <Repeat size={13} strokeWidth={1.5} aria-hidden /> Reorder · {money(USUAL.total)}
          </button>
          <p className="mt-2.5 text-center text-[12px] text-[var(--color-muted)]">
            Or text {PERSONA.name} &ldquo;the usual, tonight&rdquo;
          </p>
        </div>
      </div>

      <div className={panel} data-weekly>
        <div className="flex items-center gap-3">
          <NoraAvatar size={34} />
          <div>
            <h2 className={panelTitle}>This week from {PERSONA.name}</h2>
            <p className="text-[13px] text-[var(--color-muted)]">Chosen for you, from what you like</p>
          </div>
        </div>
        <ul className="mt-4 space-y-3.5">
          {WEEKLY_PICKS.map((w) => {
            const p = byId(w.id);
            return (
              <li key={w.id} className="flex gap-3">
                <Thumb id={w.id} />
                <span className="min-w-0 flex-1">
                  <Link href={`/shop/${p.id}`} className="block text-[14px] font-medium underline-offset-4 hover:underline">
                    {p.name} <span className="tnum font-normal text-[var(--color-muted)]">· {money(p.member_price)}</span>
                  </Link>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[var(--color-ivory)]/80">{w.reason}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
          <button className="btn btn-sm btn-outline" onClick={() => addAll(WEEKLY_PICKS.map((w) => ({ id: w.id, qty: 1 })))}>
            Add both
          </button>
          {texting && (
            <button className="btn btn-sm btn-outline" onClick={textPicks} disabled={sent === "busy" || sent === "sent"} data-text-picks>
              {sent === "sent" ? <><Check size={14} className="text-[var(--color-brass)]" aria-hidden /> Sent to your phone</> : <><MessageCircle size={14} aria-hidden /> Text me these</>}
            </button>
          )}
          {sent !== "idle" && sent !== "busy" && sent !== "sent" && <p className="w-full text-[12px] text-[var(--color-clay)]">{sent}</p>}
        </div>
      </div>

      <div className="flex flex-col bg-[var(--color-ivory)] text-[var(--color-canvas)] p-7" data-saved>
        <h2 className="display text-[26px] leading-tight">Your membership</h2>
        <p className="display mt-6 text-[56px] leading-none">{money(MEMBER_SAVED)}</p>
        <p className="mt-3 text-[14px] leading-snug opacity-75">
          saved since {MEMBER.since.split(" ")[0]}, across {PAST_ORDERS.length} orders. Delivery was free every time.
        </p>
        <Link href="/account" className="btn-text smallcaps mt-auto self-start pt-6">
          See your orders
        </Link>
      </div>
    </section>
  );
}

/** The Box: any three items, an extra discount. Fills as the cart does. */
function BoxBand() {
  const { lines } = useShop();
  return (
    <section aria-labelledby="the-box" data-reveal className="grid items-center gap-8 bg-[var(--color-cream)] px-6 py-10 sm:px-12 sm:py-14 md:grid-cols-[1fr_minmax(320px,420px)]">
      <div>
        <h2 id="the-box" className="display text-[32px] leading-tight sm:text-[44px]">
          The Box: any {BOX.size} items, {BOX.pct}% off.
        </h2>
        <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-[var(--color-muted)]">
          Mix flower, vapes, edibles, anything on the shelf. Members already pay {MEMBER_SAVE_PCT}% less; a full box takes another {BOX.pct}% off the order.
        </p>
      </div>
      <BoxMeter lines={lines} className="bg-[var(--color-canvas)]" />
    </section>
  );
}

/** The box Nora put together for the signed-in member this week: the four items in the hero photo. */
const NORA_BOX = ["pre-002", "vap-004", "top-002", "edb-005"];
/** What guests see in the hero: a still life of the house range, chosen by hand (not the best-seller list).
 *  x is the centre across the picture, h the height as a share of it; later items stand in front. */
const GUEST_STILL = [
  // h can pass 100: each cut-out has clear space around the product, and the edges are clipped
  { id: "flw-001", x: 21, h: 92, y: 4 },
  { id: "edb-001", x: 47, h: 124, y: -10 },
  { id: "cnc-001", x: 73, h: 84, y: -8 },
];

/** The house range, one category at a time, so the rail never repeats the Flower rail below it. */
function houseMix() {
  const house = PRODUCTS.filter((p) => p.house_brand && p.in_stock);
  const order = ["Edibles", "Concentrates", "Flower"];
  const queues = order.map((c) => house.filter((p) => p.category === c));
  const out: Product[] = [];
  while (queues.some((q) => q.length)) queues.forEach((q) => q.length && out.push(q.shift()!));
  return out;
}

/** Signed-in members: the photo of the box Nora curated, with one tap to put all of it in the cart. */
function NoraBoxPlate() {
  const { add, setCartOpen, setChatOpen } = useShop();
  const items = NORA_BOX.map(byId);
  const total = items.reduce((s, p) => s + p.member_price, 0);
  const addBox = () => {
    items.forEach((p) => add(p.id, 1, false));
    setCartOpen(true);
  };
  return (
    <figure className="relative min-h-[420px] overflow-hidden sm:min-h-[560px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/hero/nora-box.webp"
        alt={`A basket ${PERSONA.name} curated for you: ${items.map((p) => p.name).join(", ")}`}
        className="absolute inset-0 size-full animate-[fade-in_1400ms_var(--ease-out)_both] object-cover object-[52%_50%] lg:[mask-image:linear-gradient(to_right,transparent,#000_22%)]"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 bg-gradient-to-t from-[#bea586] via-[#bea586]/85 to-transparent p-6 pt-16 text-[#111111] sm:p-8 sm:pt-24 lg:pr-[max(2rem,calc(50vw-800px+3rem))]">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[12px] text-[#111111]/75">
            <NoraAvatar size={22} /> Curated by {PERSONA.name} for you
          </span>
          <span className="display mt-2 block text-[26px] leading-tight sm:text-[30px]">Your box this week</span>
          <span className="mt-1 block text-[13px] text-[#111111]/75">
            {items.length} pieces · <span className="tnum">{money(total)}</span>, {BOX.pct}% off as a box
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-6">
          <button onClick={() => setChatOpen(true)} className="btn-text smallcaps text-[#111111]">
            Change it
          </button>
          <button onClick={addBox} className="btn btn-primary">
            Add the box
          </button>
        </span>
      </figcaption>
    </figure>
  );
}

/** Guests: three house pieces standing together on the tan, each one a way into its page. */
function GuestStill() {
  return (
    <div className="relative min-h-[440px] overflow-hidden sm:min-h-[600px]">
      <div className="absolute inset-x-0 top-0 bottom-28">
        {GUEST_STILL.map(({ id, x, h, y }, i) => {
          const p = byId(id);
          return (
            <Link
              key={id}
              href={`/shop/${id}`}
              aria-label={p.name}
              className="absolute aspect-[4/5] -translate-x-1/2"
              style={{ left: `${x}%`, bottom: `${y}%`, height: `${h}%`, zIndex: i }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plateCutout(p.image)}
                alt=""
                className="size-full animate-[fade-up_1100ms_var(--ease-out)_both] object-contain drop-shadow-[0_26px_26px_rgb(70_48_22/0.3)]"
                style={{ animationDelay: `${200 + i * 140}ms` }}
              />
            </Link>
          );
        })}
      </div>
      <Link
        href="/shop?q=Copperstate"
        className="group absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 text-[#111111] sm:p-8 lg:pr-[max(2rem,calc(50vw-800px+3rem))]"
      >
        <span>
          <span className="smallcaps block text-[11px] text-[#111111]/70">Copperstate</span>
          <span className="display mt-1 block text-[24px] leading-tight sm:text-[28px]">From the house, grown in Arizona</span>
        </span>
        <span className="nav-link smallcaps shrink-0">Shop the house</span>
      </Link>
    </div>
  );
}

export function Storefront() {
  const { member, signedIn } = useSession();
  const { setChatOpen } = useShop();
  const best = [...PRODUCTS].filter((p) => p.in_stock).sort((a, b) => b.review_count * b.rating - a.review_count * a.rating).slice(0, 8);
  const house = houseMix();

  return (
    <div className="pb-32">
      <RevealOnScroll />
      {/* The hero takes the tan backdrop of Nora's box photo, for members and guests alike. The picture
          runs to the right edge of the screen; the words stay on the page's 1600px column. */}
      <section className="nora-hero">
        <div className="grid items-stretch lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-center px-5 py-16 sm:px-12 sm:py-24 lg:pr-16 lg:pl-[max(4rem,calc(50vw-800px+4rem))] xl:pr-24 xl:pl-[max(6rem,calc(50vw-800px+6rem))]">
            <p className="flex animate-[fade-in_900ms_var(--ease-out)_both] items-center gap-2.5 text-[12px] text-[var(--color-muted)]">
              <ClubSeal /> {member ? `Member prices are on · you save ${MEMBER_SAVE_PCT}%` : `Open to browse · members save ${MEMBER_SAVE_PCT}%`}
            </p>
            <h1 className="display mt-7 max-w-[13ch] text-[46px] leading-[1] tracking-[-0.015em] sm:text-[68px] xl:text-[84px]">
              <span className="rise"><span>{member ? `Welcome back, ${MEMBER.first}.` : "Tonight’s shelf, at your door by eight."}</span></span>
            </h1>
            <p className="mt-7 max-w-[44ch] animate-[fade-up_1000ms_var(--ease-out)_400ms_both] text-[15px] leading-relaxed text-[var(--color-muted)] sm:text-[16px]">
              {member
                ? `Every price below is your member price. ${PERSONA.name} remembers what you like and can reorder in one message.`
                : `Browse the whole shelf and fill your cart. Join at checkout and every price drops ${MEMBER_SAVE_PCT}%, with free delivery.`}
            </p>
            <div className="mt-10 flex animate-[fade-up_1000ms_var(--ease-out)_540ms_both] flex-wrap items-center gap-x-9 gap-y-4">
              <button onClick={() => setChatOpen(true)} className="btn btn-lg btn-primary pl-2.5">
                <NoraAvatar size={34} /> Ask {PERSONA.name}
              </button>
              <a href="#best" className="btn-text smallcaps">
                Shop best sellers
              </a>
            </div>
            {!signedIn && (
              <p className="mt-8 text-[13px] text-[var(--color-muted)]">
                Already a member?{" "}
                <Link href="/signin?next=/shop" className="text-[var(--color-ivory)] underline decoration-[var(--color-ivory)]/30 underline-offset-4 hover:decoration-[var(--color-ivory)]">
                  Sign in
                </Link>
              </p>
            )}
          </div>

          {member ? (
            <NoraBoxPlate />
          ) : (
            <GuestStill />
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1600px] space-y-28 px-4 pt-20 sm:space-y-36 sm:px-8 sm:pt-28 lg:px-12">
        {member && <ForYou />}

        {/* Departments: an index of the shelf */}
        <section aria-labelledby="departments" data-reveal>
          <h2 id="departments" className="display border-t border-[var(--color-hairline)] pt-7 text-[30px] leading-none sm:text-[40px]">
            The shelf
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-6">
            {CATEGORIES.map((c, i) => {
              const p = PRODUCTS.find((x) => x.category === c.name)!;
              return (
                <li key={c.name} data-reveal-child style={{ ["--i" as string]: i }}>
                  <Link href={`/shop?category=${encodeURIComponent(c.name)}`} className="group block">
                    <span className="plate plate-cut">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={plateCutout(p.image)} alt="" loading="lazy" />
                    </span>
                    <span className="mt-4 flex items-baseline justify-between gap-3">
                      <span className="display nav-link py-0 text-[22px]">{c.name}</span>
                      <span className="tnum text-[12px] text-[var(--color-muted)]">{c.count}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div id="best" className="scroll-mt-36">
          <Rail id="rail-best" title="Best sellers" note="Most ordered by members this month" items={best} />
        </div>

        <BoxBand />

        <Rail id="rail-house" title="From the Copperstate house" note="Grown and made in Arizona" href="/shop?q=Copperstate" items={house} limit={4} />

        {/* Nora: one quiet line, not a widget */}
        <section aria-label={`Ask ${PERSONA.name}`} data-reveal className="border-y border-[var(--color-hairline)] py-16 text-center sm:py-24">
          <div className="flex justify-center"><NoraAvatar size={56} status /></div>
          <p className="display mx-auto mt-7 max-w-[20ch] text-[34px] leading-[1.1] sm:text-[48px]">Not sure where to start?</p>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15px] text-[var(--color-muted)]">
            Tell {PERSONA.name} the occasion. She&rsquo;ll pick a few, explain them plainly and fill your cart.
          </p>
          <button onClick={() => setChatOpen(true)} className="btn btn-outline mt-9">
            Ask {PERSONA.name}
          </button>
        </section>

        {CATEGORIES.map((c) => (
          <Rail
            key={c.name}
            id={`rail-${c.name}`}
            title={c.name}
            href={`/shop?category=${encodeURIComponent(c.name)}`}
            items={PRODUCTS.filter((p) => p.category === c.name)}
            limit={4}
          />
        ))}
      </div>
    </div>
  );
}
