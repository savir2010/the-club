"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Landmark, Lock, MapPin, Repeat } from "lucide-react";
import { ADDRESSES, DELIVERY_SLOTS, MEMBER, MEMBER_SAVE_PCT, PERSONA, TAX_RATE, byId, money } from "@/lib/data";
import { Monogram, NoraAvatar, Wordmark } from "@/components/brand";
import { useSession } from "@/lib/session";
import { useShop } from "@/components/shop/ShopState";
import { MembershipFlow } from "@/components/membership/MembershipFlow";
import { useNoraPointer } from "@/components/NoraPointer";
import { ProductArt } from "@/components/ProductArt";
import { LinePrice, Stepper, totals } from "@/components/cart";
import { SiteFooter } from "@/components/SiteChrome";
import { ThemeSync } from "@/components/shop/ThemeToggle";

const SLOTS = DELIVERY_SLOTS;
/** What Nora was asked to do at checkout, handed over from the chat (see NoraChat). */
type Autopilot = { day?: string | null; window?: string | null; address?: string | null; pay?: boolean };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TIPS = [15, 18, 20] as const;

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--color-hairline)] py-8 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="display text-[26px]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The turn: membership is active and the member price lands on this order. */
function Welcome({ savings, onContinue }: { savings: number; onContinue: () => void }) {
  const next = useRef(onContinue);
  next.current = onContinue;
  useEffect(() => {
    const t = setTimeout(() => next.current(), 3400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex min-h-[480px] flex-col items-start justify-center">
      <div className="relative grid size-[112px] place-items-center">
        <span className="absolute inset-0 rounded-full border border-[var(--color-brass)] motion-safe:animate-[ring-out_1400ms_var(--ease-out)_300ms_both]" aria-hidden />
        <span className="grid size-[112px] place-items-center rounded-full bg-[var(--color-raised)] ring-1 ring-[var(--color-brass)]/50 shadow-[var(--shadow-float)] motion-safe:animate-[seal-in_700ms_var(--ease-out)_both]">
          <Monogram size={72} />
        </span>
      </div>
      <h2 className="display mt-8 text-[40px] leading-[1.05] sm:text-[48px] motion-safe:animate-[fade-up_500ms_var(--ease-out)_250ms_both]">
        You&rsquo;re a member, {MEMBER.first}.
      </h2>
      <p className="mt-4 max-w-[46ch] text-[17px] text-[var(--color-ivory)]/85 motion-safe:animate-[fade-up_500ms_var(--ease-out)_400ms_both]">
        Member prices are now applied to this order
        {savings > 0 && (
          <>
            {" "}
            and you save <span className="num text-[var(--color-brass)]">{money(savings)}</span>
          </>
        )}
        . Next, choose where and when it arrives.
      </p>
      <button className="btn btn-lg btn-primary mt-9 rounded-full motion-safe:animate-[fade-up_500ms_var(--ease-out)_550ms_both]" onClick={onContinue}>
        Continue to delivery
      </button>
    </div>
  );
}

/** Before joining: what this cart costs at retail, and what it costs as a member. */
function GateSummary({ joined = false }: { joined?: boolean }) {
  const { lines } = useShop();
  const t = totals(lines);
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start" aria-label="Order summary">
      <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-6 sm:p-7">
        <h2 className="display text-[24px]">Your order</h2>
        <ul className="mt-5 space-y-3">
          {lines.map((l) => {
            const p = byId(l.id);
            return (
              <li key={l.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                <span className="size-12 overflow-hidden rounded-[8px] ring-1 ring-[var(--color-hairline)]">
                  <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{p.name}</span>
                  <span className="block text-[12px] text-[var(--color-muted)]">Qty {l.qty}</span>
                </span>
                <span className="tnum text-[14px]">{money(p.retail_price * l.qty)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="mt-6 space-y-2.5 border-t border-[var(--color-hairline)] pt-5 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Retail price</dt>
            <dd className="tnum">{money(t.retail)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Delivery</dt>
            <dd>Free</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--color-hairline)] pt-4">
            <dt className="flex items-center gap-2 font-medium">
              <span className="inline-flex h-[18px] items-center rounded-[4px] bg-[var(--color-brass)] px-1.5 text-[10px] font-bold tracking-[0.08em] text-[var(--color-on-brass)] uppercase">Club</span>
              Member price
              {joined && <Check size={15} strokeWidth={2.5} className="text-[var(--color-brass)]" aria-label="applied" />}
            </dt>
            <dd className="num text-[30px] leading-none">{money(t.member)}</dd>
          </div>
          {t.savings > 0 && (
            <p className="text-right text-[13px] text-[var(--color-brass)]">{joined ? `Applied · you save ${money(t.savings)} (${MEMBER_SAVE_PCT}%)` : `Join and save ${money(t.savings)}, ${MEMBER_SAVE_PCT}% off`}</p>
          )}
        </dl>
        <p className="mt-6 rounded-[10px] bg-[var(--color-canvas)] p-3.5 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {joined ? "Next, choose where and when it arrives. Tax and tip are added there." : "Finish joining to choose a delivery window and pay. Tax and tip are added on the next step."}
        </p>
      </div>
    </aside>
  );
}

export default function Checkout() {
  const router = useRouter();
  const { lines, setQty: setLineQty } = useShop();
  const session = useSession();
  // gate: not a member yet, so joining comes first · welcome: the membership turn · order: delivery and payment
  const [phase, setPhase] = useState<"loading" | "gate" | "welcome" | "order">("loading");
  const plan = useRef<Autopilot | null>(null);
  const [noraNote, setNoraNote] = useState<string | null>(null);
  // A member arriving from Nora gets her cursor; a shopper who just joined does not.
  const runAutopilot = useRef(true);
  const [day, setDay] = useState<keyof typeof SLOTS>("Today");
  const [slot, setSlot] = useState("7:00–8:00 PM");
  const [tip, setTip] = useState<number | "custom">(18);
  const [custom, setCustom] = useState("10");
  const [monthly, setMonthly] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState(ADDRESSES[0].id); // last used
  const [nora, setNora] = useState<string | null>(null); // banner while Nora is checking out
  const stopped = useRef(false);
  const pointer = useNoraPointer(() => ({ x: window.innerWidth - 160, y: window.innerHeight * 0.35 }));

  // Read Nora's hand-off once, then decide whether this shopper has to join first.
  useEffect(() => {
    if (!session.ready || phase !== "loading") return;
    try {
      // (keep what an earlier run already read: dev mode runs effects twice)
      const saved = JSON.parse(sessionStorage.getItem("club-autopilot") ?? "null");
      if (saved) plan.current = saved;
      sessionStorage.removeItem("club-autopilot");
    } catch {}
    if (session.member) {
      setPhase("order");
    } else {
      // Nora can bring a guest here, but only members can be checked out by her.
      if (plan.current) setNoraNote(`Join the Club to check out. Once you're a member, I can place orders for you.`);
      setPhase("gate");
    }
  }, [session.ready, session.member, phase]);

  // Delivery choices Nora was given carry over after joining (she doesn't pay for a new member).
  const applyChoices = (p: Autopilot) => {
    if (p.address && ADDRESSES.some((a) => a.id === p.address)) setAddress(p.address);
    const d = (p.day && p.day in SLOTS ? p.day : null) as keyof typeof SLOTS | null;
    if (d) setDay(d);
    if (p.window && SLOTS[d ?? day].includes(p.window)) setSlot(p.window);
  };

  // Nora checks out for a member: each step is a real click by her cursor, so the member can watch and stop it.
  useEffect(() => {
    if (phase !== "order" || !plan.current) return;
    const auto = plan.current;
    plan.current = null;
    if (!session.member || !runAutopilot.current) {
      applyChoices(auto);
      return;
    }
    const go = async () => {
      const p = pointer.api;
      const q = (key: string) => document.querySelector(`[data-nora="${CSS.escape(key)}"]`);
      const step = async (key: string, caption: string) => {
        if (stopped.current) throw new Error("stopped");
        await p.moveTo(q(key), caption);
        if (stopped.current) throw new Error("stopped");
        await p.click(q(key));
        await sleep(350);
      };
      setNora("Nora is checking out for you");
      await sleep(900);
      try {
        if (auto.address) {
          const a = ADDRESSES.find((x) => x.id === auto.address);
          await step(`address-${auto.address}`, `Delivering to ${a?.label ?? "you"}`);
        }
        // skip a day tab that is already selected (clicking it would reset the time slot)
        if (auto.day && q(`day-${auto.day}`)?.getAttribute("aria-selected") !== "true") await step(`day-${auto.day}`, `Delivery ${auto.day.toLowerCase()}`);
        if (auto.window) {
          await sleep(200); // the slots re-render after a day change
          await step(`slot-${auto.window}`, `Picking ${auto.window}`);
        }
        if (auto.pay) {
          await p.moveTo(q("pay-with"), `Paying with ${MEMBER.bank}`);
          await sleep(700);
          setNora("Nora is placing your order");
          await step("place-order", "Placing your order");
        } else {
          p.say("Ready when you are");
          setNora(null);
          await sleep(1600);
          p.hide();
        }
      } catch {
        p.hide();
        setNora(null);
      }
    };
    go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const t = totals(lines);
  const tipAmt = tip === "custom" ? Math.max(0, Number(custom) || 0) : Math.round(t.member * tip) / 100;
  const tax = Math.round(t.member * TAX_RATE * 100) / 100;
  const total = t.member + tax + tipAmt;

  return (
    <div className="min-h-dvh">
      <ThemeSync />
      {pointer.node}
      {nora && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[96] flex -translate-x-1/2 animate-[fade-up_260ms_var(--ease-out)_both] items-center gap-3 rounded-full border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] py-1.5 pr-1.5 pl-2 shadow-[var(--shadow-float)]">
          <NoraAvatar size={30} status />
          <span className="text-[14px]">{nora}</span>
          <button
            className="btn btn-sm btn-outline h-8 rounded-full px-3 text-[13px]"
            onClick={() => {
              stopped.current = true;
              setNora(null);
            }}
          >
            Stop
          </button>
        </div>
      )}
      <header className="bar">
        <div className="mx-auto flex h-[64px] max-w-[1320px] items-center justify-between gap-4 px-5 md:px-10">
          <Wordmark href="/shop" />
          <ol className="hidden items-center gap-2 text-[13px] md:flex" aria-label="Checkout steps">
            {[
              { k: "Membership", done: session.member, on: phase === "gate" || phase === "welcome" },
              { k: "Delivery", done: false, on: phase === "order" },
              { k: "Payment", done: false, on: false },
            ].map((x, i) => (
              <li key={x.k} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-8 bg-[var(--color-hairline-strong)]" aria-hidden />}
                <span
                  className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                    x.done ? "bg-[var(--color-brass)] text-[var(--color-on-brass)]" : x.on ? "ring-1 ring-[var(--color-brass)] text-[var(--color-brass)]" : "ring-1 ring-[var(--color-hairline-strong)] text-[var(--color-muted)]"
                  }`}
                >
                  {x.done ? <Check size={13} strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span className={x.on || x.done ? "text-[var(--color-ivory)]" : "text-[var(--color-muted)]"}>{x.k}</span>
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
            <Lock size={14} aria-hidden />
            <span>
              Secure demo checkout<span className="max-lg:hidden">. No payment is taken.</span>
            </span>
          </p>
        </div>
      </header>

      <main className="container-club pt-10 pb-24">
        <Link href="/shop" className="inline-flex items-center gap-1 text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ivory)]">
          <ChevronLeft size={16} aria-hidden /> Back to the shop
        </Link>
        <h1 className="display mt-4 text-[40px] sm:text-[48px]">
          {phase === "gate" ? "Join the Club to check out" : phase === "welcome" ? "Membership active" : "Review your order"}
        </h1>
        {phase === "gate" && (
          <p className="mt-3 max-w-[60ch] text-[var(--color-muted)]">
            Checkout is for members. Join in a few steps, and member prices apply to this order straight away.
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
          <div className="min-w-0">
            {phase === "gate" && (
              <>
                {noraNote && (
                  <div className="mb-8 flex items-start gap-3 rounded-[14px] bg-[var(--color-raised)] p-4 ring-1 ring-[var(--color-hairline)]">
                    <NoraAvatar size={36} status />
                    <p className="text-[14px] leading-relaxed">
                      <span className="font-semibold">{PERSONA.name}</span>
                      <span className="text-[var(--color-muted)]"> · </span>
                      {noraNote}
                    </p>
                  </div>
                )}
                <div className="flex min-h-[560px] flex-col">
                  <MembershipFlow
                    compact
                    skipAccount={session.signedIn}
                    signInHref="/signin?next=/checkout"
                    onDone={() => {
                      session.join();
                      runAutopilot.current = false;
                      setNoraNote(null);
                      setPhase("welcome");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              </>
            )}

            {phase === "welcome" && <Welcome savings={t.savings} onContinue={() => setPhase("order")} />}

            {phase === "order" && (
              <div className="animate-[fade-up_420ms_var(--ease-out)_both]">
            <Section title="Deliver to">
              <fieldset className="grid gap-2 sm:grid-cols-2">
                <legend className="sr-only">Delivery address</legend>
                {ADDRESSES.map((a) => (
                  <label key={a.id} className="cursor-pointer">
                    <input type="radio" name="address" className="peer sr-only" checked={address === a.id} onChange={() => setAddress(a.id)} />
                    <span
                      data-nora={`address-${a.id}`}
                      className="flex h-full gap-3 rounded-[12px] border border-[var(--color-hairline-strong)] p-4 transition-colors peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brass)] hover:border-[var(--color-ivory)]/40"
                    >
                      <MapPin size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
                      <span>
                        <span className="flex items-baseline gap-2">
                          <span className="font-medium">{a.label}</span>
                          {a.note && <span className="text-[12px] text-[var(--color-faint)]">{a.note}</span>}
                        </span>
                        <span className="mt-0.5 block text-[14px] text-[var(--color-muted)]">{a.line}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Section>

            <Section title="Delivery window">
              <div role="tablist" aria-label="Delivery day" className="mb-4 inline-flex rounded-[10px] border border-[var(--color-hairline-strong)] p-1">
                {(Object.keys(SLOTS) as (keyof typeof SLOTS)[]).map((d) => (
                  <button
                    key={d}
                    data-nora={`day-${d}`}
                    role="tab"
                    aria-selected={day === d}
                    onClick={() => {
                      setDay(d);
                      setSlot(SLOTS[d][0]);
                    }}
                    className={`h-9 rounded-[7px] px-4 text-[14px] transition-colors ${day === d ? "bg-[var(--color-raised-2)] text-[var(--color-ivory)]" : "text-[var(--color-muted)] hover:text-[var(--color-ivory)]"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <fieldset>
                <legend className="sr-only">Time slot, {day}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {SLOTS[day].map((s) => (
                    <label key={s} className="cursor-pointer">
                      <input type="radio" name="slot" className="peer sr-only" checked={slot === s} onChange={() => setSlot(s)} />
                      <span data-nora={`slot-${s}`} className="tnum flex h-12 items-center justify-center rounded-[10px] border border-[var(--color-hairline-strong)] text-[14px] transition-colors peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brass)] hover:border-[var(--color-ivory)]/40">
                        {s}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Section>

            <Section title="Pay with" action={<button className="btn-text text-[14px]">Change</button>}>
              <div className="flex items-center gap-3" data-nora="pay-with">
                <span className="grid size-10 place-items-center rounded-[8px] border border-[var(--color-hairline-strong)] text-[var(--color-muted)]">
                  <Landmark size={18} strokeWidth={1.4} aria-hidden />
                </span>
                <div>
                  <p className="tnum">{MEMBER.bank}</p>
                  <p className="text-[13px] text-[var(--color-muted)]">Chase · Paid straight from your account (demo)</p>
                </div>
              </div>
            </Section>

            <Section title={`Items (${t.count})`} action={<Link href="/shop" className="btn-text text-[14px]">Keep shopping</Link>}>
              <ul className="divide-y divide-[var(--color-hairline)]">
                {lines.map((l) => {
                  const p = byId(l.id);
                  return (
                    <li key={l.id} className="grid grid-cols-[72px_1fr] gap-4 py-4 first:pt-0 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                      <div className="size-[72px] overflow-hidden rounded-[10px] border border-[var(--color-hairline)]">
                        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-[13px] text-[var(--color-muted)]">{p.brand} · {p.format}</p>
                        <div className="mt-2">
                          <Stepper qty={l.qty} label={p.name} onChange={(q) => setLineQty(l.id, q)} />
                        </div>
                      </div>
                      <div className="col-start-2 flex sm:col-start-3 max-sm:[&>div]:items-start">
                        <LinePrice p={p} qty={l.qty} size={22} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <section className="border-t border-[var(--color-hairline)] pt-8">
              <label className="flex cursor-pointer items-start justify-between gap-6">
                <span className="flex gap-3">
                  <Repeat size={18} strokeWidth={1.4} className="mt-1 shrink-0 text-[var(--color-brass)]" aria-hidden />
                  <span>
                    <span className="display block text-[24px] leading-tight">Make this monthly</span>
                    <span className="mt-1 block text-[14px] text-[var(--color-muted)]">
                      The same box arrives every month. Edit, skip or pause anytime.
                    </span>
                  </span>
                </span>
                <input type="checkbox" role="switch" className="peer sr-only" checked={monthly} onChange={(e) => setMonthly(e.target.checked)} />
                <span
                  className="relative mt-1 h-7 w-12 shrink-0 rounded-full border border-[var(--color-hairline-strong)] transition-colors peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brass)] after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-[var(--color-muted)] after:transition-all after:duration-200 peer-checked:after:left-[23px] peer-checked:after:bg-[var(--color-ink)]"
                  aria-hidden
                />
              </label>
              {monthly && (
                <p className="mt-3 ml-8 animate-[fade-up_240ms_var(--ease-out)_both] text-[14px] text-[var(--color-ivory)]/85">
                  Next box: <span className="tnum">December 7, 2026</span>. You&rsquo;ll get a text two days before.
                </p>
              )}
            </section>
              </div>
            )}
          </div>

          {/* Summary */}
          {phase !== "order" ? (
            <GateSummary joined={phase === "welcome"} />
          ) : (
          <aside className="lg:sticky lg:top-8 lg:self-start" aria-label="Order summary">
            <div className="rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-6 sm:p-7">
              <h2 className="display text-[26px]">Summary</h2>
              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-muted)]">Items ({t.count}) at retail</dt>
                  <dd className="tnum text-[var(--color-muted)] line-through">{money(t.retail)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Member savings</dt>
                  <dd className="tnum text-[var(--color-brass)]">−{money(t.savings)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>Free</dd>
                </div>
              </dl>

              <fieldset className="mt-6 border-t border-[var(--color-hairline)] pt-5">
                <legend className="flex w-full items-baseline justify-between text-[15px]">
                  <span>Driver tip</span>
                </legend>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[...TIPS, "custom" as const].map((v) => (
                    <label key={v} className="cursor-pointer">
                      <input type="radio" name="tip" className="peer sr-only" checked={tip === v} onChange={() => setTip(v)} />
                      <span className="tnum flex h-11 items-center justify-center rounded-[10px] border border-[var(--color-hairline-strong)] text-[14px] transition-colors peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/12 peer-checked:text-[var(--color-ivory)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brass)] text-[var(--color-muted)] hover:border-[var(--color-ivory)]/40">
                        {v === "custom" ? "Custom" : `${v}%`}
                      </span>
                    </label>
                  ))}
                </div>
                {tip === "custom" && (
                  <div className="relative mt-3">
                    <label htmlFor="tip-custom" className="sr-only">Custom tip in dollars</label>
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-muted)]">$</span>
                    <input id="tip-custom" inputMode="decimal" value={custom} onChange={(e) => setCustom(e.target.value)} className="field tnum pl-8" />
                  </div>
                )}
                <p className="mt-3 flex justify-between text-[15px]">
                  <span className="text-[var(--color-muted)]">Tip</span>
                  <span className="tnum">{money(tipAmt)}</span>
                </p>
              </fieldset>

              <dl className="mt-3 space-y-3 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-[var(--color-muted)]">Estimated tax <span className="text-[12px]">(demo rate {(TAX_RATE * 100).toFixed(1)}%)</span></dt>
                  <dd className="tnum">{money(tax)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-[var(--color-hairline)] pt-4">
                  <dt className="text-[17px] font-medium">Total</dt>
                  <dd className="num text-[36px] leading-none">{money(total)}</dd>
                </div>
              </dl>

              <button
                data-nora="place-order"
                className="btn btn-lg btn-primary mt-6 w-full"
                disabled={placing || lines.length === 0}
                onClick={() => {
                  setPlacing(true);
                  const where = ADDRESSES.find((a) => a.id === address)?.label ?? "";
                  setTimeout(() => router.push(`/orders/CL-20512?tip=${tipAmt.toFixed(2)}&window=${encodeURIComponent(`${day} ${slot}`)}&to=${encodeURIComponent(where)}`), 700);
                }}
              >
                {placing ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-[var(--color-ink)]/30 border-t-[var(--color-ink)]" aria-hidden />
                    Placing order…
                  </>
                ) : (
                  "Place order"
                )}
              </button>
              <p className="mt-4 text-center text-[13px] text-[var(--color-muted)]">Your driver will check your ID at the door.</p>
            </div>
          </aside>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
