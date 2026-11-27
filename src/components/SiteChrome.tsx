import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { Wordmark } from "./brand";

export function SiteHeader({ variant = "public" }: { variant?: "public" | "member" | "overlay" }) {
  const overlay = variant === "overlay";
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-20 text-[#FAF9F6] [--color-ivory:#FAF9F6] [--color-canvas:#111111] [--color-brass:#FAF9F6] [--color-on-brass:#111111]"
          : "border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]"
      }
    >
      <div className="container-club grid h-[84px] grid-cols-[1fr_auto_1fr] items-center gap-6">
        <nav aria-label="Primary" className="smallcaps hidden items-center gap-8 md:flex">
          {variant === "member" ? (
            <>
              <Link href="/shop" className="nav-link">Shop</Link>
              <Link href="/account/subscriptions" className="nav-link">Subscribe &amp; Save</Link>
            </>
          ) : (
            <>
              <Link href="/shop" className="nav-link">Shop</Link>
              <Link href="/#how" className="nav-link">The concierge</Link>
              <Link href="/#plans" className="nav-link">Membership</Link>
            </>
          )}
        </nav>
        <Wordmark className="col-start-1 md:col-start-2" />
        <nav aria-label="Account" className="smallcaps col-start-3 flex items-center justify-end gap-6 sm:gap-8">
          {variant === "member" ? (
            <Link href="/account" className="nav-link">Account</Link>
          ) : (
            <>
              <Link href="/signin" className="nav-link hidden sm:inline-flex">Sign in</Link>
              <Link href="/shop" className="nav-link">
                Shop<span className="hidden sm:inline">&nbsp;the shelf</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "The shelf",
    links: [["Everything", "/shop"], ...CATEGORIES.slice(0, 5).map((c) => [c.name, `/shop?category=${encodeURIComponent(c.name)}`] as [string, string])],
  },
  {
    title: "The Club",
    links: [
      ["Request membership", "/join"],
      ["Sign in", "/signin"],
      ["Subscribe & Save", "/account/subscriptions"],
    ],
  },
  {
    title: "Members",
    links: [
      ["Your account", "/account"],
      ["Your orders", "/account#orders"],
    ],
  },
];

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact)
    return (
      <footer className="border-t border-[var(--color-hairline)]">
        <div className="container-club flex flex-col gap-2 py-6 text-[12px] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>Members must be 21 or older. Demo only.</p>
          <p className="smallcaps text-[var(--color-faint)]">The Club · Phoenix, Arizona</p>
        </div>
      </footer>
    );
  return (
    <footer className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]">
      <div className="container-club grid gap-14 pt-20 pb-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="display text-[34px] leading-[1.08] sm:text-[40px]">A private house for the evening ahead.</p>
          <p className="mt-5 max-w-[38ch] text-[14px] text-[var(--color-muted)]">
            Members-only delivery from an Arizona grower, with a concierge who knows the shelf.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-6 md:col-start-7">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[13px] text-[var(--color-muted)]">{col.title}</p>
              <ul className="mt-5 space-y-3 text-[14px]">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="nav-link py-0">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="container-club">
        <div className="flex flex-col gap-3 border-t border-[var(--color-hairline)] py-7 text-[12px] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>Members must be 21 or older. Demo only.</p>
          <p className="smallcaps text-[var(--color-faint)]">The Club · Phoenix, Arizona</p>
        </div>
      </div>
    </footer>
  );
}
