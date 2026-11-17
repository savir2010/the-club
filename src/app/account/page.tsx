import type { Metadata } from "next";
import Link from "next/link";
import { Eye, ThumbsDown, ThumbsUp } from "lucide-react";
import { MEMBER, MEMBER_SAVED, PAST_ORDERS, PERSONA, money } from "@/lib/data";
import { ReorderButton } from "@/components/shop/ReorderButton";
import { SiteFooter } from "@/components/SiteChrome";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { SignedInOnly } from "@/components/SignedInOnly";

export const metadata: Metadata = { title: "Account · The Club" };

function Row({ label, value, action }: { label: string; value: React.ReactNode; action?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-baseline gap-4 border-t border-[var(--color-hairline)] py-4 max-sm:grid-cols-[1fr_auto]">
      <dt className="text-[14px] text-[var(--color-muted)] max-sm:col-span-2">{label}</dt>
      <dd>{value}</dd>
      {action ? <button className="btn-text text-[14px]">{action}</button> : <span />}
    </div>
  );
}

export default function Account() {
  return (
    <div className="min-h-dvh">
      <ShopHeader />
      <SignedInOnly>
      <main className="container-club pt-12 pb-24">
        <h1 className="display text-[44px] sm:text-[52px]">
          {MEMBER.first} {MEMBER.last}
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Member since {MEMBER.since} · {MEMBER.plan}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[var(--radius-panel)] bg-[#17130f] px-7 py-6 text-[#f3ece0]" data-saved>
          <p className="num text-[44px] leading-none text-[#e6c992]">{money(MEMBER_SAVED)}</p>
          <p className="max-w-[48ch] text-[15px] leading-snug text-[#d8cdb9]">
            saved as a member since {MEMBER.since.split(" ")[0]}, across {PAST_ORDERS.length} orders. Delivery was free every time.
          </p>
        </div>

        <div className="mt-14 grid gap-16 lg:grid-cols-12">
          <div className="space-y-16 lg:col-span-7">
            <section aria-labelledby="profile">
              <h2 id="profile" className="display mb-4 text-[30px]">Profile</h2>
              <dl>
                <Row label="Email" value={MEMBER.email} action="Edit" />
                <Row label="Mobile" value={<span className="tnum">{MEMBER.phone}</span>} action="Edit" />
                <Row label="Delivery address" value={MEMBER.address} action="Change" />
                <Row label="Pay with" value={<span className="tnum">{MEMBER.bank}</span>} action="Change" />
                <Row label="ID" value="Verified at sign-up" />
              </dl>
            </section>

            <section aria-labelledby="orders">
              <h2 id="orders" className="display mb-4 text-[30px]">Past orders</h2>
              <ul>
                {PAST_ORDERS.map((o) => (
                  <li key={o.id} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-t border-[var(--color-hairline)] py-5">
                    <p className="font-medium">{o.items.join(", ")}</p>
                    <p className="num row-span-2 text-right text-[22px] text-[var(--color-brass)]">{money(o.total)}</p>
                    <p className="tnum text-[14px] text-[var(--color-muted)]">
                      {o.date} · {o.id} · Delivered
                    </p>
                    <div className="col-span-2 mt-2 flex gap-5">
                      <ReorderButton lines={o.lines} />
                      <Link href={`/orders/${o.id}`} className="btn-text text-[14px] text-[var(--color-muted)]">Details</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:col-span-4 lg:col-start-9" aria-labelledby="prefs">
            <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-7">
              <h2 id="prefs" className="display text-[28px]">What {PERSONA.name} knows</h2>
              <p className="mt-2 flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
                <Eye size={14} aria-hidden /> {PERSONA.name} reads this before every conversation.
              </p>
              <h3 className="mt-7 flex items-center gap-2 text-[14px] font-medium">
                <ThumbsUp size={15} strokeWidth={1.5} className="text-[var(--color-brass)]" aria-hidden /> Likes
              </h3>
              <ul className="mt-3 space-y-2 text-[15px] text-[var(--color-ivory)]/85">
                {MEMBER.likes.map((l) => <li key={l}>{l}</li>)}
              </ul>
              <h3 className="mt-7 flex items-center gap-2 text-[14px] font-medium">
                <ThumbsDown size={15} strokeWidth={1.5} className="text-[var(--color-muted)]" aria-hidden /> Dislikes
              </h3>
              <ul className="mt-3 space-y-2 text-[15px] text-[var(--color-ivory)]/85">
                {MEMBER.dislikes.map((l) => <li key={l}>{l}</li>)}
              </ul>
              <button className="btn btn-outline mt-8 w-full">Edit preferences</button>
            </div>
          </aside>
        </div>
      </main>
      </SignedInOnly>
      <SiteFooter />
    </div>
  );
}
