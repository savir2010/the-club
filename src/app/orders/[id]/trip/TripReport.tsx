"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEMBER, money } from "@/lib/data";
import { buildTrip, clock, COMPLIANCE, fallbackOrder, loadOrder, type Check, type Trip } from "@/lib/trip";
import { Monogram } from "@/components/brand";
import { SiteFooter } from "@/components/SiteChrome";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ThemeSync } from "@/components/shop/ThemeToggle";

type SectionKey = Exclude<keyof typeof COMPLIANCE.sections, "_note">;

const longDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
const stamp = (d: Date) =>
  d.toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" });

const label = "text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-muted)]";

/** Why a section exists: the rule it answers to, shown in the margin (stacked above the body on small screens). */
function Basis({ k }: { k: SectionKey }) {
  const b = COMPLIANCE.sections[k];
  const internal = b.cite === "Internal control";
  return (
    <aside
      aria-label="Regulatory basis"
      className="border-l-2 border-[var(--color-brass)]/60 bg-[var(--color-canvas)] py-3 pr-3 pl-4 lg:bg-transparent lg:py-0.5 print:bg-transparent"
    >
      <p className={`${label} text-[10px]`}>
        {internal ? "Basis" : "Required by"}
      </p>
      <p className={`tnum mt-1.5 text-[13px] font-semibold ${internal ? "text-[var(--color-muted)]" : "text-[var(--color-brass)]"}`}>{b.cite}</p>
      <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[var(--color-muted)]">{b.why}</p>
    </aside>
  );
}

function Section({ n, title, k, children }: { n: number; title: string; k: SectionKey; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-[var(--color-hairline-strong)] px-6 py-8 sm:px-10 print:px-0">
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_236px] print:grid-cols-[minmax(0,1fr)_180px]">
        <div className="min-w-0">
          <h2 className="mb-5 flex items-baseline gap-3">
            <span className="tnum text-[15px] leading-none font-medium text-[var(--color-brass)]">§&nbsp;{n}</span>
            <span className="text-[13px] font-semibold tracking-[0.12em] uppercase">{title}</span>
          </h2>
          <div className="lg:hidden print:hidden mb-5">
            <Basis k={k} />
          </div>
          {children}
        </div>
        <div className="hidden lg:block print:block">
          <Basis k={k} />
        </div>
      </div>
    </section>
  );
}

function Field({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className={`${label} text-[10px]`}>{k}</dt>
      <dd className={`mt-1 text-[14px] leading-snug ${mono ? "tnum" : ""}`}>{v}</dd>
    </div>
  );
}

const RESULT = {
  pass: { text: "Pass", cls: "border-[var(--color-sage)]/50 text-[var(--color-sage)]" },
  pending: { text: "At hand-off", cls: "border-[var(--color-brass)]/50 text-[var(--color-brass)]" },
  fail: { text: "Fail", cls: "border-[var(--color-clay)]/60 text-[var(--color-clay)]" },
} as const;

function Result({ s }: { s: Check["status"] }) {
  const r = RESULT[s];
  return <span className={`inline-block rounded-[4px] border px-1.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase ${r.cls}`}>{r.text}</span>;
}

function Signature({ role, name, note }: { role: string; name?: string; note: string }) {
  return (
    <div>
      <div className="flex h-11 items-end border-b border-[var(--color-ivory)]/50 pb-1.5">
        {name && <span className="text-[18px] font-light italic text-[var(--color-ivory)]/75">{name}</span>}
      </div>
      <p className="mt-2 text-[13px] font-medium">{role}</p>
      <p className="tnum text-[12px] text-[var(--color-muted)]">{note}</p>
    </div>
  );
}

const th = "py-2 pr-4 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--color-muted)] whitespace-nowrap";
const td = "py-2.5 pr-4 align-top whitespace-nowrap";
const tableWrap = "-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0";
const thead = "border-y border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] print:bg-transparent";

export function TripReport({ id }: { id: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    const o = loadOrder(id);
    setSaved(!!o);
    setTrip(buildTrip(o ?? fallbackOrder(id)));
  }, [id]);

  if (!trip) {
    return (
      <div className="min-h-dvh">
        <ThemeSync />
        <ShopHeader />
        <main className="container-club py-24 text-[var(--color-muted)]">Preparing trip report…</main>
      </div>
    );
  }

  const { order, driver, vehicle, route, log } = trip;
  const passed = trip.checks.filter((c) => c.status === "pass").length;
  const pending = trip.checks.filter((c) => c.status === "pending").length;
  const failed = trip.checks.some((c) => c.status === "fail");
  const pct = Math.min(100, (trip.retailValue / trip.cap) * 100);
  const dayValue = log.reduce((s, l) => s + l.retailValue, 0);
  const P = COMPLIANCE.premises;

  return (
    <div className="min-h-dvh print:bg-white">
      <ThemeSync />
      <div className="print:hidden">
        <ShopHeader />
      </div>

      <main className="container-club pt-10 pb-24 print:p-0">
        {/* Toolbar */}
        <div className="mx-auto mb-6 flex max-w-[1060px] flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/orders/${order.id}`} className="btn-text text-[14px]">
            Back to order {order.id}
          </Link>
          <button className="btn btn-sm btn-outline" onClick={() => window.print()}>
            Print or save PDF
          </button>
        </div>

        {!saved && (
          <p className="mx-auto mb-6 max-w-[1060px] rounded-none border border-[var(--color-hairline-strong)] p-3.5 text-[14px] text-[var(--color-muted)] print:hidden">
            This order wasn&rsquo;t placed in this browser, so the report shows the member&rsquo;s usual order as sample contents.
          </p>
        )}

        <article className="mx-auto max-w-[1060px] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.12)] print:max-w-none print:border-0 print:shadow-none">
          {/* Classification bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--color-ink)] px-6 py-2 text-[10.5px] font-semibold tracking-[0.14em] text-[var(--color-canvas)] uppercase sm:px-10 print:bg-black print:text-white">
            <span>Regulatory record · Transportation</span>
            <span>Demo · fictional data</span>
          </div>

          {/* Letterhead */}
          <header className="px-6 pt-8 pb-8 sm:px-10 print:px-0">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="flex items-start gap-4">
                <Monogram size={44} plain />
                <div>
                  <p className="text-[15px] font-semibold">{P.name}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">{P.address}</p>
                  <p className="tnum mt-0.5 text-[13px] text-[var(--color-muted)]">
                    License {P.license} · {COMPLIANCE.license_type}
                  </p>
                </div>
              </div>

              {/* Document control */}
              <table className="tnum text-[12px]">
                <tbody>
                  {[
                    ["Document no.", trip.tripId],
                    ["Order ref.", order.id],
                    ["Trip date", shortDate(trip.date)],
                    ["Generated", stamp(trip.generatedAt)],
                    ["Revision", "1 · pre-departure"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="py-0.5 pr-4 text-left font-normal text-[var(--color-muted)]">{k}</th>
                      <td className="py-0.5 text-right font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-9 border-t-2 border-[var(--color-ivory)] pt-5">
              <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.015em] sm:text-[34px]">Delivery Trip Report</h1>
              <p className="mt-1.5 text-[14px] text-[var(--color-muted)]">
                Consumer delivery under {COMPLIANCE.rule_set} · Trip plan, vehicle register, daily usage record and attached order
              </p>
            </div>

            {/* Status + key figures */}
            <div className="mt-7 grid border border-[var(--color-hairline-strong)] sm:grid-cols-[1.25fr_1fr_1fr_1fr]">
              <div className={`p-4 ${failed ? "bg-[var(--color-clay)]/10" : "bg-[var(--color-sage)]/10"}`}>
                <p className={`${label} text-[10px]`}>Status</p>
                <p className={`mt-1.5 text-[16px] font-semibold ${failed ? "text-[var(--color-clay)]" : "text-[var(--color-sage)]"}`}>
                  {failed ? "Hold: limit exceeded" : "Cleared to depart"}
                </p>
                <p className="tnum mt-0.5 text-[12px] text-[var(--color-muted)]">
                  {passed} passed · {pending} at hand-off{failed ? " · 1 failed" : ""}
                </p>
              </div>
              {[
                { k: "Retail value on board", v: money(trip.retailValue), s: `${(Math.round(pct * 10) / 10).toFixed(1)}% of ${money(trip.cap).replace(".00", "")} limit` },
                { k: "Vehicle", v: `${vehicle.unit} · ${vehicle.plate}`, s: `${vehicle.year} ${vehicle.make} ${vehicle.model}` },
                { k: "Delivery agent", v: driver.name, s: `Card ${driver.card}` },
              ].map((x) => (
                <div key={x.k} className="border-t border-[var(--color-hairline-strong)] p-4 sm:border-t-0 sm:border-l">
                  <p className={`${label} text-[10px]`}>{x.k}</p>
                  <p className="tnum mt-1.5 text-[16px] font-semibold">{x.v}</p>
                  <p className="tnum mt-0.5 text-[12px] text-[var(--color-muted)]">{x.s}</p>
                </div>
              ))}
            </div>
          </header>

          {/* §1 Trip plan */}
          <Section n={1} title="Trip plan" k="trip_plan">
            <div className={tableWrap}>
              <table className="tnum w-full min-w-[560px] text-[14px]">
                <thead className={thead}>
                  <tr>
                    <th className={`${th} pl-3`}>Leg</th>
                    <th className={th}>Planned</th>
                    <th className={th}>Actual</th>
                    <th className={`${th} w-full`}>Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {[
                    { leg: "Depart premises", t: route.depart, a: "Logged at departure", loc: route.from },
                    { leg: `Deliver (${route.toLabel})`, t: route.arrive, a: "Logged at hand-off", loc: `${route.to} · window ${order.slot}` },
                    { leg: "Return to premises", t: route.returnAt, a: "Logged on return", loc: "Licensed premises (post-trip update)" },
                  ].map((r) => (
                    <tr key={r.leg}>
                      <td className={`${td} pl-3 font-medium`}>{r.leg}</td>
                      <td className={td}>{clock(r.t)}</td>
                      <td className={`${td} text-[var(--color-faint)]`}>{r.a}</td>
                      <td className="py-2.5 pr-3 align-top text-[var(--color-muted)]">{r.loc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Field k="Trip date" v={longDate(trip.date)} />
              <Field k="Stops" v="1 (direct)" />
              <Field k="Anticipated route" v={`${route.miles} mi each way, ~${route.driveMin} min`} mono />
              <Field k="Seal no." v={trip.seal} mono />
            </dl>
          </Section>

          {/* §2 Vehicle register */}
          <Section n={2} title="Vehicle register" k="register">
            <div className={tableWrap}>
              <table className="tnum w-full min-w-[560px] text-[14px]">
                <thead className={thead}>
                  <tr>
                    <th className={`${th} pl-3`}>Unit</th>
                    <th className={th}>Year</th>
                    <th className={th}>Make</th>
                    <th className={th}>Model</th>
                    <th className={th}>Color</th>
                    <th className={th}>AZ plate</th>
                    <th className={th}>VIN (last 6)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {COMPLIANCE.fleet.map((v) => {
                    const on = v.unit === vehicle.unit;
                    return (
                      <tr key={v.unit} className={on ? "bg-[var(--color-brass)]/10 font-semibold" : "text-[var(--color-muted)]"}>
                        <td className={`${td} pl-3`}>
                          {on && <span className="mr-1.5 text-[var(--color-brass)]" aria-hidden>▸</span>}
                          {v.unit}
                          {on && <span className="sr-only"> (assigned to this trip)</span>}
                        </td>
                        <td className={td}>{v.year}</td>
                        <td className={td}>{v.make}</td>
                        <td className={td}>{v.model}</td>
                        <td className={td}>{v.color}</td>
                        <td className={td}>{v.plate}</td>
                        <td className={td}>{v.vin6}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-[var(--color-faint)]">▸ marks the vehicle assigned to this trip.</p>
          </Section>

          {/* §3 Daily usage record */}
          <Section n={3} title={`Daily vehicle usage record · ${vehicle.unit}`} k="usage">
            <p className="mb-4 text-[13px] text-[var(--color-muted)]">{longDate(trip.date)}</p>
            <div className={tableWrap}>
              <table className="tnum w-full min-w-[600px] text-[14px]">
                <thead className={thead}>
                  <tr>
                    <th className={`${th} pl-3`}>Trip</th>
                    <th className={th}>Delivery agent</th>
                    <th className={th}>Out</th>
                    <th className={th}>In</th>
                    <th className={th}>Stops</th>
                    <th className={`${th} pr-3 text-right`}>Retail value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {log.map((l) => (
                    <tr key={l.trip} className={l.current ? "bg-[var(--color-brass)]/10 font-semibold" : ""}>
                      <td className={`${td} pl-3`}>{l.trip}</td>
                      <td className={td}>{l.driver}</td>
                      <td className={td}>{clock(l.out)}</td>
                      <td className={td}>{l.back == null ? <span className="text-[var(--color-brass)]">Open</span> : clock(l.back)}</td>
                      <td className={td}>{l.stops}</td>
                      <td className={`${td} pr-3 text-right`}>{money(l.retailValue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[var(--color-ivory)]/70">
                  <tr>
                    <td colSpan={5} className="py-2.5 pl-3 text-[13px] text-[var(--color-muted)]">
                      Total · {log.length} {log.length === 1 ? "trip" : "trips"}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{money(dayValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>

          {/* §4 Order copy */}
          <Section n={4} title="Consumer order · copy attached to trip plan" k="order">
            <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              <Field k="Order no." v={order.id} mono />
              <Field k="Consumer" v={`${MEMBER.first} ${MEMBER.last}`} />
              <Field k="Placed" v={stamp(new Date(order.placedAt))} mono />
              <Field k="Deliver to" v={route.to} />
            </dl>
            <div className={tableWrap}>
              <table className="w-full min-w-[640px] text-[14px]">
                <thead className={thead}>
                  <tr>
                    <th className={`${th} pl-3`}>Product</th>
                    <th className={th}>Category</th>
                    <th className={th}>Size</th>
                    <th className={th}>Potency</th>
                    <th className={`${th} text-right`}>Qty</th>
                    <th className={`${th} text-right`}>Retail ea.</th>
                    <th className={`${th} pr-3 text-right`}>Retail value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {trip.items.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5 pr-4 pl-3 align-top">
                        <p className="font-medium">{i.name}</p>
                        <p className="tnum text-[12px] text-[var(--color-muted)]">
                          {i.brand} · SKU {i.id}
                        </p>
                      </td>
                      <td className={td}>{i.category}</td>
                      <td className={td}>{i.format}</td>
                      <td className={`${td} tnum`}>{i.potency}</td>
                      <td className={`${td} tnum text-right`}>{i.qty}</td>
                      <td className={`${td} tnum text-right`}>{money(i.retailEach)}</td>
                      <td className={`${td} tnum pr-3 text-right`}>{money(i.retailValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="tnum mt-4 ml-auto max-w-[360px] text-[14px]">
              <div className="flex justify-between border-t-2 border-[var(--color-ivory)]/70 py-2.5 font-semibold">
                <dt>Retail value of regulated products</dt>
                <dd>{money(trip.retailValue)}</dd>
              </div>
              <div className="flex justify-between py-1 text-[13px] text-[var(--color-muted)]">
                <dt>Charged to member (member price)</dt>
                <dd>{money(order.charged)}</dd>
              </div>
              <div className="flex justify-between py-1 text-[13px] text-[var(--color-muted)]">
                <dt>Order total incl. tax and tip</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </Section>

          {/* §5 Retail value limit */}
          <Section n={5} title="Vehicle retail value limit" k="limit">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={`${label} text-[10px]`}>Aggregate retail value in vehicle</p>
                <p className="tnum mt-1 text-[28px] leading-none font-semibold">
                  {money(trip.retailValue)}
                  <span className="ml-2 text-[14px] font-normal text-[var(--color-muted)]">/ {money(trip.cap)}</span>
                </p>
              </div>
              <Result s={failed ? "fail" : "pass"} />
            </div>
            <div
              className="relative mt-4 h-2 bg-[var(--color-hairline-strong)]"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={trip.cap}
              aria-valuenow={trip.retailValue}
              aria-label="Retail value in vehicle against the limit"
            >
              <div className={`h-full ${failed ? "bg-[var(--color-clay)]" : "bg-[var(--color-brass)]"}`} style={{ width: `${Math.max(pct, 0.6)}%` }} />
            </div>
            <div className="tnum mt-1.5 flex justify-between text-[11px] text-[var(--color-faint)]">
              <span>$0</span>
              <span>{money(Math.max(0, trip.cap - trip.retailValue))} headroom</span>
              <span>{money(trip.cap).replace(".00", "")} limit</span>
            </div>
          </Section>

          {/* §6 Checks */}
          <Section n={6} title="Vehicle, security and record checks" k="checks">
            <div className={tableWrap}>
              <table className="w-full min-w-[620px] text-[14px]">
                <thead className={thead}>
                  <tr>
                    <th className={`${th} pl-3`}>#</th>
                    <th className={th}>Requirement and evidence</th>
                    <th className={th}>Rule</th>
                    <th className={`${th} pr-3 text-right`}>Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {trip.checks.map((c, i) => (
                    <tr key={c.label}>
                      <td className="tnum py-3 pr-3 pl-3 align-top text-[12px] text-[var(--color-faint)]">{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-medium">{c.label}</p>
                        <p className="tnum mt-0.5 text-[12.5px] text-[var(--color-muted)]">{c.detail}</p>
                      </td>
                      <td className="tnum py-3 pr-4 align-top text-[12px] whitespace-nowrap text-[var(--color-muted)]">{c.cite}</td>
                      <td className="py-3 pr-3 text-right align-top">
                        <Result s={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* §7 Chain of custody */}
          <Section n={7} title="Chain of custody and sign-off" k="custody">
            <div className="grid gap-8 sm:grid-cols-3">
              <Signature role="Loaded and sealed by" name="J. Ramos" note={`Dispensary agent · ${clock(route.depart - 10)}`} />
              <Signature role="Received and transported by" name={driver.name} note={`Delivery agent ${driver.card} · ${clock(route.depart)}`} />
              <Signature role="ID checked and received by" note="Consumer, 21+ · signed at hand-off" />
            </div>
          </Section>

          {/* §8 References */}
          <Section n={8} title="Regulatory references" k="references">
            <div className={tableWrap}>
              <table className="w-full min-w-[480px] text-[13.5px]">
                <thead className={thead}>
                  <tr>
                    <th className={`${th} pl-3`}>Citation</th>
                    <th className={th}>Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)]">
                  {COMPLIANCE.references.map((r) => (
                    <tr key={r.cite}>
                      <td className="tnum py-2.5 pr-6 pl-3 align-top font-semibold whitespace-nowrap">{r.cite}</td>
                      <td className="py-2.5 pr-3 align-top text-[var(--color-muted)]">{r.subject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Attestation footer */}
          <footer className="border-t-2 border-[var(--color-ivory)] px-6 py-6 sm:px-10 print:px-0">
            <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
              {COMPLIANCE.records_retention_note} Inspection requests: {P.inspection_contact}.
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--color-faint)]">
              Demo only. The licensee, license number, fleet, delivery agents and trips are fictional and randomly generated. Citations and margin notes
              follow the client&rsquo;s research summary and must be confirmed against the current ADHS rules by Arizona regulatory counsel before use.
            </p>
            <div className="tnum mt-5 flex flex-wrap justify-between gap-2 border-t border-[var(--color-hairline)] pt-3 text-[11px] text-[var(--color-faint)]">
              <span>{trip.tripId} · Rev. 1</span>
              <span>Generated {stamp(trip.generatedAt)}</span>
            </div>
          </footer>
        </article>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}
