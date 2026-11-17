import Link from "next/link";
import { Wordmark } from "./brand";

export function SiteHeader({ variant = "public" }: { variant?: "public" | "member" | "overlay" }) {
  const overlay = variant === "overlay";
  return (
    <header
      className={`${overlay ? "absolute inset-x-0 top-0 z-20" : "border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]"}`}
    >
      <div className="container-club flex h-[76px] items-center justify-between">
        <Wordmark />
        {variant === "member" ? (
          <nav aria-label="Member" className="flex items-center gap-1 text-[14px]">
            <Link href="/shop" className="rounded-md px-3 py-2 text-[var(--color-muted)] hover:text-[var(--color-ivory)]">
              Concierge
            </Link>
            <Link
              href="/account/subscriptions"
              className="hidden rounded-md px-3 py-2 text-[var(--color-muted)] hover:text-[var(--color-ivory)] sm:inline"
            >
              Monthly box
            </Link>
            <Link href="/account" className="rounded-md px-3 py-2 text-[var(--color-muted)] hover:text-[var(--color-ivory)]">
              Account
            </Link>
          </nav>
        ) : (
          <nav aria-label="Membership" className="flex items-center gap-2 sm:gap-3">
            <Link href="/signin" className="btn btn-sm btn-text hidden px-2 sm:inline-flex">
              Sign in
            </Link>
            <Link href="/shop" className="btn btn-sm btn-primary rounded-full">
              Start shopping
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="border-t border-[var(--color-hairline)]">
      <div
        className={`container-club flex flex-col gap-3 text-[13px] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between ${compact ? "py-5" : "py-10"}`}
      >
        <p>Members must be 21 or older. Demo only.</p>
        <p className="text-[var(--color-faint)]">The Club · Phoenix, Arizona</p>
      </div>
    </footer>
  );
}
