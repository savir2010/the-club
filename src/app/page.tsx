import Link from "next/link";
import { MessageCircle, CircleCheck, Car } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { NoraAvatar } from "@/components/brand";
import { money, PLANS } from "@/lib/data";
import { LandingBackground, RevealOnScroll } from "@/components/LandingMotion";

const STEPS = [
  {
    icon: MessageCircle,
    title: "Text or talk to your concierge",
    body: "Say what the evening calls for, in your own words. No menu to decode.",
  },
  {
    icon: CircleCheck,
    title: "Approve your cart with one tap",
    body: "Retail and member prices side by side, delivery included. Change anything first.",
  },
  {
    icon: Car,
    title: "A licensed courier delivers it",
    body: "Your driver checks ID at the door. Track the car from the moment it leaves.",
  },
];

const BENEFITS = [
  { title: "Member pricing on every item", body: "Every product, every order, at the member price." },
  { title: "Free delivery", body: "No delivery fee on any order. Tip your driver if you like." },
  { title: "Subscribe & Save on your staples", body: "Put favorites on repeat, every 1 to 8 weeks, for up to 10% more off. Skip or cancel anytime." },
  { title: "A concierge who knows your taste", body: "Nora remembers what you like and reorders in one message." },
];

export default function Home() {
  return (
    <div className="relative isolate">
      <LandingBackground />
      <RevealOnScroll />
      <SiteHeader variant="overlay" />
      <main>
        {/* Hero — centred over the molten brass layer */}
        <section className="relative flex h-[100svh] min-h-[620px] items-center justify-center overflow-hidden">
          <div
            className="container-club flex flex-col items-center text-center"
            style={{
              opacity: "calc(1 - var(--hero-out, 0) * 1.5)",
              transform: "translateY(calc(var(--hero-out, 0) * -72px)) scale(calc(1 - var(--hero-out, 0) * 0.04))",
            }}
          >
            <h1 className="display max-w-[12ch] font-medium tracking-[-0.045em] animate-[fade-up_900ms_var(--ease-out)_both] text-[54px] leading-[1.02] sm:text-[80px] lg:text-[104px]">
              Your personal cannabis concierge
            </h1>
            <p className="mt-7 max-w-[38ch] animate-[fade-up_900ms_var(--ease-out)_160ms_both] text-[17px] leading-relaxed text-[var(--color-ivory)]/80 sm:text-[19px]">
              Tell us what you want. We bring it to your door. Browse the whole shelf, then join when you check out.
            </p>
            <div className="mt-10 flex animate-[fade-up_900ms_var(--ease-out)_300ms_both] flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn btn-lg btn-primary rounded-full px-8">
                Start shopping
              </Link>
              <Link href="/signin" className="btn btn-lg btn-outline rounded-full bg-[var(--color-raised)]/60 px-8 backdrop-blur-sm">
                Sign in
              </Link>
            </div>
          </div>
          <div
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[12px] text-[var(--color-muted)]"
            style={{ opacity: "calc(1 - var(--hero-out, 0) * 4)" }}
            aria-hidden
          >
            <span>Scroll</span>
            <span className="relative h-10 w-px overflow-hidden bg-[var(--color-ivory)]/15">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-[var(--color-brass)] motion-safe:animate-[scroll-cue_2.2s_var(--ease-out)_infinite]" />
            </span>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]/92">
          <div data-reveal className="container-club grid gap-14 py-24 sm:py-32 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="how" className="display text-[38px] sm:text-[48px]">
                How it works
              </h2>
              <p className="mt-5 max-w-[38ch] text-[var(--color-muted)]">
                Your concierge knows the shelf, asks a question or two and fills the cart while you
                watch.
              </p>

              {/* A glimpse of the concierge at work (illustrative) */}
              <figure className="mt-12 max-w-[420px] rounded-[var(--radius-panel)] border border-[var(--color-hairline)] bg-[var(--color-raised)] p-5">
                <div className="flex justify-end">
                  <p className="max-w-[80%] rounded-[14px] rounded-br-[4px] bg-[var(--color-raised-2)] px-4 py-2.5 text-[15px]">
                    Something gentle for six friends on Saturday?
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <NoraAvatar size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-relaxed text-[var(--color-ivory)]/90">
                      Live rosin gummies are easy to pace. Start with one piece, then wait two hours.
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--color-hairline)] pt-3">
                      <div>
                        <p className="text-[14px]">Pink Lemonade Live Rosin Gummies</p>
                        <p className="text-[12px] text-[var(--color-muted)]">Copperstate · 100 mg pack</p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="tnum text-[13px] text-[var(--color-muted)] line-through">{money(30)}</span>
                        <span className="num text-[22px] text-[var(--color-brass)]">{money(27)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <figcaption className="sr-only">An example exchange with Nora, the concierge</figcaption>
              </figure>
            </div>

            <ol className="lg:col-span-6 lg:col-start-7 lg:pt-3">
              {STEPS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="grid grid-cols-[48px_1fr] gap-x-5 border-t border-[var(--color-hairline)] py-9 last:border-b"
                >
                  <span className="grid size-12 place-items-center rounded-full border border-[var(--color-brass)]/45 text-[var(--color-brass)]">
                    <Icon size={20} strokeWidth={1.25} aria-hidden />
                  </span>
                  <div>
                    <h3 className="display text-[28px] leading-[1.15] sm:text-[30px]">{title}</h3>
                    <p className="mt-2 max-w-[44ch] text-[var(--color-muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Member benefits — the one light editorial section */}
        <section aria-labelledby="benefits" className="bg-[var(--color-light)] text-[var(--color-ink)]">
          <div data-reveal className="container-club grid gap-14 py-24 sm:py-32 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="benefits" className="display text-[38px] sm:text-[48px]">
                What membership includes
              </h2>
              <div className="mt-10 max-w-[360px] border-t border-[#2b261f]/15 pt-6">
                <p className="text-[13px] text-[#2b261f]/65">LA Baker Limited Harvest · 3.5 g</p>
                <dl className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[14px] text-[#2b261f]/70">Retail</dt>
                    <dd className="tnum text-[15px] text-[#2b261f]/60 line-through">{money(38)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[14px] text-[#2b261f]/70">Member</dt>
                    <dd className="num text-[30px] leading-none text-[var(--color-brass-lo)]">{money(34.2)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-[#2b261f]/10 pt-3">
                    <dt className="text-[14px] text-[#2b261f]/70">Delivery</dt>
                    <dd className="text-[15px] font-medium">Free</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[12px] text-[#2b261f]/60">Example pricing from the demo catalog.</p>
              </div>
            </div>
            <ul className="grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:col-span-7">
              {BENEFITS.map((b) => (
                <li key={b.title} className="border-t border-[#2b261f]/20 pt-5">
                  <h3 className="display text-[26px] leading-[1.1]">{b.title}</h3>
                  <p className="mt-3 max-w-[34ch] text-[15px] text-[#2b261f]/70">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interlude — the molten layer shows through again */}
        <section aria-label="Interlude" className="relative grid min-h-[78svh] place-items-center overflow-hidden">
          <div data-reveal className="container-club text-center">
            <p className="display mx-auto max-w-[16ch] text-[44px] leading-[1.08] text-[var(--color-ivory)] sm:text-[72px] lg:text-[88px]">
              Ask the way you&rsquo;d ask a friend who knows.
            </p>
            <p className="mx-auto mt-8 max-w-[44ch] text-[16px] text-[var(--color-ivory)]/75">
              No menu to decode. Nora explains it plainly, then fills the cart.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section aria-labelledby="plans" className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]/94">
          <div data-reveal className="container-club py-24 sm:py-32">
          <div className="mx-auto max-w-[560px] text-center">
            <h2 id="plans" className="display text-[38px] sm:text-[48px]">
              Membership
            </h2>
            <p className="mt-5 text-[var(--color-muted)]">
              One fee, member pricing on everything, free delivery. Shop first and join at checkout.
            </p>
          </div>
          <div className="mx-auto mt-14 grid max-w-[980px] gap-5 md:grid-cols-2">
            {[
              { ...PLANS[0], primary: false },
              { ...PLANS[1], primary: true },
            ].map((plan) => (
              <article
                key={plan.name}
                className={`flex flex-col rounded-[var(--radius-panel)] border p-8 sm:p-10 ${
                  plan.primary
                    ? "border-[var(--color-brass)]/55 bg-[var(--color-raised)]"
                    : "border-[var(--color-hairline-strong)]"
                }`}
              >
                <h3 className="display text-[30px]">{plan.name}</h3>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="num text-[48px] leading-none text-[var(--color-ivory)]">${plan.perMonth % 1 ? plan.perMonth.toFixed(2) : plan.perMonth}</span>
                  <span className="text-[var(--color-muted)]">per month</span>
                </p>
                <p className="mt-2 text-[14px] text-[var(--color-muted)]">{plan.billed}</p>
                <ul className="mt-8 space-y-3 border-t border-[var(--color-hairline)] pt-6 text-[15px]">
                  {BENEFITS.map((b) => (
                    <li key={b.title} className="flex gap-3">
                      <CircleCheck size={18} strokeWidth={1.25} className="mt-0.5 shrink-0 text-[var(--color-brass)]" aria-hidden />
                      {b.title}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/shop"
                  className={`btn btn-lg mt-10 rounded-full ${plan.primary ? "btn-primary" : "btn-outline"}`}
                >
                  Start shopping
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-[13px] text-[var(--color-faint)]">Demo pricing. Fees are set by the Club before launch.</p>
          </div>
        </section>
      </main>
      <div className="bg-[var(--color-canvas)]">
        <SiteFooter />
      </div>
    </div>
  );
}
