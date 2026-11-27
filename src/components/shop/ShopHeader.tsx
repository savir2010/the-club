"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, MapPin, Search, ShoppingBag, UserRound } from "lucide-react";
import { CATEGORIES, MEMBER, MEMBER_SAVE_PCT, PERSONA } from "@/lib/data";
import { useSession } from "@/lib/session";
import { NoraAvatar, Wordmark } from "@/components/brand";
import { totals } from "@/components/cart";
import { useShop } from "./ShopState";
import { ThemeToggle } from "./ThemeToggle";
import { ClubSeal } from "./Price";

/** The store's top bar, used on every shopping and account page. */
export function ShopHeader() {
  return (
    <Suspense fallback={<div className="bar h-[124px] border-b border-[var(--color-hairline)]" />}>
      <Header />
    </Suspense>
  );
}

function AccountMenu() {
  const { signedIn, member, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const path = usePathname();
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openedAt = useRef(0);
  const hover = (v: boolean) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (v) {
      if (!open) openedAt.current = Date.now();
      setOpen(true);
    } else closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };
  const signInHref = `/signin?next=${encodeURIComponent(path)}`;

  return (
    <div ref={wrap} className="relative" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
      <button
        id="account-button"
        className="bar-link flex h-10 items-center gap-2.5 px-1 text-left"
        aria-label={signedIn ? `Account, ${MEMBER.first}` : "Account, sign in"}
        aria-expanded={open}
        aria-haspopup="true"
        // a click right after hover-open keeps it open instead of toggling it shut
        onClick={() => setOpen((v) => (v && Date.now() - openedAt.current < 600 ? true : !v))}
      >
        {signedIn && (
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-ivory)] text-[10.5px] font-medium tracking-[0.08em]">
            {MEMBER.first[0]}
            {MEMBER.last[0]}
          </span>
        )}
        {!signedIn && <UserRound size={20} strokeWidth={1.25} className="lg:hidden" aria-hidden />}
        <span className="smallcaps hidden items-center gap-1 lg:flex">
          {signedIn ? MEMBER.first : "Sign in"} <ChevronDown size={12} strokeWidth={1.5} aria-hidden />
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 z-40 mt-3 w-[300px] animate-[fade-up_260ms_var(--ease-out)_both] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-6 shadow-[var(--shadow-float)]"
        >
          {signedIn ? (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] pb-4">
                <span className="grid size-11 place-items-center rounded-full border border-[var(--color-ivory)] text-[13px] tracking-[0.08em]">
                  {MEMBER.first[0]}
                  {MEMBER.last[0]}
                </span>
                <div className="min-w-0">
                  <p className="display text-[20px]">
                    {MEMBER.first} {MEMBER.last}
                  </p>
                  <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)]">
                    {member ? (
                      <>
                        <ClubSeal /> Member since {MEMBER.since}
                      </>
                    ) : (
                      "Not a member yet"
                    )}
                  </p>
                </div>
              </div>
              <ul className="mt-2 text-[14px]">
                {[
                  ["Your account", "/account"],
                  ["Your orders", "/account#orders"],
                  ["Subscribe & Save", "/account/subscriptions"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} onClick={() => setOpen(false)} className="block px-2 py-2.5 transition-colors hover:bg-[var(--color-raised-2)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                className="btn btn-sm btn-outline mt-3 w-full"
                onClick={() => {
                  signOut();
                  setOpen(false);
                  router.push("/shop");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href={signInHref} onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Sign in
              </Link>
              <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-muted)]">
                New here? Keep browsing and fill your cart. You&rsquo;ll join the Club at checkout and unlock member prices.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Header() {
  const { lines, setCartOpen, setChatOpen } = useShop();
  const { signedIn, member } = useSession();
  const t = totals(lines);
  const params = useSearchParams();
  const path = usePathname();
  const active = path === "/shop" ? params.get("category") : null;
  const [cat, setCat] = useState(active ?? "");
  useEffect(() => setCat(active ?? ""), [active]);

  const search = (
    <>
      <label htmlFor="q-cat" className="sr-only">Department</label>
      <select
        id="q-cat"
        name="category"
        value={cat}
        onChange={(e) => setCat(e.target.value)}
        className="smallcaps h-full shrink-0 cursor-pointer appearance-none bg-transparent pr-3 text-[var(--color-muted)] outline-none max-sm:hidden"
      >
        <option value="">All</option>
        {CATEGORIES.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      <span className="h-4 w-px shrink-0 bg-[var(--color-hairline-strong)] max-sm:hidden" aria-hidden />
      <label htmlFor="q" className="sr-only">Search the shop</label>
      <input
        id="q"
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search flower, gummies, brands"
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[var(--color-ivory)] outline-none placeholder:text-[var(--color-faint)]"
      />
      <button aria-label="Search" className="grid h-full w-9 shrink-0 place-items-center transition-opacity hover:opacity-60">
        <Search size={17} strokeWidth={1.25} aria-hidden />
      </button>
    </>
  );

  const askNora = path.startsWith("/shop") ? (
    <button onClick={() => setChatOpen(true)} className="nav-link smallcaps shrink-0 gap-2.5">
      <NoraAvatar size={22} /> Ask {PERSONA.name}
    </button>
  ) : (
    <Link href="/shop" className="nav-link smallcaps shrink-0 gap-2.5">
      <NoraAvatar size={22} /> Ask {PERSONA.name}
    </Link>
  );

  return (
    <header className="bar sticky top-0 z-30 border-b border-[var(--color-hairline)]">
      <div className="mx-auto grid h-[68px] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-8 lg:h-[76px] lg:px-12">
        {/* left: search on desktop, delivery on wide screens */}
        <div className="flex min-w-0 items-center gap-6">
          <form
            action="/shop"
            role="search"
            className="hidden h-10 w-full max-w-[380px] min-w-0 items-center border-b border-[var(--color-hairline-strong)] transition-colors focus-within:border-[var(--color-ivory)] md:flex"
          >
            {search}
          </form>
          <Link href={signedIn ? "/account" : "/signin?next=/shop"} className="bar-link hidden shrink-0 items-center gap-1.5 text-[12px] text-[var(--color-muted)] 2xl:flex">
            <MapPin size={14} strokeWidth={1.25} aria-hidden />
            {signedIn ? `Deliver to ${MEMBER.first} · Phoenix 85018` : "Delivering to Phoenix, AZ"}
          </Link>
        </div>

        <Wordmark href="/shop" className="justify-self-center" />

        <nav aria-label="Account" className="flex items-center justify-end gap-1 sm:gap-3">
          <ThemeToggle />
          <AccountMenu />
          <Link href={signedIn ? "/account#orders" : "/signin?next=/account"} className="nav-link smallcaps hidden px-1 xl:inline-flex">
            Orders
          </Link>
          <button
            id="cart-button"
            onClick={() => setCartOpen(true)}
            className="bar-link flex h-10 items-center gap-2 pl-1"
            aria-label={`Open cart, ${t.count} items`}
          >
            <ShoppingBag size={20} strokeWidth={1.25} className="sm:hidden" aria-hidden />
            <span className="smallcaps hidden sm:inline">Bag</span>
            <span key={t.count} className="count-pop tnum text-[12px]">({t.count})</span>
          </button>
        </nav>
      </div>

      {/* mobile search */}
      <form action="/shop" role="search" className="mx-4 mb-3 flex h-10 items-center border-b border-[var(--color-hairline-strong)] focus-within:border-[var(--color-ivory)] md:hidden">
        {search}
      </form>

      <div className="border-t border-[var(--color-hairline)]">
        <nav aria-label="Departments" className="mx-auto flex h-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-[1600px] items-center gap-7 overflow-x-auto px-4 whitespace-nowrap sm:px-8 lg:gap-9 lg:px-12">
          <span className="hidden w-[260px] shrink-0 items-center gap-2 text-[12px] text-[var(--color-muted)] 2xl:flex">
            <ClubSeal /> {member ? `Member prices on · you save ${MEMBER_SAVE_PCT}%` : `Members save ${MEMBER_SAVE_PCT}% · join at checkout`}
          </span>
          <div className="smallcaps flex flex-1 items-center gap-7 lg:gap-8 2xl:justify-center">
            <Link href="/shop" className="nav-link shrink-0" aria-current={path === "/shop" && !active && !params.get("q") ? "page" : undefined}>
              All
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.name}
                href={`/shop?category=${encodeURIComponent(c.name)}`}
                aria-current={active === c.name ? "page" : undefined}
                className="nav-link shrink-0"
              >
                {c.name}
              </Link>
            ))}
            <Link href="/account/subscriptions" className="nav-link shrink-0">Subscribe &amp; Save</Link>
          </div>
          {/* on shop pages Nora is the launcher at the bottom right; one way in is enough */}
          {!path.startsWith("/shop") && <span className="flex shrink-0 justify-end pl-6 2xl:w-[260px]">{askNora}</span>}
          {path.startsWith("/shop") && <span className="hidden 2xl:block 2xl:w-[260px]" aria-hidden />}
        </nav>
      </div>
    </header>
  );
}
