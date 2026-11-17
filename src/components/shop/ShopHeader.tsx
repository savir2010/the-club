"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid, MapPin, Search, ShoppingBag, UserRound } from "lucide-react";
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
    <Suspense fallback={<div className="bar h-[112px]" />}>
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
        className="bar-link flex items-center gap-2 px-2 py-1.5 text-left"
        aria-label={signedIn ? `Account, ${MEMBER.first}` : "Account, sign in"}
        aria-expanded={open}
        aria-haspopup="true"
        // a click right after hover-open keeps it open instead of toggling it shut
        onClick={() => setOpen((v) => (v && Date.now() - openedAt.current < 600 ? true : !v))}
      >
        {signedIn && (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-brass)] text-[12px] font-semibold text-[var(--color-on-brass)]">
            {MEMBER.first[0]}
            {MEMBER.last[0]}
          </span>
        )}
        {!signedIn && <UserRound size={24} strokeWidth={1.5} className="sm:hidden" aria-hidden />}
        <span className="hidden leading-tight sm:block">
          <span className="block text-[12px] text-[var(--color-muted)]">{signedIn ? `Hello, ${MEMBER.first}` : "Hello, sign in"}</span>
          <span className="flex items-center gap-1 text-[14px] font-semibold">
            Account <ChevronDown size={13} className="text-[var(--color-muted)]" aria-hidden />
          </span>
        </span>
      </button>

      {open && (
        <div
          className="unbar absolute top-full right-0 z-40 mt-2 w-[300px] animate-[fade-up_180ms_var(--ease-out)_both] rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-5 shadow-[var(--shadow-float)]"
        >
          {signedIn ? (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] pb-4">
                <span className="grid size-11 place-items-center rounded-full bg-[var(--color-brass)] text-[15px] font-semibold text-[var(--color-on-brass)]">
                  {MEMBER.first[0]}
                  {MEMBER.last[0]}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">
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
                  ["Monthly box", "/account/subscriptions"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} onClick={() => setOpen(false)} className="block rounded-[8px] px-2 py-2 hover:bg-[var(--color-raised-2)]">
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
        className="h-full shrink-0 cursor-pointer rounded-l-[10px] border-r border-black/10 bg-[#ece4d6] pr-2 pl-3 text-[13px] text-[#3a332a] outline-none max-sm:hidden"
      >
        <option value="">All</option>
        {CATEGORIES.map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>
      <label htmlFor="q" className="sr-only">Search the shop</label>
      <input
        id="q"
        name="q"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search flower, gummies, brands…"
        className="h-full min-w-0 flex-1 bg-[#fffdf9] px-3.5 text-[15px] text-[#2b261f] outline-none placeholder:text-[#8a8070] max-sm:rounded-l-[10px]"
      />
      <button aria-label="Search" className="grid h-full w-12 shrink-0 place-items-center rounded-r-[10px] bg-[var(--color-brass)] text-[#17130f] hover:bg-[var(--color-brass-hi)]">
        <Search size={19} strokeWidth={2} aria-hidden />
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-30">
      <div className="bar pb-3.5 md:pb-0">
        <div className="mx-auto flex h-[64px] max-w-[1600px] items-center gap-3 px-3 sm:gap-4 sm:px-5">
          <div className="bar-link px-1.5 py-1">
            <Wordmark href="/shop" />
          </div>

          <Link href={signedIn ? "/account" : "/signin?next=/shop"} className="bar-link hidden items-end gap-1 px-2 py-1.5 lg:flex">
            <MapPin size={18} strokeWidth={1.6} className="mb-0.5 text-[var(--color-muted)]" aria-hidden />
            <span className="leading-tight">
              <span className="block text-[12px] text-[var(--color-muted)]">{signedIn ? `Deliver to ${MEMBER.first}` : "Delivering to"}</span>
              <span className="block text-[14px] font-semibold">{signedIn ? "Phoenix 85018" : "Phoenix, AZ"}</span>
            </span>
          </Link>

          <form
            action="/shop"
            role="search"
            className="mx-1 hidden h-11 min-w-0 flex-1 overflow-hidden rounded-[10px] ring-[var(--color-brass)] focus-within:ring-2 md:flex"
          >
            {search}
          </form>

          <nav aria-label="Account" className="ml-auto flex items-center gap-1 md:ml-0">
            <ThemeToggle />
            <AccountMenu />
            <Link href={signedIn ? "/account#orders" : "/signin?next=/account"} className="bar-link hidden px-2 py-1.5 leading-tight xl:block">
              <span className="block text-[12px] text-[var(--color-muted)]">Returns</span>
              <span className="block text-[14px] font-semibold">&amp; Orders</span>
            </Link>
            <button
              id="cart-button"
              onClick={() => setCartOpen(true)}
              className="bar-link flex items-end gap-1.5 px-2 py-1.5"
              aria-label={`Open cart, ${t.count} items`}
            >
              <span className="relative">
                <ShoppingBag size={26} strokeWidth={1.5} aria-hidden />
                <span key={t.count} className="count-pop tnum absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--color-brass)] px-1 text-[11px] font-bold text-[var(--color-on-brass)]">
                  {t.count}
                </span>
              </span>
              <span className="hidden text-[14px] font-semibold sm:inline">Cart</span>
            </button>
          </nav>
        </div>

        {/* mobile search */}
        <form action="/shop" role="search" className="mx-3 flex h-11 overflow-hidden rounded-[10px] md:hidden">
          {search}
        </form>
      </div>

      <div className="bar bar-2 hidden md:block">
        <nav aria-label="Departments" className="mx-auto flex h-11 max-w-[1600px] items-center gap-1 overflow-x-auto px-3 text-[14px] whitespace-nowrap sm:px-5">
          <Link href="/shop" className="bar-link flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 font-semibold" aria-current={path === "/shop" && !active && !params.get("q") ? "page" : undefined}>
            <LayoutGrid size={16} aria-hidden /> All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              href={`/shop?category=${encodeURIComponent(c.name)}`}
              aria-current={active === c.name ? "page" : undefined}
              className={`bar-link shrink-0 px-2.5 py-1.5 ${active === c.name ? "text-[var(--color-brass)]" : ""}`}
            >
              {c.name}
            </Link>
          ))}
          <Link href="/account/subscriptions" className="bar-link shrink-0 px-2.5 py-1.5">Monthly box</Link>

          <span className="ml-auto flex shrink-0 items-center gap-3 pl-4">
            {member ? (
              <span className="hidden items-center gap-2 text-[13px] text-[var(--color-muted)] md:flex">
                <ClubSeal /> Member prices on · you save {MEMBER_SAVE_PCT}%
              </span>
            ) : (
              <span className="hidden items-center gap-2 text-[13px] text-[var(--color-muted)] md:flex">
                <ClubSeal /> Members save {MEMBER_SAVE_PCT}% on every item · join at checkout
              </span>
            )}
            {path.startsWith("/shop") ? (
              <button onClick={() => setChatOpen(true)} className="bar-link flex items-center gap-2 px-2 py-1 font-semibold text-[var(--color-brass)]">
                <NoraAvatar size={22} /> Ask {PERSONA.name}
              </button>
            ) : (
              <Link href="/shop" className="bar-link flex items-center gap-2 px-2 py-1 font-semibold text-[var(--color-brass)]">
                <NoraAvatar size={22} /> Ask {PERSONA.name}
              </Link>
            )}
          </span>
        </nav>
      </div>
    </header>
  );
}
